export type FeatureFlags = {
  adsEnabled: boolean;
  advancedStatsEnabled: boolean;
  premiumEnabled: boolean;
  rewardedAdsEnabled: boolean;
  socialEnabled: boolean;
  streakProtectionEnabled: boolean;
};

export const featureFlags: Readonly<FeatureFlags> = {
  adsEnabled: false,
  advancedStatsEnabled: false,
  premiumEnabled: true,
  rewardedAdsEnabled: false,
  socialEnabled: true,
  streakProtectionEnabled: false,
};
