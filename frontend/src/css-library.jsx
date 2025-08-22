import React from 'react';
import { CSSShowcaseComponents } from './components/css-library/CSSShowcase';
import './components/css-library/CSSShowcase.css';
import { useTheme, AltModernHeader } from './components/UI/MainComponents';
import logo from './assets/logo.svg';

export default function CSSLibrary() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
      <main>
        <CSSShowcaseComponents />
      </main>
    </>
  );
}
