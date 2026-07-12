import { AuthGate } from '@/features/auth/AuthGate';
import { OnboardingGate } from '@/features/onboarding/OnboardingGate';

export default function IndexRoute() {
  return (
    <OnboardingGate>
      <AuthGate />
    </OnboardingGate>
  );
}
