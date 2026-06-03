import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

const noop = () => undefined;

export function LandingScreen() {
  const { width, height } = useWindowDimensions();
  const canvasWidth = Math.min(width, 390);
  const contentWidth = Math.min(canvasWidth - 48, 342);
  const compactHeight = height < 780;
  const shortHeight = height < 700;

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <View style={[styles.canvas, { width: canvasWidth }]}>
        <StarField />

        <View
          style={[
            styles.heroHeader,
            compactHeight ? styles.heroHeaderCompact : null,
            shortHeight ? styles.heroHeaderShort : null,
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
        </View>

        <View
          style={[
            styles.illustrationStage,
            compactHeight ? styles.illustrationStageCompact : null,
            shortHeight ? styles.illustrationStageShort : null,
          ]}
        >
          <MoonDisc compact={compactHeight} />
          <MascotStage compact={compactHeight} short={shortHeight} width={contentWidth} />
        </View>

        <View style={[styles.footer, compactHeight ? styles.footerCompact : null]}>
          <Pressable
            accessibilityLabel={COPY.cta}
            accessibilityRole="button"
            onPress={noop}
            style={({ pressed }) => [styles.ctaButton, pressed ? styles.ctaButtonPressed : null]}
          >
            <Text style={styles.ctaLabel}>{COPY.cta}</Text>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>{COPY.loginHint}</Text>
            <Pressable accessibilityLabel={COPY.login} accessibilityRole="button" hitSlop={12} onPress={noop}>
              <Text style={styles.loginLink}>{COPY.login}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StarField() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STARS.map((star) => (
        <View
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
          ]}
        />
      ))}
      {SPARKLES.map((sparkle) => (
        <View
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
          ]}
        >
          <View style={styles.sparkleVertical} />
          <View style={styles.sparkleHorizontal} />
        </View>
      ))}
    </View>
  );
}

function MoonDisc({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.mysticOrb, compact ? styles.mysticOrbCompact : null]}>
      <View style={styles.moonInnerGlow} />
      <View style={styles.moonTopHaze} />
      <View style={styles.moonLowerShadow} />
      <View style={styles.moonCraterLarge} />
      <View style={styles.moonCraterSmall} />
    </View>
  );
}

function MascotStage({ compact, short, width }: { compact: boolean; short: boolean; width: number }) {
  const height = width * (178 / 342);

  return (
    <View
      style={[
        styles.mascotStage,
        { height, width },
        compact ? styles.mascotStageCompact : null,
        short ? styles.mascotStageShort : null,
      ]}
    >
      <Image
        accessibilityLabel={COPY.mascotsLabel}
        cachePolicy="memory-disk"
        contentFit="contain"
        priority="high"
        source={require('@/assets/images/mascots/landing-mascots.png')}
        style={styles.mascotImage}
      />
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
    shadowColor: '#8e80de',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 34,
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
    backgroundColor: '#b8872a',
    shadowColor: '#8b6010',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 4,
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
