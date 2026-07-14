import '@supabase/functions-js/edge-runtime.d.ts';

import { withSupabase } from '@supabase/server';

const ACCOUNT_DELETION_CONFIRMATION = 'DELETE_ACCOUNT';

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') {
      return Response.json({ errorCode: 'METHOD_NOT_ALLOWED' }, { status: 405 });
    }

    if (!await hasValidConfirmation(request)) {
      return Response.json({ errorCode: 'ACCOUNT_DELETION_CONFIRMATION_REQUIRED' }, { status: 400 });
    }

    const { data: userData, error: userError } = await context.supabase.auth.getUser();
    const user = userData.user;

    if (userError || !user) {
      return Response.json({ errorCode: 'ACCOUNT_DELETION_UNAUTHORIZED' }, { status: 401 });
    }

    // Delete every refresh token first. Access JWTs cannot be revoked before expiry,
    // but the profile cascade removes their application data immediately.
    const { error: signOutError } = await context.supabase.auth.signOut({ scope: 'global' });

    if (signOutError) {
      return Response.json({ errorCode: 'ACCOUNT_DELETION_FAILED' }, { status: 500 });
    }

    const { error: deletionError } = await context.supabaseAdmin.auth.admin.deleteUser(
      user.id,
      false,
    );

    if (deletionError) {
      return Response.json({ errorCode: 'ACCOUNT_DELETION_FAILED' }, { status: 500 });
    }

    return Response.json({ data: { deleted: true } });
  }),
};

async function hasValidConfirmation(request: Request): Promise<boolean> {
  try {
    const body: unknown = await request.json();

    return isRecord(body) && body.confirmation === ACCOUNT_DELETION_CONFIRMATION;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
