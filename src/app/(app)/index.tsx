import { ProfileHomeScreen } from '@/features/auth/ProfileHomeScreen';
import { OnboardingGate } from '@/features/onboarding/OnboardingGate';

export default function AppIndexRoute() {
  return (
    <OnboardingGate>
      <ProfileHomeScreen />
    </OnboardingGate>
  );
}
