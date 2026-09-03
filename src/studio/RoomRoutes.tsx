import { Navigate, Route, Routes } from 'react-router';
import { Catalog } from '../pages/catalog';
import { ExampleDetail, Examples } from '../pages/examples';
import { Settings } from '../pages/settings';
import { Workshop } from '../pages/workshop';
import { createRoom } from './rooms';

export function RoomRoutes({ theme }: { theme: 'light' | 'dark' }) {
  const workshop = createRoom();
  return (
    <Routes>
      <Route path="/" element={<Workshop theme={theme} />} />
      <Route path="catalog">
        <Route index element={<Navigate to="Column" replace />} />
        <Route path=":component" element={<Catalog theme={theme} />} />
      </Route>
      <Route path="examples">
        <Route index element={<Examples theme={theme} />} />
        <Route path=":id" element={<ExampleDetail theme={theme} />} />
      </Route>
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<Navigate to={workshop.path} replace />} />
    </Routes>
  );
}
