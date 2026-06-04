import mascotImage from '@/assets/images/mascots/landing-mascots.png';
import './landing-screen.css';

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
  return (
    <main className="landing-screen">
      <section className="landing-canvas" aria-labelledby="landing-title">
        <StarField />

        <header className="hero-header">
          <div className="eyebrow-row">
            <span className="eyebrow-line" />
            <span className="eyebrow">FOOD TAROT</span>
            <span className="eyebrow-line" />
          </div>

          <h1 id="landing-title" className="title">
            {COPY.title}
          </h1>
          <p className="subtitle">{COPY.subtitle}</p>
        </header>

        <div className="illustration-stage" aria-hidden="true">
          <MoonDisc />
          <MascotStage />
        </div>

        <footer className="footer">
          <button className="cta-button" type="button" onClick={noop}>
            <span className="cta-shimmer" />
            <span className="cta-label">{COPY.cta}</span>
          </button>

          <div className="login-row">
            <span className="login-hint">{COPY.loginHint}</span>
            <button className="login-link" type="button" onClick={noop}>
              {COPY.login}
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}

function StarField() {
  return (
    <div className="star-field" aria-hidden="true">
      {STARS.map((star, index) => {
        const style = {
          left: `${star.left}px`,
          top: `${star.top}px`,
          width: `${star.size}px`,
          height: `${star.size}px`,
        };

        return (
          <span
            className={`star-dot ${index % 2 === 0 ? 'star-dot-bright' : 'star-dot-dim'}`}
            key={`${star.left}-${star.top}`}
            style={style}
          />
        );
      })}
      {SPARKLES.map((sparkle) => {
        const style = {
          left: `${sparkle.left}px`,
          top: `${sparkle.top}px`,
          width: `${sparkle.size}px`,
          height: `${sparkle.size}px`,
          opacity: sparkle.opacity,
        };

        return (
          <span className="sparkle" key={`${sparkle.left}-${sparkle.top}`} style={style}>
            <span className="sparkle-vertical" />
            <span className="sparkle-horizontal" />
          </span>
        );
      })}
      <span className="celestial-sigil">
        <span className="sigil-ring sigil-ring-outer" />
        <span className="sigil-ring sigil-ring-inner" />
        <span className="sigil-thread sigil-thread-one" />
        <span className="sigil-thread sigil-thread-two" />
        <span className="sigil-thread sigil-thread-three" />
        <span className="sigil-point sigil-point-one" />
        <span className="sigil-point sigil-point-two" />
        <span className="sigil-point sigil-point-three" />
        <span className="sigil-point sigil-point-four" />
        <span className="sigil-point sigil-point-five" />
      </span>
    </div>
  );
}

function MoonDisc() {
  return (
    <div className="mystic-orb">
      <span className="moon-inner-glow" />
      <span className="moon-top-haze" />
      <span className="moon-lower-shadow" />
      <span className="moon-crater-large" />
      <span className="moon-crater-small" />
    </div>
  );
}

function MascotStage() {
  return (
    <div className="mascot-stage">
      <div className="mascot-float-layer">
        <img className="mascot-image" src={mascotImage} alt={COPY.mascotsLabel} />
      </div>
    </div>
  );
}
