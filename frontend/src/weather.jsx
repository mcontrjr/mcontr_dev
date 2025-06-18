import { useState, useEffect } from 'react';
import '../styles/stock.css';
import error_img from './assets/rainy.svg';
import {useTheme, ModernHeader, Footer} from './components/MainComponents';
import { SearchInterface, WeatherProfileCard, WeatherTable } from './components/WeatherComponents';
import logo from './assets/weather-logo.svg';



// Weather API function
async function getWeatherData(location) {
  try {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('Weather API key not found. Please check environment variables.');
    }
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=no`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Weather API error:', error);
    return { success: false, error: error.message };
  }
}


function LoadingState() {
  return (
    <div className="text-center animate-fade-in-up">
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid var(--border)', 
        borderTop: '4px solid var(--accent)', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite',
        margin: '2rem auto'
      }}></div>
      <p style={{ color: 'var(--text-secondary)' }}>Loading weather data...</p>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="animate-fade-in-up text-center">
      <img src={error_img} alt="error" style={{ width: '300px', height: '300px', maxWidth: '100%' }} />
      <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{error}</p>
    </div>
  );
}

export default function WeatherPage() {
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [message, setMessage] = useState('Enter a city name or zip code to get current weather');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !loading && location.trim()) {
        handleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [location, loading]);

  const handleSearch = async () => {
    if (!location.trim()) return;
    
    setLoading(true);
    setError(null);
    setMessage(`Getting weather for "${location.trim()}"...`);

    const result = await getWeatherData(location.trim());
    
    if (result.success) {
      setWeatherData(result.data);
      setMessage('Success!');
    } else {
      setError(`Could not find weather data for "${location.trim()}". Please check the location and try again.`);
      setWeatherData(null);
      setMessage('Enter a city name or zip code to get current weather');
    }
    
    setLoading(false);
    setLocation('');
  };

  return (
    <>
      <ModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo}/>
      <main>
        <section className="my-section">
          <div className="my-container">
            <h2 className="my-section-title animate-fade-in-up">Weather Dashboard</h2>
            
            <SearchInterface 
              location={location}
              setLocation={setLocation}
              onSearch={handleSearch}
              loading={loading}
              message={message}
            />

            {loading && <LoadingState />}

            {error && !loading && <ErrorState error={error} />}

            {weatherData && !loading && !error && (
              <>
                <WeatherProfileCard weatherData={weatherData} />
                <WeatherTable weatherData={weatherData} />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}