export const EXPERIENCE_PER_ROUTINE_COMPLETION = 10;
export const EXPERIENCE_PER_LEVEL = 50;

export type CompanionProgress = {
  experience: number;
  experienceInLevel: number;
  experienceToNextLevel: number;
  level: number;
};

export function getCompanionProgressForExperience(
  experience: number,
): CompanionProgress {
  const normalizedExperience = Math.max(0, Math.floor(experience));

  return {
    experience: normalizedExperience,
    experienceInLevel: normalizedExperience % EXPERIENCE_PER_LEVEL,
    experienceToNextLevel: EXPERIENCE_PER_LEVEL,
    level: Math.floor(normalizedExperience / EXPERIENCE_PER_LEVEL) + 1,
  };
}
