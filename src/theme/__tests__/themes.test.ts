import { applyCompanionAccent, getCompanionAccent } from '@/theme/companionAccent';
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

  it('uses the selected companion only for semantic emphasis colors', () => {
    const dewTheme = applyCompanionAccent(darkTheme, 'dew');

    expect(dewTheme.colors).toMatchObject(getCompanionAccent('dark', 'dew'));
    expect(dewTheme.colors.background).toBe(darkTheme.colors.background);
    expect(dewTheme.colors.surface).toBe(darkTheme.colors.surface);
    expect(dewTheme.colors.text).toBe(darkTheme.colors.text);
    expect(dewTheme.colors.onPrimary).toBe(darkTheme.colors.onPrimary);
  });
});
