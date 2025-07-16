import { useMemo } from 'react';

export const useThemeColors = () => {
  return useMemo(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      primary: computedStyle.getPropertyValue('--text-primary').trim(),
      secondary: computedStyle.getPropertyValue('--text-secondary').trim(),
      border: computedStyle.getPropertyValue('--border').trim(),
      bgCard: computedStyle.getPropertyValue('--bg-card').trim(),
      bgSecondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
      accent: computedStyle.getPropertyValue('--accent').trim(),
      accentHover: computedStyle.getPropertyValue('--accent-hover').trim(),
    };
  }, []);
};