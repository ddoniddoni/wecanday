import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import { deleteCurrentAccount } from '@/features/auth/services/accountDeletionService';
import {
  clearDeletedUserData,
  clearSignedOutUserData,
} from '@/features/auth/services/localAccountCleanup';
import { loadAndSyncOwnProfile } from '@/features/auth/services/profileService';
import { disableCurrentDevicePushToken } from '@/features/notifications/services/devicePushTokenService';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database, ProfileRow } from '@/lib/supabase/database.types';

type AuthState =
  | { status: 'configuration_error' }
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'profile_error' }
  | { status: 'signed_in'; profile: ProfileRow; userId: string };

type AuthContextValue = AuthState & {
  replaceProfile: (profile: ProfileRow) => void;
  retry: () => void;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = PropsWithChildren<{
  client?: SupabaseClient<Database> | null;
}>;

async function resolveAuthenticatedState(
  client: SupabaseClient<Database>,
  userId: string | null,
): Promise<AuthState> {
  if (!userId) {
    return { status: 'signed_out' };
  }

  try {
    const profile = await loadAndSyncOwnProfile(client, userId);
    return { status: 'signed_in', profile, userId };
  } catch {
    return { status: 'profile_error' };
  }
}

export function AuthProvider({
  children,
  client = supabaseClient,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() =>
    client ? { status: 'loading' } : { status: 'configuration_error' },
  );

  useEffect(() => {
    if (!client) {
      return;
    }

    const activeClient = client;
    let isActive = true;

    function applyUser(userId: string | null) {
      setState({ status: 'loading' });
      void resolveAuthenticatedState(activeClient, userId).then((nextState) => {
        if (isActive) {
          setState(nextState);
        }
      });
    }

    void activeClient.auth.getUser().then(({ data }) => {
      if (isActive) {
        applyUser(data.user?.id ?? null);
      }
    });

    const {
      data: { subscription },
    } = activeClient.auth.onAuthStateChange((_event, session) => {
      if (isActive) {
        applyUser(session?.user.id ?? null);
      }
    });
    const appStateSubscription =
      Platform.OS === 'web'
        ? null
        : AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
              activeClient.auth.startAutoRefresh();
            } else {
              activeClient.auth.stopAutoRefresh();
            }
          });

    if (Platform.OS !== 'web') {
      activeClient.auth.startAutoRefresh();
    }

    return () => {
      isActive = false;
      subscription.unsubscribe();
      appStateSubscription?.remove();

      if (Platform.OS !== 'web') {
        activeClient.auth.stopAutoRefresh();
      }
    };
  }, [client]);

  function retry() {
    if (!client) {
      setState({ status: 'configuration_error' });
      return;
    }

    setState({ status: 'loading' });
    void client.auth.getUser().then(({ data }) => {
      void resolveAuthenticatedState(client, data.user?.id ?? null).then(
        setState,
      );
    });
  }

  async function signOut() {
    if (!client) {
      throw new AuthDomainError('AUTH_CONFIGURATION_MISSING');
    }

    if (state.status === 'signed_in') {
      await Promise.allSettled([
        disableCurrentDevicePushToken(client),
        clearSignedOutUserData(state.userId),
      ]);
    }

    const { error } = await client.auth.signOut({ scope: 'local' });

    if (error) {
      throw new AuthDomainError('AUTH_PROVIDER_FAILED');
    }
  }

  async function deleteAccount() {
    if (!client || state.status !== 'signed_in') {
      throw new AuthDomainError('ACCOUNT_DELETION_FAILED');
    }

    try {
      await deleteCurrentAccount(client);
    } catch {
      throw new AuthDomainError('ACCOUNT_DELETION_FAILED');
    }

    await clearDeletedUserData(state.userId);

    try {
      await client.auth.signOut({ scope: 'local' });
    } catch {
      // The server has already deleted the account; do not present that as a failure.
    }

    setState({ status: 'signed_out' });
  }

  function replaceProfile(profile: ProfileRow) {
    setState((previousState) =>
      previousState.status === 'signed_in' && previousState.userId === profile.id
        ? { ...previousState, profile }
        : previousState,
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, deleteAccount, replaceProfile, retry, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('AuthProvider is required.');
  }

  return context;
}
