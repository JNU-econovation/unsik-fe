import { useEffect, useState } from 'react';

import { formatApiErrorMessage, formatUnknownErrorMessage } from '@/services/api-error';
import type { AuthSession } from '@/services/auth';
import {
  authenticateWithKakaoCode,
  saveAuthSession,
  verifyKakaoOAuthState,
} from '@/services/auth';

import './kakao-callback-screen.css';

type KakaoCallbackScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
  onBackToMain: () => void;
};

let activeKakaoCodeExchange: {
  code: string;
  promise: Promise<AuthSession>;
} | null = null;

export function KakaoCallbackScreen({ onAuthenticated, onBackToMain }: KakaoCallbackScreenProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const params = new URLSearchParams(window.location.search);
    const kakaoError = params.get('error');

    if (kakaoError) {
      setErrorMessage(getKakaoErrorMessage(params));
      return undefined;
    }

    const code = params.get('code');

    if (!code) {
      setErrorMessage('카카오 로그인 code가 없어 인증을 완료할 수 없어요.');
      return undefined;
    }

    try {
      verifyKakaoOAuthState(params.get('state'));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      return undefined;
    }

    exchangeKakaoCodeOnce(code)
      .then((session) => {
        if (!isCurrent) {
          return;
        }

        saveAuthSession(session);
        onAuthenticated(session);
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setErrorMessage(getErrorMessage(error));
      });

    return () => {
      isCurrent = false;
    };
  }, [onAuthenticated]);

  return (
    <main className="kakao-callback-screen">
      <section className="kakao-callback-panel" aria-labelledby="kakao-callback-title">
        <span className="kakao-callback-symbol" aria-hidden="true">
          {errorMessage ? '!' : ''}
        </span>
        <h1 id="kakao-callback-title">{errorMessage ? '로그인 실패' : '카카오 로그인 중'}</h1>
        <p>{errorMessage ?? '카카오 인증 정보를 확인하고 있어요.'}</p>

        {errorMessage ? (
          <button className="kakao-callback-button" type="button" onClick={onBackToMain}>
            메인으로 돌아가기
          </button>
        ) : (
          <div className="kakao-callback-progress" role="status" aria-label="카카오 로그인 처리 중">
            <span />
            <span />
            <span />
          </div>
        )}
      </section>
    </main>
  );
}

function exchangeKakaoCodeOnce(code: string): Promise<AuthSession> {
  if (activeKakaoCodeExchange?.code === code) {
    return activeKakaoCodeExchange.promise;
  }

  const promise = authenticateWithKakaoCode(code).finally(() => {
    if (activeKakaoCodeExchange?.promise === promise) {
      activeKakaoCodeExchange = null;
    }
  });

  activeKakaoCodeExchange = { code, promise };

  return promise;
}

function getKakaoErrorMessage(params: URLSearchParams): string {
  const code = params.get('error')?.trim() || 'KAKAO_OAUTH';
  const description = params.get('error_description');

  if (description) {
    return formatApiErrorMessage(code, `카카오 로그인이 완료되지 않았어요. ${description}`);
  }

  return formatApiErrorMessage(code, '카카오 로그인이 완료되지 않았어요. 다시 시도해 주세요.');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return formatUnknownErrorMessage('카카오 로그인 중 문제가 발생했어요. 다시 시도해 주세요.');
}
