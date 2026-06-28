import { useCallback, useEffect, useState } from 'react';

import { MainScreen } from '@/components/main/main-screen';
import { RoomListScreen } from '@/components/rooms/room-list-screen';

type AppRoute = '/main' | '/grouplist';

const DEFAULT_ROUTE: AppRoute = '/main';

function getAppRoute(pathname: string): AppRoute {
  if (pathname === '/grouplist') {
    return '/grouplist';
  }

  return DEFAULT_ROUTE;
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => getAppRoute(window.location.pathname));

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

  if (route === '/grouplist') {
    return <RoomListScreen onBack={() => navigate('/main')} />;
  }

  return <MainScreen onLogin={() => navigate('/grouplist')} />;
}
