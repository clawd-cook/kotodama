import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { Catalog } from '../pages/catalog';
import { ExampleDetail, Examples } from '../pages/examples';
import { Settings } from '../pages/settings';
import { Workshop } from '../pages/workshop';
import { createRoom } from '../studio/rooms';
import { Studio } from '../studio/Studio';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Studio />,
    children: [
      { index: true, element: <Workshop /> },
      {
        path: 'catalog',
        children: [
          { index: true, element: <Navigate to="Column" replace /> },
          { path: ':component', element: <Catalog /> },
        ],
      },
      {
        path: 'examples',
        children: [
          { index: true, element: <Examples /> },
          { path: ':id', element: <ExampleDetail /> },
        ],
      },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <Navigate to={createRoom().path} replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
