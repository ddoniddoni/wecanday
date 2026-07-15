import { applyCompanionAccent, getCompanionAccent } from '@/theme/companionAccent';
import { darkTheme } from '@/theme/themes/dark';
import { lightTheme } from '@/theme/themes/light';

describe('theme contracts', () => {
  it('keeps semantic color roles aligned across every theme', () => {
    const expectedRoles = Object.keys(lightTheme.colors).sort();

    expect(Object.keys(darkTheme.colors).sort()).toEqual(expectedRoles);
  });

  it('uses the selected companion only for semantic emphasis colors', () => {
    const lunaTheme = applyCompanionAccent(darkTheme, 'luna');

    expect(lunaTheme.colors).toMatchObject(getCompanionAccent('dark', 'luna'));
    expect(lunaTheme.colors.background).toBe(darkTheme.colors.background);
    expect(lunaTheme.colors.surface).toBe(darkTheme.colors.surface);
    expect(lunaTheme.colors.text).toBe(darkTheme.colors.text);
  });
});
