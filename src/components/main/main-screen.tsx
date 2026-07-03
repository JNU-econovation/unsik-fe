import mascotImage from '@/assets/images/mascots/landing-mascots.png';
import './main-screen.css';

type MainScreenProps = {
  loginError?: string | null;
  onKakaoLogin: () => void;
};

const COPY = {
  title: '오늘 뭐 먹지?\n운명에게 물어봐.',
  subtitle: '세 점쟁이 셰프가 당신의 한 끼를 점쳐 드려요.',
  kakaoLogin: '카카오로 시작하기',
  kakaoLoginLabel: '카카오 계정으로 시작하기',
  mascotsLabel: '별의 셰프, 운명의 셰프, 달의 점쟁이 캐릭터',
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

export function MainScreen({ loginError = null, onKakaoLogin }: MainScreenProps) {
  return (
    <main className="main-screen">
      <section className="main-canvas" aria-labelledby="main-title">
        <StarField />

        <header className="main-hero-header">
          <div className="main-eyebrow-row">
            <span className="main-eyebrow-line" />
            <span className="main-eyebrow">FOOD TAROT</span>
            <span className="main-eyebrow-line" />
          </div>

          <h1 id="main-title" className="main-title">
            {COPY.title}
          </h1>
          <p className="main-subtitle">{COPY.subtitle}</p>
        </header>

        <div className="main-illustration-stage" aria-hidden="true">
          <MoonDisc />
          <MascotStage />
        </div>

        <footer className="main-footer">
          <button
            className="main-kakao-login-button"
            type="button"
            onClick={onKakaoLogin}
            aria-label={COPY.kakaoLoginLabel}
          >
            <span className="main-kakao-login-label">{COPY.kakaoLogin}</span>
          </button>

          {loginError ? (
            <p className="main-login-error" role="alert">
              {loginError}
            </p>
          ) : null}
        </footer>
      </section>
    </main>
  );
}

function StarField() {
  return (
    <div className="main-star-field" aria-hidden="true">
      {STARS.map((star, index) => {
        const style = {
          left: `${star.left}px`,
          top: `${star.top}px`,
          width: `${star.size}px`,
          height: `${star.size}px`,
        };

        return (
          <span
            className={`main-star-dot ${
              index % 2 === 0 ? 'main-star-dot-bright' : 'main-star-dot-dim'
            }`}
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
          <span className="main-sparkle" key={`${sparkle.left}-${sparkle.top}`} style={style}>
            <span className="main-sparkle-vertical" />
            <span className="main-sparkle-horizontal" />
          </span>
        );
      })}
      <span className="main-celestial-sigil">
        <span className="main-sigil-ring main-sigil-ring-outer" />
        <span className="main-sigil-ring main-sigil-ring-inner" />
        <span className="main-sigil-thread main-sigil-thread-one" />
        <span className="main-sigil-thread main-sigil-thread-two" />
        <span className="main-sigil-thread main-sigil-thread-three" />
        <span className="main-sigil-point main-sigil-point-one" />
        <span className="main-sigil-point main-sigil-point-two" />
        <span className="main-sigil-point main-sigil-point-three" />
        <span className="main-sigil-point main-sigil-point-four" />
        <span className="main-sigil-point main-sigil-point-five" />
      </span>
    </div>
  );
}

function MoonDisc() {
  return (
    <div className="main-mystic-orb">
      <span className="main-moon-inner-glow" />
      <span className="main-moon-top-haze" />
      <span className="main-moon-lower-shadow" />
      <span className="main-moon-crater-large" />
      <span className="main-moon-crater-small" />
    </div>
  );
}

function MascotStage() {
  return (
    <div className="main-mascot-stage">
      <div className="main-mascot-float-layer">
        <img className="main-mascot-image" src={mascotImage} alt={COPY.mascotsLabel} />
      </div>
    </div>
  );
}
