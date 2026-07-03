import { useCallback, useEffect, useState } from 'react';

import { KakaoCallbackScreen } from '@/components/auth/kakao-callback-screen';
import { MainScreen } from '@/components/main/main-screen';
import { RoomListScreen } from '@/components/rooms/room-list-screen';
import { VoteFlowScreen } from '@/components/votes/vote-flow-screen';
import type { AuthSession } from '@/services/auth';
import { createKakaoLoginUrl, KAKAO_CALLBACK_PATH, loadAuthSession } from '@/services/auth';

type AppRoute =
  | { type: 'main' }
  | { type: 'groups' }
  | { type: 'authCallback' }
  | { type: 'groupVotes'; groupId: string };

const DEFAULT_ROUTE: AppRoute = { type: 'main' };

function getAppRoute(pathname: string): AppRoute {
  if (pathname === KAKAO_CALLBACK_PATH) {
    return { type: 'authCallback' };
  }

  if (pathname === '/grouplist') {
    return { type: 'groups' };
  }

  const groupVotesMatch = pathname.match(/^\/groups\/([^/]+)\/votes$/);

  if (groupVotesMatch) {
    return {
      type: 'groupVotes',
      groupId: decodeURIComponent(groupVotesMatch[1]),
    };
  }

  return DEFAULT_ROUTE;
}

function getRoutePath(route: AppRoute): string {
  if (route.type === 'authCallback') {
    return KAKAO_CALLBACK_PATH;
  }

  if (route.type === 'groups') {
    return '/grouplist';
  }

  if (route.type === 'groupVotes') {
    return `/groups/${encodeURIComponent(route.groupId)}/votes`;
  }

  return '/main';
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => getAppRoute(window.location.pathname));
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedRoute = getAppRoute(window.location.pathname);

    const normalizedPath = getRoutePath(normalizedRoute);

    if (window.location.pathname !== normalizedPath) {
      window.history.replaceState(null, '', normalizedPath);
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
    const nextPath = getRoutePath(nextRoute);

    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
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
    setRoute({ type: 'groups' });
  }, []);

  if (route.type === 'authCallback') {
    return (
      <KakaoCallbackScreen
        onAuthenticated={handleAuthenticated}
        onBackToMain={() => navigate({ type: 'main' })}
      />
    );
  }

  if (route.type === 'groups') {
    return (
      <RoomListScreen
        memberId={authSession?.member.id}
        memberName={authSession?.member.name}
        onBack={() => navigate({ type: 'main' })}
        onOpenRoom={(roomId) => navigate({ type: 'groupVotes', groupId: roomId })}
        token={authSession?.token}
      />
    );
  }

  if (route.type === 'groupVotes') {
    return (
      <VoteFlowScreen
        groupId={route.groupId}
        memberId={authSession?.member.id}
        memberName={authSession?.member.name}
        onBackToRooms={() => navigate({ type: 'groups' })}
        token={authSession?.token}
      />
    );
  }

  return <MainScreen loginError={loginError} onKakaoLogin={handleKakaoLogin} />;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '카카오 로그인을 시작할 수 없어요.';
}
