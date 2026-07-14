import {
  EXPERIENCE_PER_LEVEL,
  EXPERIENCE_PER_ROUTINE_COMPLETION,
  getCompanionProgressForExperience,
} from '@/features/companion/domain/progression';

describe('getCompanionProgressForExperience', () => {
  it('maps experience to a level and its progress without allowing a negative value', () => {
    expect(getCompanionProgressForExperience(-10)).toEqual({
      experience: 0,
      experienceInLevel: 0,
      experienceToNextLevel: EXPERIENCE_PER_LEVEL,
      level: 1,
    });
    expect(
      getCompanionProgressForExperience(EXPERIENCE_PER_LEVEL - EXPERIENCE_PER_ROUTINE_COMPLETION),
    ).toEqual({
      experience: 40,
      experienceInLevel: 40,
      experienceToNextLevel: EXPERIENCE_PER_LEVEL,
      level: 1,
    });
    expect(getCompanionProgressForExperience(EXPERIENCE_PER_LEVEL)).toEqual({
      experience: EXPERIENCE_PER_LEVEL,
      experienceInLevel: 0,
      experienceToNextLevel: EXPERIENCE_PER_LEVEL,
      level: 2,
    });
  });
});
