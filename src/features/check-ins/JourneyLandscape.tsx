import { TZDateMini } from '@date-fns/tz';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import {
  getMillisecondsUntilNextMinute,
  systemClock,
} from '@/features/routine-day/domain/routineDay';
import { palette } from '@/theme/tokens';

const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

export type JourneyScene = 'day' | 'night';

type JourneySceneColors = {
  label: string;
  labelBorder: string;
  node: string;
  nodeBorder: string;
  path: string;
  sky: string;
  skyGlow: string;
  text: string;
};

type JourneyLandscapeProps = {
  scene: JourneyScene;
};

const sceneColors: Record<JourneyScene, JourneySceneColors> = {
  day: {
    label: palette.journeyDayLabel,
    labelBorder: palette.journeyDayLabelBorder,
    node: palette.journeyDayNode,
    nodeBorder: palette.journeyDayNodeBorder,
    path: palette.journeyDayPath,
    sky: palette.journeyDaySky,
    skyGlow: palette.journeyDaySkyGlow,
    text: palette.journeyDayText,
  },
  night: {
    label: palette.journeyNightLabel,
    labelBorder: palette.journeyNightLabelBorder,
    node: palette.journeyNightNode,
    nodeBorder: palette.journeyNightNodeBorder,
    path: palette.journeyNightPath,
    sky: palette.journeyNightSky,
    skyGlow: palette.journeyNightSkyGlow,
    text: palette.journeyNightText,
  },
};

const landscapeAssets: Record<JourneyScene, number> = {
  day: require('../../../assets/journey/stitch-landscape-day.png'),
  night: require('../../../assets/journey/stitch-landscape-night.png'),
};

export function getJourneyScene(timeZone: string, instant: Date): JourneyScene {
  const localInstant = new TZDateMini(instant.getTime(), timeZone);
  const hour = localInstant.getHours();

  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? 'day' : 'night';
}

export function useJourneyScene(timeZone: string): JourneyScene {
  const [scene, setScene] = useState<JourneyScene>(() =>
    getJourneyScene(timeZone, systemClock.now()),
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function updateScene() {
      const now = systemClock.now();

      setScene(getJourneyScene(timeZone, now));
      timeoutId = setTimeout(updateScene, getMillisecondsUntilNextMinute(now));
    }

    updateScene();

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeZone]);

  return scene;
}

export function getJourneySceneColors(scene: JourneyScene): JourneySceneColors {
  return sceneColors[scene];
}

export function JourneyLandscape({ scene }: JourneyLandscapeProps) {
  return (
    <Image
      accessible={false}
      contentFit="cover"
      pointerEvents="none"
      source={landscapeAssets[scene]}
      style={styles.landscape}
    />
  );
}

const styles = StyleSheet.create({
  landscape: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 },
});
