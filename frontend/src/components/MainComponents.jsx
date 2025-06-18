import '../../styles/stock.css'
import light from '../assets/light.svg';
import dark from '../assets/dark.svg';
import coolImg from '../assets/man_with_dog.jpg';
import { useState, useEffect } from 'react';


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

function AltModernHeader({ theme, toggleTheme, light_logo, dark_logo }) {
  const playground = [
    {
      title: "Weather Check",
      description: "Check weather conditions in real-time",
      href: "/weather"
    },
    {
      title: "Guessing Game",
      description: "Test your knowledge with a fun guessing game",
      href: "/guess"
    }
  ];

  const tools = [
    {
      title: "Finance Tools",
      description: "Analyze your financial statements",
      href: "/finance"
    },
    {
      title: "Image Generator",
      description: "Create unique images from text",
      href: "/random"
    },
    {
      title: "Documentation",
      description: "Learn how to use our tools",
      href: "/docs"
    },
    {
      title: "About",
      description: "Learn more about our project",
      href: "/about"
    }
  ];

  return (
    <header className="alt-header">
      <div className="alt-header-content">
        <div className="alt-header-left">
          <a href="/" className="alt-logo">
            {theme === 'light' ? 
              <img src={light_logo} alt="Logo" /> : 
              <img src={dark_logo} alt="Logo" />
            }
            <span className="alt-logo-text">mcontr</span>
          </a>
        </div>

        <div className="alt-right-section">
          <nav className="alt-nav">
            <div className="alt-nav-item">
              Playground
              <div className="alt-dropdown">
                {playground.map((play, index) => (
                  <a key={index} href={play.href} className="alt-dropdown-item">
                    <span className="alt-dropdown-title">{play.title}</span>
                    <span className="alt-dropdown-description">{play.description}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="alt-nav-item">
              Tools
              <div className="alt-dropdown">
                {tools.map((tool, index) => (
                  <a key={index} href={tool.href} className="alt-dropdown-item">
                    <span className="alt-dropdown-title">{tool.title}</span>
                    <span className="alt-dropdown-description">{tool.description}</span>
                  </a>
                ))}
              </div>
            </div>
          </nav>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="my-hero">
      <div className="my-container">
        <p className="my-hero-subtitle animate-fade-in-up">
          What started as a quick web app is evolving into something entirely different. 
          Built some things that are basic a** f*** and some things that are kinda useful?
          Regardless, here is a sick a** picture of a man and his dawg
        </p>
        <div className="text-center mt-4">
          <img src={coolImg} className="custom-img animate-fade-in-up" alt="Man with dog" />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, description, route, category = "feature" }) {
  const handleClick = () => {
    window.location.href = route;
  };

  return (
    <div 
      className="my-card my-card-interactive feature-card animate-fade-in-up" 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="my-card-body">
        <h3 className="my-card-title">{title}</h3>
        <p>{description}</p>
      </div>
      <div className="my-card-footer">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {category}
        </span>
        <span style={{ color: 'var(--accent)' }}>→</span>
      </div>
    </div>
  );
}

function ToolCard({ title, description, route, status = "available" }) {
  const handleClick = () => {
    window.location.href = route;
  };

  return (
    <div 
      className="my-card my-card-interactive animate-fade-in-up" 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="my-card-header">
        <div>
          <h3 className="my-card-title">{title}</h3>
          <span 
            className="text-sm" 
            style={{ 
              color: status === 'available' ? 'var(--accent)' : 'var(--text-muted)' 
            }}
          >
            {status}
          </span>
        </div>
      </div>
      <div className="my-card-body">
        <p>{description}</p>
      </div>
      <div className="my-card-footer">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Tool
        </span>
        <span style={{ color: 'var(--accent)' }}>→</span>
      </div>
    </div>
  );
}

function PlaygroundSection() {
  const features = [
    {
      title: "Guessing Game",
      description: "Can you get it in 1 attempt? You got a 1% chance.",
      route: "/guess",
      category: "Game"
    },
    {
      title: "Weather Check",
      description: "Check weather with any zip code or city name.",
      route: "/weather",
      category: "Utility"
    },
    {
      title: "Image Generator",
      description: "Get random images from a single word!",
      route: "/random",
      category: "Creative"
    }
  ];

  return (
    <section className="my-section">
      <div className="my-container">
        <h2 className="my-section-title animate-fade-in-up">Playground</h2>
        <div className="my-grid my-grid-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              route={feature.route}
              category={feature.category}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Tools Section
function ToolsSection() {
  const tools = [
    {
      title: "Statement Parser",
      description: "Upload your bank statements and find out where your money is going.",
      route: "/finance"
    }
  ];

  return (
    <section className="my-section">
      <div className="my-container">
        <h2 className="my-section-title animate-fade-in-up">Tools</h2>
        <div className="my-grid my-grid-2 centered-grid">
          {tools.map((tool, index) => (
            <ToolCard
              key={index}
              title={tool.title}
              description={tool.description}
              route={tool.route}
              status={tool.status}
            />
          ))}
        </div>
      </div>
    </section>
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



export {useTheme, ThemeToggle, AltModernHeader, HeroSection, FeatureCard, ToolCard, PlaygroundSection, ToolsSection, Footer}