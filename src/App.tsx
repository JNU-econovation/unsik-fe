import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';

import { KakaoCallbackScreen } from '@/components/auth/kakao-callback-screen';
import { MainScreen } from '@/components/main/main-screen';
import { RoomListScreen } from '@/components/rooms/room-list-screen';
import { VoteFlowScreen } from '@/components/votes/vote-flow-screen';
import { formatApiErrorMessage, formatUnknownErrorMessage } from '@/services/api-error';
import { AUTH_EXPIRED_EVENT } from '@/services/backend';
import type { AuthSession } from '@/services/auth';
import { clearAuthSession, createKakaoLoginUrl, KAKAO_CALLBACK_PATH, loadAuthSession } from '@/services/auth';

type AppRoute =
  | { type: 'main' }
  | { type: 'groups' }
  | { type: 'authCallback' }
  | { type: 'groupVotes'; groupId: string };

const DEFAULT_ROUTE: AppRoute = { type: 'main' };
const THEME_MODE_STORAGE_KEY = 'unsik:theme_mode';
const THEME_MODE_COLORS = {
  dark: '#12103a',
  light: '#e0d5c5',
} as const;

type ThemeMode = keyof typeof THEME_MODE_COLORS;

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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode());

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

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuthSession();
      setAuthSession(null);
      setLoginError(formatApiErrorMessage(401, '로그인 유효기간이 만료됐어요. 다시 로그인해 주세요.'));
      window.history.replaceState(null, '', '/main');
      setRoute({ type: 'main' });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  useLayoutEffect(() => {
    applyThemeMode(themeMode);
    saveThemeMode(themeMode);
  }, [themeMode]);

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

  const handleLogout = useCallback(async () => {
    if (!authSession || isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLoginError(null);

    clearAuthSession();
    setAuthSession(null);
    setIsLoggingOut(false);
    window.history.replaceState(null, '', '/main');
    setRoute({ type: 'main' });
  }, [authSession, isLoggingOut]);

  const handleToggleThemeMode = useCallback(() => {
    setThemeMode((currentThemeMode) => (currentThemeMode === 'dark' ? 'light' : 'dark'));
  }, []);

  let screen: ReactNode;

  if (route.type === 'authCallback') {
    screen = (
      <KakaoCallbackScreen
        onAuthenticated={handleAuthenticated}
        onBackToMain={() => navigate({ type: 'main' })}
      />
    );
  } else if (route.type === 'groups') {
    screen = (
      <RoomListScreen
        memberId={authSession?.member.id}
        memberName={authSession?.member.name}
        isLoggingOut={isLoggingOut}
        onLogout={() => void handleLogout()}
        onOpenRoom={(roomId) => navigate({ type: 'groupVotes', groupId: roomId })}
        token={authSession?.token}
      />
    );
  } else if (route.type === 'groupVotes') {
    screen = (
      <VoteFlowScreen
        groupId={route.groupId}
        memberId={authSession?.member.id}
        memberName={authSession?.member.name}
        onBackToRooms={() => navigate({ type: 'groups' })}
        token={authSession?.token}
      />
    );
  } else {
    screen = <MainScreen loginError={loginError} onKakaoLogin={handleKakaoLogin} />;
  }

  return (
    <>
      {screen}
      {route.type === 'groups' || route.type === 'groupVotes' ? (
        <ThemeModeToggle mode={themeMode} onToggle={handleToggleThemeMode} />
      ) : null}
    </>
  );
}

type ThemeModeToggleProps = {
  mode: ThemeMode;
  onToggle: () => void;
};

function ThemeModeToggle({ mode, onToggle }: ThemeModeToggleProps) {
  const isDarkMode = mode === 'dark';

  return (
    <button
      aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
      aria-pressed={isDarkMode}
      className="theme-mode-toggle"
      onClick={onToggle}
      type="button"
    >
      {isDarkMode ? (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M20.4 13.7A8.2 8.2 0 0 1 10.3 3.6a8.6 8.6 0 1 0 10.1 10.1Z" />
        </svg>
      )}
    </button>
  );
}

function loadThemeMode(): ThemeMode {
  try {
    return window.localStorage.getItem(THEME_MODE_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function saveThemeMode(themeMode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  } catch {
    // Ignore storage errors; the visual theme can still apply for this session.
  }
}

function applyThemeMode(themeMode: ThemeMode) {
  document.documentElement.dataset.unsikTheme = themeMode;
  document.documentElement.style.colorScheme = themeMode;

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (themeColor) {
    themeColor.content = THEME_MODE_COLORS[themeMode];
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return formatUnknownErrorMessage('카카오 로그인을 시작할 수 없어요.');
}
