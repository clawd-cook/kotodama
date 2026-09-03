import { createContext, useContext, type ReactNode } from 'react';

export type ColorScheme = 'light' | 'dark';

const LayoutThemeContext = createContext<ColorScheme>('light');

export function LayoutThemeProvider({
  theme,
  children,
}: {
  theme: ColorScheme;
  children: ReactNode;
}) {
  return (
    <LayoutThemeContext.Provider value={theme}>
      {children}
    </LayoutThemeContext.Provider>
  );
}

export function useLayoutTheme() {
  return useContext(LayoutThemeContext);
}
