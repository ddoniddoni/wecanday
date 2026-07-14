import { darkTheme } from '@/theme/themes/dark';
import { lightTheme } from '@/theme/themes/light';
import { pixelDefaultTheme } from '@/theme/themes/pixel-default';

describe('theme contracts', () => {
  it('keeps semantic color roles aligned across every theme', () => {
    const expectedRoles = Object.keys(lightTheme.colors).sort();

    expect(Object.keys(darkTheme.colors).sort()).toEqual(expectedRoles);
    expect(Object.keys(pixelDefaultTheme.colors).sort()).toEqual(expectedRoles);
  });

  it('keeps the pixel theme visually distinct from the light theme', () => {
    expect(pixelDefaultTheme.isPixel).toBe(true);
    expect(pixelDefaultTheme.colors).not.toEqual(lightTheme.colors);
    expect(pixelDefaultTheme.colors.primary).not.toBe(lightTheme.colors.primary);
  });
});
