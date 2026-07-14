import type { ImageSourcePropType } from 'react-native';

export const companionIds = ['sprout', 'dew', 'ember'] as const;

export type CompanionId = (typeof companionIds)[number];

const companionAssets: Record<CompanionId, ImageSourcePropType> = {
  sprout: require('../../../../assets/companion/sprout-companion-hero.png'),
  dew: require('../../../../assets/companion/dew-companion.png'),
  ember: require('../../../../assets/companion/ember-companion.png'),
};

export function getCompanionAsset(companionId: CompanionId): ImageSourcePropType {
  return companionAssets[companionId];
}

export function isCompanionId(value: string | null): value is CompanionId {
  return companionIds.some((companionId) => companionId === value);
}
