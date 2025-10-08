
/* eslint-disable react/prop-types, react/display-name */
import '../../../styles/stock.css'
import light from '../../assets/light.svg';
import dark from '../../assets/dark.svg';
import coolImg from '../../assets/man_with_dog.jpg';
import moreLightIcon from '../../assets/more_light.svg';
import moreDarkIcon from '../../assets/more_dark.svg';
import React, { useState, useEffect, memo, useMemo } from 'react';
import Card from './Card.jsx';


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

const ThemeToggle = memo(({ theme, toggleTheme }) => {
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
});

const AltModernHeader = memo(({ theme, toggleTheme, light_logo, dark_logo }) => {
  const navigationItems = useMemo(() => ({
    playground: [
      { title: "Guessing Game", href: "/guess" }
    ],
    api: [
      { title: "Weather Check", href: "/weather" },
      { title: "Image Generator", href: "/random" }
    ],
    tools: [
      { title: "Statement Parser", href: "/parser" }
    ]
  }), []);

  return (
    <header className="simple-header">
      <div className="simple-header-content">
        <div className="simple-header-left">
          <a href="/" className="simple-logo">
            {theme === 'light' ?
              <img src={light_logo} alt="Logo" /> :
              <img src={dark_logo} alt="Logo" />
            }
            <span className="simple-logo-text">mcontr</span>
          </a>
        </div>

        <div className="simple-header-right">
          <nav className="simple-nav">
            <div className="simple-nav-item">
              <span className="simple-nav-title">Playground</span>
              <div className="simple-dropdown">
                <div className="simple-section">
                  <h4>Waste of Time</h4>
                  {navigationItems.playground.map((item, index) => (
                    <a key={index} href={item.href} className="simple-link">{item.title}</a>
                  ))}
                </div>
                <div className="simple-section">
                  <h4>API</h4>
                  {navigationItems.api.map((item, index) => (
                    <a key={index} href={item.href} className="simple-link">{item.title}</a>
                  ))}
                </div>
              </div>
            </div>

            <div className="simple-nav-item">
              <span className="simple-nav-title">Tools</span>
              <div className="simple-dropdown">
                <div className="simple-section">
                  {navigationItems.tools.map((tool, index) => (
                    <a key={index} href={tool.href} className="simple-link">{tool.title}</a>
                  ))}
                </div>
              </div>
            </div>
          </nav>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
    </header>
  );
});

const HeroSection = memo(() => {
  return (
    <section className="my-hero">
      <div className="my-container">
        <p className="my-hero-subtitle animate-fade-in-up">
          What started as a quick web app is evolving into something entirely different.
          Built some things that are basic and some things that are kinda useful?
          Regardless, here is a sick picture of a man and his dawg
        </p>
        <div className="text-center mt-4">
          <img src={coolImg} className="custom-img animate-fade-in-up" alt="Man with dog" />
        </div>
      </div>
    </section>
  );
});

const UnifiedCard = memo(({ title, description, route, category, type }) => {
  return (
    <div className={`${type}-card animate-fade-in-up`}>
      <Card
        title={title}
        description={description}
        route={route}
        category={category}
      />
    </div>
  );
});


function PlaygroundHeroSection() {
  const features = [
    {
      title: "Guessing Game",
      description: "Can you get it in 1 attempt? You got a 1% chance.",
      route: "/guess",
      category: "Game"
    },
    {
      title: "Weather Check",
      description: "Use WeatherAPI with any zip code or city name to see weather!",
      route: "/weather",
      category: "API"
    },
    {
      title: "Image Query",
      description: "Use free image APIs to query some images from keywords.",
      route: "/random",
      category: "API"
    }
  ];

  return (
    <section className="unified-hero playground-hero">
      <div className="my-container">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-section-title animate-fade-in-up">Playground</h2>
            <p className="hero-section-subtitle animate-fade-in-up">
              These are the output of my long (in progress) battle with web development.
              Not the most useful but were super crucial to get to where I am today (not very far)!
            </p>
          </div>
          <div className="hero-cards">
            <div className="unified-card-grid">
              {features.map((feature, index) => (
                <UnifiedCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  route={feature.route}
                  category={feature.category}
                  type="playground"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolsHeroSection() {
  const tools = [
    {
      title: "Bank Statement Parser",
      description: "Where is your money going?",
      route: "/parser"
    }
  ];

  return (
    <section className="unified-hero tools-hero">
      <div className="my-container">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-section-title animate-fade-in-up">Tools</h2>
            <p className="hero-section-subtitle animate-fade-in-up">
              Utilities to solve my real world problems that may also be your real world problems.
            </p>
          </div>
          <div className="hero-cards">
            <div className="unified-card-grid">
              {tools.map((tool, index) => (
                <UnifiedCard
                  key={index}
                  title={tool.title}
                  description={tool.description}
                  route={tool.route}
                  type="tool"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContextAccordion({ theme, children = "Content goes here" }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const moreIcon = theme === 'light' ? moreLightIcon : moreDarkIcon;

  return (
    <div className="context-accordion">
      <button
        className="context-accordion-trigger"
        onClick={toggleAccordion}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Hide' : 'Show'} page context`}
      >
        <img
          src={moreIcon}
          alt="Expand context"
          className={`context-accordion-more-icon ${isOpen ? 'open' : ''}`}
        />
      </button>
      <div className={`context-accordion-content ${isOpen ? 'open' : ''}`}>
        <div className="context-accordion-body">
          {typeof children === 'string' ? <p>{children}</p> : children}
        </div>
      </div>
    </div>
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



export {useTheme, ThemeToggle, AltModernHeader, HeroSection, UnifiedCard, PlaygroundHeroSection, ToolsHeroSection, ContextAccordion, Footer}