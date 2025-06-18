import '../../styles/stock.css'
import light from './assets/light.svg';
import dark from './assets/dark.svg';

// Theme toggle hook
function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}

// Theme Toggle Component
function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <img src={light} alt="Dark mode" /> : <img src={dark} alt="Light mode" />}
    </button>
  );
}

// Modern Header Component
function ModernHeader({ theme, toggleTheme, light_logo, dark_logo }) {
  return (
    <header className="my-header">
      <div className="my-header-content">
        <div className="my-logo">
          {theme === 'light' ? <img src={light_logo} alt="Dark mode" /> : <img src={dark_logo} alt="Light mode" />}
          <div className="my-logo-text">mcontr</div>
        </div>
        <nav className="my-nav" style={{ gap: '0.5rem' }}>
          <a href="/" className="my-button">
            Home
          </a>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </nav>
      </div>
    </header>
  );
}

function Footer() {
    return (
        <footer className="my-footer">
            <div className="my-container">
                <p>&copy; 2024 mcontr.dev - All Rights Reserved.</p>
                <p>Powered by <a href="https://react.dev" target="_blank" rel="noopener noreferrer">React</a></p>
            </div>
        </footer>
    )
}



export {useTheme, ThemeToggle, ModernHeader, Footer}