import { useContext, createContext } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({ isDarkMode: true });

export const useTheme = () => {
  return useContext(ThemeContext);
};

