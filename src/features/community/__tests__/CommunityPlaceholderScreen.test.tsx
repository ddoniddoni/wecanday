import { render } from '@testing-library/react-native';

import { CommunityPlaceholderScreen } from '@/features/community/CommunityPlaceholderScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('CommunityPlaceholderScreen', () => {
  it('shows the inactive community space without a feed or chat controls', async () => {
    await i18n.changeLanguage('en');

    const screen = await render(
      <ThemeProvider preference="light">
        <CommunityPlaceholderScreen
          primaryNavigation={{
            onOpenCommunity: jest.fn(),
            onOpenPlans: jest.fn(),
            onOpenProfile: jest.fn(),
            onOpenStatistics: jest.fn(),
            onOpenToday: jest.fn(),
          }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('header', { name: 'Community is on its way' })).toBeTruthy();
    expect(screen.getByLabelText('Community features are not available yet.')).toBeTruthy();
  });
});
