import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { AppLayout } from '../layout';
import { NAV_HANDLES } from '../layout/nav';
import { Catalog } from '../pages/catalog';
import { ExampleDetail, Examples } from '../pages/examples';
import { Settings } from '../pages/settings';
import { Workshop } from '../pages/workshop';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Workshop />, handle: NAV_HANDLES.create },
      {
        path: 'catalog',
        handle: NAV_HANDLES.catalog,
        children: [
          { index: true, element: <Navigate to="Column" replace /> },
          { path: ':component', element: <Catalog /> },
        ],
      },
      {
        path: 'examples',
        handle: NAV_HANDLES.examples,
        children: [
          { index: true, element: <Examples /> },
          { path: ':id', element: <ExampleDetail /> },
        ],
      },
      { path: 'settings', element: <Settings />, handle: NAV_HANDLES.settings },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
