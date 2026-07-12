import { render } from '@testing-library/react-native';

import { FoundationScreen } from '@/features/foundation/FoundationScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('FoundationScreen', () => {
  it('renders the exact Korean greeting through i18n', async () => {
    await i18n.changeLanguage('ko');

    const screen = await render(
      <ThemeProvider preference="light">
        <FoundationScreen />
      </ThemeProvider>,
    );

    expect(screen.getByText('안녕하세요, 우리 할 수 있어요')).toBeTruthy();
  });
});
