import tarotImage from '@/assets/images/figma/landing-tarot.png';

import './main-screen.css';

type MainScreenProps = {
  loginError?: string | null;
  onKakaoLogin: () => void;
};

const COPY = {
  title: '오늘 뭐 먹을지 또 고민하고 계신가요?',
  description: '그룹을 만들고 운명의 메뉴를 받아보세요',
  result: 'AI가 골라줄게요',
  kakaoLogin: '카카오로 시작하기',
  kakaoLoginLabel: '카카오 계정으로 시작하기',
} as const;

export function MainScreen({ loginError = null, onKakaoLogin }: MainScreenProps) {
  return (
    <main className="main-screen">
      <section className="main-canvas" aria-labelledby="main-title">
        <div className="main-aurora main-aurora-left" aria-hidden="true" />
        <div className="main-aurora main-aurora-right" aria-hidden="true" />
        <div className="main-star-field" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} />
          ))}
        </div>

        <p className="main-brand" aria-label="운식">
          <span aria-hidden="true">✦</span> 운식 <span aria-hidden="true">✦</span>
        </p>

        <header className="main-hero-header">
          <p className="main-destiny-label" aria-hidden="true">
            <span>✦</span> 오늘의 운명 <span>✦</span>
          </p>
          <h1 id="main-title" className="main-title">
            {COPY.title}
          </h1>
        </header>

        <div className="main-tarot-stage">
          <span className="main-orbit main-orbit-one" aria-hidden="true" />
          <span className="main-orbit main-orbit-two" aria-hidden="true" />
          <span className="main-stage-star main-stage-star-left" aria-hidden="true">✦</span>
          <span className="main-stage-star main-stage-star-right" aria-hidden="true">✧</span>
          <div className="main-tarot-frame">
            <img
              className="main-tarot-image"
              src={tarotImage}
              alt="별, 달, 운명의 점쟁이가 오늘의 메뉴를 점치는 모습"
            />
            <span className="main-tarot-sheen" aria-hidden="true" />
          </div>
        </div>

        <div className="main-intro-copy">
          <p>{COPY.description}</p>
          <strong>{COPY.result}</strong>
        </div>

        <footer className="main-footer">
          <button
            className="main-kakao-login-button"
            type="button"
            onClick={onKakaoLogin}
            aria-label={COPY.kakaoLoginLabel}
          >
            <span className="main-button-spark" aria-hidden="true">✦</span>
            <span>{COPY.kakaoLogin}</span>
            <span className="main-button-arrow" aria-hidden="true">→</span>
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
