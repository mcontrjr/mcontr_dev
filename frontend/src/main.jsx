import logo from './assets/logo.svg';
import {useTheme, AltModernHeader, HeroSection, PlaygroundSection, ToolsSection, Footer} from './components/MainComponents';



// Main App Component
export default function MainPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
      <main>
        <HeroSection />
        <PlaygroundSection />
        <ToolsSection />
      </main>
      <Footer />
    </>
  );
}