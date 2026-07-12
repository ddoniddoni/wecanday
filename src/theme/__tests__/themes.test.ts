import { darkTheme } from '@/theme/themes/dark';
import { lightTheme } from '@/theme/themes/light';
import { pixelDefaultTheme } from '@/theme/themes/pixel-default';

describe('theme contracts', () => {
  it('keeps semantic color roles aligned across every theme', () => {
    const expectedRoles = Object.keys(lightTheme.colors).sort();

    expect(Object.keys(darkTheme.colors).sort()).toEqual(expectedRoles);
    expect(Object.keys(pixelDefaultTheme.colors).sort()).toEqual(expectedRoles);
  });
});
