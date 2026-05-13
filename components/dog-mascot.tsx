import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Defs, ClipPath, Rect, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import { BREEDS, GRID_COLS, GRID_ROWS } from '@/constants/breeds';
import { Colors } from '@/constants/theme';
import { BreedId } from '@/store/types';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = {
  breed: BreedId;
  fillPercent: number; // 0–1
  cellSize?: number;
};

export function DogMascot({ breed, fillPercent, cellSize = 14 }: Props) {
  const config = BREEDS[breed];
  const W = GRID_COLS * cellSize;
  const H = GRID_ROWS * cellSize;

  const fillY = useSharedValue(H);

  useEffect(() => {
    fillY.value = withSpring(H * (1 - fillPercent), { damping: 18, stiffness: 80 });
    // fillY is a stable shared-value ref — intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillPercent, H]);

  const animatedFillProps = useAnimatedProps(() => ({
    y: fillY.value,
    height: Math.max(0, H - fillY.value),
  }));

  const clipId = `dog-primary-${breed}`;

  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          {/* Clip to primary (1) pixels only for the fill animation */}
          <ClipPath id={clipId}>
            <G>
              {config.grid.map((row, r) =>
                row.map((val, c) => {
                  if (val !== 1) return null;
                  return (
                    <Rect
                      key={`pc-${r}-${c}`}
                      x={c * cellSize}
                      y={r * cellSize}
                      width={cellSize}
                      height={cellSize}
                    />
                  );
                })
              )}
            </G>
          </ClipPath>
        </Defs>

        {/* 1. Gray base silhouette (all non-transparent pixels) */}
        {config.grid.map((row, r) =>
          row.map((val, c) => {
            if (val === 0) return null;
            return (
              <Rect
                key={`base-${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={Colors.dogEmpty}
              />
            );
          })
        )}

        {/* 2. Animated primary fill, clipped to primary (1) pixels */}
        <G clipPath={`url(#${clipId})`}>
          <AnimatedRect
            x={0}
            width={W}
            fill={config.colors.primary}
            animatedProps={animatedFillProps}
          />
        </G>

        {/* 3. Secondary color always visible (muzzle, inner ears, markings) */}
        {config.grid.map((row, r) =>
          row.map((val, c) => {
            if (val !== 2) return null;
            return (
              <Rect
                key={`sec-${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={config.colors.secondary}
              />
            );
          })
        )}

        {/* 4. Dark details always on top (eyes, nose) */}
        {config.grid.map((row, r) =>
          row.map((val, c) => {
            if (val !== 3) return null;
            return (
              <Rect
                key={`dark-${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={config.colors.dark}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
}
