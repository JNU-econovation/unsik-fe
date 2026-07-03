import { useCallback, useEffect, useState } from 'react';

import { KakaoCallbackScreen } from '@/components/auth/kakao-callback-screen';
import { MainScreen } from '@/components/main/main-screen';
import { RoomListScreen } from '@/components/rooms/room-list-screen';
import type { AuthSession } from '@/services/auth';
import { createKakaoLoginUrl, KAKAO_CALLBACK_PATH, loadAuthSession } from '@/services/auth';

type AppRoute = '/main' | '/grouplist' | typeof KAKAO_CALLBACK_PATH;

const DEFAULT_ROUTE: AppRoute = '/main';

function getAppRoute(pathname: string): AppRoute {
  if (pathname === KAKAO_CALLBACK_PATH) {
    return KAKAO_CALLBACK_PATH;
  }

  if (pathname === '/grouplist') {
    return '/grouplist';
  }

  return DEFAULT_ROUTE;
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => getAppRoute(window.location.pathname));
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedRoute = getAppRoute(window.location.pathname);

    if (window.location.pathname !== normalizedRoute) {
      window.history.replaceState(null, '', normalizedRoute);
    }

    const handlePopState = () => {
      setRoute(getAppRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    if (window.location.pathname !== nextRoute) {
      window.history.pushState(null, '', nextRoute);
    }

    setRoute(nextRoute);
  }, []);

  const handleKakaoLogin = useCallback(() => {
    setLoginError(null);

    try {
      window.location.assign(createKakaoLoginUrl());
    } catch (error) {
      setLoginError(getErrorMessage(error));
    }
  }, []);

  const handleAuthenticated = useCallback((nextSession: AuthSession) => {
    setAuthSession(nextSession);
    window.history.replaceState(null, '', '/grouplist');
    setRoute('/grouplist');
  }, []);

  if (route === KAKAO_CALLBACK_PATH) {
    return (
      <KakaoCallbackScreen
        onAuthenticated={handleAuthenticated}
        onBackToMain={() => navigate('/main')}
      />
    );
  }

  if (route === '/grouplist') {
    return <RoomListScreen memberName={authSession?.member.name} onBack={() => navigate('/main')} />;
  }

  return (
    <MainScreen
      loginError={loginError}
      onKakaoLogin={handleKakaoLogin}
    />
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '카카오 로그인을 시작할 수 없어요.';
}
