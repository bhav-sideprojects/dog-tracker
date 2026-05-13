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
    // fillY is a shared value ref — stable across renders, intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillPercent, H]);

  const animatedFillProps = useAnimatedProps(() => ({
    y: fillY.value,
    height: H - fillY.value,
  }));

  const clipId = `dog-clip-${breed}`;

  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          <ClipPath id={clipId}>
            <G>
              {config.grid.map((row, r) =>
                row.map((val, c) => {
                  if (val === 0) return null;
                  return (
                    <Rect
                      key={`clip-${r}-${c}`}
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

        {/* Gray base silhouette */}
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

        {/* Animated color fill rising from bottom, clipped to dog shape */}
        <G clipPath={`url(#${clipId})`}>
          <AnimatedRect
            x={0}
            width={W}
            fill={config.colors.primary}
            animatedProps={animatedFillProps}
          />
        </G>

        {/* Dark details (eyes, nose) always on top */}
        {config.grid.map((row, r) =>
          row.map((val, c) => {
            if (val !== 3) return null;
            return (
              <Rect
                key={`detail-${r}-${c}`}
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
