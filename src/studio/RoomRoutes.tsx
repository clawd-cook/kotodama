import { Navigate, Route, Routes } from 'react-router';
import { Catalog } from '../pages/catalog';
import { ExampleDetail, Examples } from '../pages/examples';
import { Settings } from '../pages/settings';
import { isRoutedRoom, keepAliveRoom, type RoutedRoom, ROOMS } from './rooms';

function routedDesk(key: RoutedRoom['key'], theme: 'light' | 'dark') {
  switch (key) {
    case 'catalog':
      return (
        <>
          <Route index element={<Navigate to="Column" replace />} />
          <Route path=":component" element={<Catalog theme={theme} />} />
        </>
      );
    case 'examples':
      return (
        <>
          <Route index element={<Examples theme={theme} />} />
          <Route path=":id" element={<ExampleDetail theme={theme} />} />
        </>
      );
    case 'settings':
      return <Route index element={<Settings />} />;
  }
}

export function RoomRoutes({ theme }: { theme: 'light' | 'dark' }) {
  const workshop = keepAliveRoom();
  return (
    <Routes>
      {ROOMS.filter(isRoutedRoom).map((room) => (
        <Route key={room.key} path={room.path.slice(1)}>
          {routedDesk(room.key, theme)}
        </Route>
      ))}
      <Route path="/" element={null} />
      <Route path="*" element={<Navigate to={workshop.path} replace />} />
    </Routes>
  );
}
