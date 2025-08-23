import React from 'react';
import { EnhancedCSSShowcase } from './components/css-library/EnhancedCSSShowcase';
import './components/css-library/library.css'; // Import consolidated library styles
import { useTheme, AltModernHeader } from './components/UI/MainComponents';
import logo from './assets/logo.svg';

export default function CSSLibrary() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
      <main style={{
        minHeight: 'calc(100vh - 80px)', // Account for header height
        background: 'var(--bg-primary)',
        paddingTop: '2rem', // Fixed: Add padding to account for header
        paddingBottom: '2rem' // Consistent bottom padding
      }}>
        <EnhancedCSSShowcase />
      </main>
    </>
  );
}
