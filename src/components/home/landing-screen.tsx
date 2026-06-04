import { Image } from 'expo-image';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COPY = {
  title: '\uC624\uB298 \uBB50 \uBA39\uC9C0?\n\uC6B4\uBA85\uC5D0\uAC8C \uBB3C\uC5B4\uBD10.',
  subtitle:
    '\uC138 \uC810\uC7C1\uC774 \uC170\uD504\uAC00 \uB2F9\uC2E0\uC758 \uD55C \uB07C\uB97C \uC810\uCCD0 \uB4DC\uB824\uC694.',
  cta: '\uBA54\uB274 \uC810 \uBCF4\uB7EC \uAC00\uAE30',
  loginHint: '\uC774\uBBF8 \uB2E8\uACE8\uC774\uC2E0\uAC00\uC694?',
  login: '\uB85C\uADF8\uC778',
  mascotsLabel:
    '\uBCC4\uC758 \uC170\uD504, \uC6B4\uBA85\uC758 \uC170\uD504, \uB2EC\uC758 \uC810\uC7C1\uC774 \uCE90\uB9AD\uD130',
} as const;

const STARS = [
  { left: 30, top: 80, size: 2 },
  { left: 80, top: 40, size: 1.5 },
  { left: 155, top: 25, size: 2 },
  { left: 240, top: 50, size: 1.5 },
  { left: 310, top: 30, size: 2.5 },
  { left: 360, top: 90, size: 1.5 },
  { left: 20, top: 180, size: 1.5 },
  { left: 50, top: 260, size: 2 },
  { left: 340, top: 150, size: 2 },
  { left: 370, top: 220, size: 1.5 },
  { left: 15, top: 350, size: 1.5 },
  { left: 355, top: 310, size: 2 },
  { left: 25, top: 430, size: 1.5 },
  { left: 365, top: 400, size: 1.5 },
  { left: 40, top: 520, size: 2 },
  { left: 350, top: 480, size: 1.5 },
] as const;

const SPARKLES = [
  { left: 42, top: 115, size: 11, opacity: 0.55 },
  { left: 338, top: 105, size: 10, opacity: 0.48 },
  { left: 16, top: 455, size: 9, opacity: 0.4 },
  { left: 366, top: 435, size: 11, opacity: 0.48 },
] as const;

const SHOOTING_STARS = [
  {
    left: -92,
    top: 82,
    travelX: 442,
    travelY: 156,
    tail: 116,
    size: 8,
    angle: '20deg',
    reverse: true,
    start: 0.06,
    end: 0.34,
    opacity: 0.9,
  },
  {
    left: 326,
    top: 12,
    travelX: -258,
    travelY: 174,
    tail: 88,
    size: 6,
    angle: '-28deg',
    reverse: false,
    start: 0.43,
    end: 0.68,
    opacity: 0.66,
  },
  {
    left: -62,
    top: 258,
    travelX: 428,
    travelY: 118,
    tail: 102,
    size: 7,
    angle: '15deg',
    reverse: true,
    start: 0.74,
    end: 0.96,
    opacity: 0.72,
  },
] as const;

const noop = () => undefined;
const useNativeAnimationDriver = Platform.OS !== 'web';

export function LandingScreen() {
  const { width, height } = useWindowDimensions();
  const intro = useMemo(() => new Animated.Value(0), []);
  const float = useMemo(() => new Animated.Value(0), []);
  const pulse = useMemo(() => new Animated.Value(0), []);
  const twinkle = useMemo(() => new Animated.Value(0), []);
  const comet = useMemo(() => new Animated.Value(0), []);
  const shimmer = useMemo(() => new Animated.Value(0), []);
  const canvasWidth = Math.min(width, 390);
  const contentWidth = Math.min(canvasWidth - 48, 342);
  const compactHeight = height < 780;
  const shortHeight = height < 700;

  useEffect(() => {
    const introAnimation = Animated.timing(intro, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNativeAnimationDriver,
    });

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
      ]),
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
      ]),
    );

    const twinkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
      ]),
    );

    const cometAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(comet, {
          toValue: 1,
          duration: 5200,
          easing: Easing.out(Easing.cubic),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
        Animated.timing(comet, {
          toValue: 0,
          duration: 1,
          easing: Easing.linear,
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
      ]),
    );

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.cubic),
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1,
          easing: Easing.linear,
          isInteraction: false,
          useNativeDriver: useNativeAnimationDriver,
        }),
      ]),
    );

    introAnimation.start();
    floatAnimation.start();
    pulseAnimation.start();
    twinkleAnimation.start();
    cometAnimation.start();
    shimmerAnimation.start();

    return () => {
      introAnimation.stop();
      floatAnimation.stop();
      pulseAnimation.stop();
      twinkleAnimation.stop();
      cometAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [comet, float, intro, pulse, shimmer, twinkle]);

  const animatedStyles = useMemo(
    () => ({
      header: {
        opacity: intro,
        transform: [
          {
            translateY: intro.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      },
      illustration: {
        opacity: intro.interpolate({
          inputRange: [0, 0.54, 1],
          outputRange: [0, 0.3, 1],
        }),
        transform: [
          {
            translateY: intro.interpolate({
              inputRange: [0, 1],
              outputRange: [28, 0],
            }),
          },
          {
            scale: intro.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1],
            }),
          },
        ],
      },
      footer: {
        opacity: intro.interpolate({
          inputRange: [0, 0.66, 1],
          outputRange: [0, 0, 1],
        }),
        transform: [
          {
            translateY: intro.interpolate({
              inputRange: [0, 1],
              outputRange: [22, 0],
            }),
          },
        ],
      },
    }),
    [intro],
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <View style={[styles.canvas, { width: canvasWidth }]}>
        <StarField comet={comet} twinkle={twinkle} />

        <Animated.View
          style={[
            styles.heroHeader,
            compactHeight ? styles.heroHeaderCompact : null,
            shortHeight ? styles.heroHeaderShort : null,
            animatedStyles.header,
          ]}
        >
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrow}>FOOD TAROT</Text>
            <View style={styles.eyebrowLine} />
          </View>

          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.86}
            numberOfLines={2}
            style={[styles.title, { maxWidth: contentWidth }]}
          >
            {COPY.title}
          </Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={1}
            style={[styles.subtitle, { maxWidth: contentWidth }]}
          >
            {COPY.subtitle}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.illustrationStage,
            compactHeight ? styles.illustrationStageCompact : null,
            shortHeight ? styles.illustrationStageShort : null,
            animatedStyles.illustration,
          ]}
        >
          <MoonDisc compact={compactHeight} pulse={pulse} />
          <MascotStage compact={compactHeight} float={float} short={shortHeight} width={contentWidth} />
        </Animated.View>

        <Animated.View style={[styles.footer, compactHeight ? styles.footerCompact : null, animatedStyles.footer]}>
          <Pressable
            accessibilityLabel={COPY.cta}
            accessibilityRole="button"
            onPress={noop}
            style={({ pressed }) => [styles.ctaButton, pressed ? styles.ctaButtonPressed : null]}
          >
            <Animated.View
              style={[
                styles.ctaShimmer,
                {
                  transform: [
                    {
                      translateX: shimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-120, 360],
                      }),
                    },
                    { rotate: '16deg' },
                  ],
                },
              ]}
            />
            <Text style={styles.ctaLabel}>{COPY.cta}</Text>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>{COPY.loginHint}</Text>
            <Pressable accessibilityLabel={COPY.login} accessibilityRole="button" hitSlop={12} onPress={noop}>
              <Text style={styles.loginLink}>{COPY.login}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function StarField({ comet, twinkle }: { comet: Animated.Value; twinkle: Animated.Value }) {
  const brightStarOpacity = twinkle.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0.44, 1, 0.58],
  });
  const dimStarOpacity = twinkle.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0.9, 0.46, 0.78],
  });
  const sparkleScale = twinkle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.78, 1.24, 0.88],
  });
  const cometOpacity = comet.interpolate({
    inputRange: [0, 0.08, 0.88, 1],
    outputRange: [0, 0.22, 0.18, 0],
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointerEvents]}>
      {STARS.map((star, index) => (
        <Animated.View
          key={`${star.left}-${star.top}`}
          style={[
            styles.starDot,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
            },
            {
              opacity: index % 2 === 0 ? brightStarOpacity : dimStarOpacity,
              transform: [{ scale: index % 2 === 0 ? sparkleScale : 1 }],
            },
          ]}
        />
      ))}
      {SPARKLES.map((sparkle) => (
        <Animated.View
          key={`${sparkle.left}-${sparkle.top}`}
          style={[
            styles.sparkle,
            {
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              opacity: sparkle.opacity,
            },
            {
              transform: [{ rotate: '45deg' }, { scale: sparkleScale }],
            },
          ]}
        >
          <View style={styles.sparkleVertical} />
          <View style={styles.sparkleHorizontal} />
        </Animated.View>
      ))}
      <Animated.View style={[StyleSheet.absoluteFill, styles.meteorHaze, { opacity: cometOpacity }]} />
      {SHOOTING_STARS.map((meteor) => {
        const meteorOpacity = comet.interpolate({
          inputRange: [0, meteor.start, meteor.start + 0.06, meteor.end - 0.08, meteor.end, 1],
          outputRange: [0, 0, meteor.opacity, meteor.opacity * 0.68, 0, 0],
          extrapolate: 'clamp',
        });
        const meteorTranslateX = comet.interpolate({
          inputRange: [0, meteor.start, meteor.end, 1],
          outputRange: [0, 0, meteor.travelX, meteor.travelX],
          extrapolate: 'clamp',
        });
        const meteorTranslateY = comet.interpolate({
          inputRange: [0, meteor.start, meteor.end, 1],
          outputRange: [0, 0, meteor.travelY, meteor.travelY],
          extrapolate: 'clamp',
        });
        const meteorScale = comet.interpolate({
          inputRange: [0, meteor.start, meteor.start + 0.05, meteor.end, 1],
          outputRange: [0.88, 0.88, 1, 0.96, 0.96],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`${meteor.left}-${meteor.top}`}
            style={[
              styles.shootingStar,
              {
                flexDirection: meteor.reverse ? 'row-reverse' : 'row',
                left: meteor.left,
                opacity: meteorOpacity,
                top: meteor.top,
                transform: [
                  { translateX: meteorTranslateX },
                  { translateY: meteorTranslateY },
                  { rotate: meteor.angle },
                  { scale: meteorScale },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.shootingStarHead,
                {
                  width: meteor.size,
                  height: meteor.size,
                  borderRadius: meteor.size / 2,
                },
              ]}
            />
            <View style={[styles.shootingStarTrail, { width: meteor.tail }]}>
              <View style={styles.shootingStarTrailGlow} />
              <View style={styles.shootingStarTrailCore} />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function MoonDisc({ compact, pulse }: { compact: boolean; pulse: Animated.Value }) {
  const pulseStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.84, 1],
    }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.035],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.mysticOrb, compact ? styles.mysticOrbCompact : null, pulseStyle]}>
      <View style={styles.moonInnerGlow} />
      <View style={styles.moonTopHaze} />
      <View style={styles.moonLowerShadow} />
      <View style={styles.moonCraterLarge} />
      <View style={styles.moonCraterSmall} />
    </Animated.View>
  );
}

function MascotStage({
  compact,
  float,
  short,
  width,
}: {
  compact: boolean;
  float: Animated.Value;
  short: boolean;
  width: number;
}) {
  const height = width * (178 / 342);
  const floatStyle = {
    transform: [
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
      {
        rotate: float.interpolate({
          inputRange: [0, 1],
          outputRange: ['-0.8deg', '0.8deg'],
        }),
      },
    ],
  };

  return (
    <View
      style={[
        styles.mascotStage,
        { height, width },
        compact ? styles.mascotStageCompact : null,
        short ? styles.mascotStageShort : null,
      ]}
    >
      <Animated.View style={[styles.mascotFloatLayer, floatStyle]}>
        <Image
          accessibilityLabel={COPY.mascotsLabel}
          cachePolicy="memory-disk"
          contentFit="contain"
          priority="high"
          source={require('@/assets/images/mascots/landing-mascots.png')}
          style={styles.mascotImage}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#12103a',
  },
  canvas: {
    flex: 1,
    maxWidth: 390,
    overflow: 'hidden',
  },
  noPointerEvents: {
    pointerEvents: 'none',
  },
  starDot: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  sparkle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  sparkleVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    borderRadius: 1,
    backgroundColor: '#c9a24a',
  },
  sparkleHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    borderRadius: 1,
    backgroundColor: '#c9a24a',
  },
  meteorHaze: {
    position: 'absolute',
    backgroundColor: 'rgba(255,230,151,0.02)',
  },
  shootingStar: {
    position: 'absolute',
    alignItems: 'center',
    height: 18,
  },
  shootingStarHead: {
    backgroundColor: '#fff7c9',
    boxShadow: '0 0 16px rgba(255,247,201,0.95)',
  },
  shootingStarTrail: {
    justifyContent: 'center',
    height: 12,
  },
  shootingStarTrailGlow: {
    position: 'absolute',
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,214,133,0.12)',
  },
  shootingStarTrailCore: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,232,155,0.58)',
  },
  heroHeader: {
    alignItems: 'center',
    paddingTop: 65,
    paddingHorizontal: 24,
  },
  heroHeaderCompact: {
    paddingTop: 46,
  },
  heroHeaderShort: {
    paddingTop: 34,
  },
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 26,
  },
  eyebrowLine: {
    width: 48,
    height: 1,
    backgroundColor: '#c9a24a',
  },
  eyebrow: {
    color: '#c9a24a',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  title: {
    marginTop: 9,
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 52,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 22,
    textAlign: 'center',
  },
  illustrationStage: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: 420,
    paddingBottom: 8,
  },
  illustrationStageCompact: {
    minHeight: 324,
    paddingBottom: 0,
  },
  illustrationStageShort: {
    minHeight: 282,
  },
  mysticOrb: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 58,
    width: 360,
    height: 360,
    borderRadius: 180,
    overflow: 'hidden',
    backgroundColor: 'rgba(69,56,154,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(174,156,255,0.05)',
    boxShadow: '0 0 34px rgba(142,128,222,0.12)',
  },
  mysticOrbCompact: {
    bottom: 42,
    width: 330,
    height: 330,
    borderRadius: 165,
  },
  moonInnerGlow: {
    position: 'absolute',
    left: 44,
    top: 28,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(151,135,227,0.08)',
  },
  moonTopHaze: {
    position: 'absolute',
    left: 18,
    top: 0,
    width: 300,
    height: 180,
    borderRadius: 150,
    backgroundColor: 'rgba(210,199,255,0.04)',
    transform: [{ rotate: '-8deg' }],
  },
  moonLowerShadow: {
    position: 'absolute',
    left: -12,
    bottom: -50,
    width: 390,
    height: 190,
    borderRadius: 195,
    backgroundColor: 'rgba(12,10,42,0.24)',
  },
  moonCraterLarge: {
    position: 'absolute',
    left: 72,
    top: 105,
    width: 88,
    height: 46,
    borderRadius: 44,
    backgroundColor: 'rgba(31,24,88,0.09)',
    transform: [{ rotate: '-16deg' }],
  },
  moonCraterSmall: {
    position: 'absolute',
    right: 78,
    top: 68,
    width: 54,
    height: 30,
    borderRadius: 27,
    backgroundColor: 'rgba(194,182,255,0.05)',
    transform: [{ rotate: '18deg' }],
  },
  mascotStage: {
    alignSelf: 'center',
  },
  mascotStageCompact: {
    transform: [{ scale: 0.92 }],
  },
  mascotStageShort: {
    transform: [{ scale: 0.84 }],
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  mascotFloatLayer: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 20,
  },
  footerCompact: {
    paddingBottom: 20,
    gap: 14,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#b8872a',
    boxShadow: '0 4px 14px rgba(139,96,16,0.38)',
  },
  ctaShimmer: {
    position: 'absolute',
    left: 0,
    width: 54,
    height: 96,
    pointerEvents: 'none',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ctaButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 26,
  },
  loginHint: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    lineHeight: 18,
  },
  loginLink: {
    color: '#c9a24a',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
});
