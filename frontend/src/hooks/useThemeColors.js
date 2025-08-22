import { useMemo, useEffect, useState } from 'react';

export const useThemeColors = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Set initial theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    return () => observer.disconnect();
  }, []);

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
  }, [theme]);
};
