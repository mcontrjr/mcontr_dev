import '../styles/stock.css'

function SearchInterface({ location, setLocation, onSearch, loading, message }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      onSearch();
    }
  };

  return (
    <div className="my-card animate-fade-in-up" style={{ maxWidth: '500px', margin: '0 auto 3rem auto' }}>
      <div className="my-card-body">
        <p className="mb-3" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          {message}
        </p>
        
        <div className="photo-search-container">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter city name or zip code..."
            disabled={loading}
            className="photo-search-input"
          />
          <button 
            className="my-button"
            onClick={onSearch}
            disabled={loading || !location.trim()}
          >
            {loading ? 'Loading...' : 'Get Weather'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WeatherProfileCard({ weatherData }) {
  return (
    <div className="animate-fade-in-up" style={{ marginBottom: '3rem' }}>
      <div className="my-card weather-profile-card">
        <div className="my-card-body">
          {/* Profile Header */}
          <div className="weather-profile-header">
            <div className="weather-location-info">
              <h2 className="weather-location-name">
                {weatherData.location.name}
              </h2>
              <p className="weather-location-region">
                {weatherData.location.region}, {weatherData.location.country}
              </p>
              <p className="weather-location-time">
                Local time: {new Date(weatherData.location.localtime).toLocaleString()}
              </p>
            </div>
            
            <div className="weather-icon-temp-container">
              <div className="weather-icon-container">
                <img 
                  src={weatherData.current.condition.icon} 
                  alt={weatherData.current.condition.text}
                  className="weather-icon"
                />
                <p className="weather-condition-text">
                  {weatherData.current.condition.text}
                </p>
              </div>
              
              <div className="weather-temperature-container">
                <div className="weather-temperature-main">
                  {weatherData.current.temp_c}
                  <span className="weather-temperature-unit">
                    °C
                  </span>
                </div>
                <p className="weather-temperature-secondary">
                  {weatherData.current.temp_f}°F
                </p>
              </div>
            </div>
          </div>

          {/* Weather Stats Grid */}
          <div className="weather-stats-grid">
            <div className="weather-stat-item">
              <h4 className="weather-stat-title">Feels Like</h4>
              <div className="weather-stat-value">
                {weatherData.current.feelslike_c}°C
              </div>
              <p className="weather-stat-subtitle">
                {weatherData.current.feelslike_f}°F
              </p>
            </div>
            
            <div className="weather-stat-item">
              <h4 className="weather-stat-title">Humidity</h4>
              <div className="weather-stat-value">
                {weatherData.current.humidity}%
              </div>
              <p className="weather-stat-subtitle">
                Relative humidity
              </p>
            </div>
            
            <div className="weather-stat-item">
              <h4 className="weather-stat-title">Wind Speed</h4>
              <div className="weather-stat-value">
                {weatherData.current.wind_kph} km/h
              </div>
              <p className="weather-stat-subtitle">
                {weatherData.current.wind_mph} mph {weatherData.current.wind_dir}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherTable({ weatherData }) {
  const currentData = [
    ['Condition', weatherData.current.condition.text],
    ['Cloud Cover', `${weatherData.current.cloud}%`],
    ['Pressure', `${weatherData.current.pressure_mb} mb (${weatherData.current.pressure_in} in)`],
    ['Visibility', `${weatherData.current.vis_km} km (${weatherData.current.vis_miles} mi)`],
    ['UV Index', weatherData.current.uv],
    ['Precipitation', `${weatherData.current.precip_mm} mm (${weatherData.current.precip_in} in)`],
    ['Wind Gust', `${weatherData.current.gust_kph} km/h (${weatherData.current.gust_mph} mph)`]
  ];

  return (
    <div className="animate-fade-in-up">
      <h3 className="text-center mb-3" style={{ color: 'var(--text-primary)' }}>
        Detailed Weather Information
      </h3>
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ color: 'var(--text-primary)' }}>Metric</th>
              <th style={{ color: 'var(--text-primary)' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr key={index} className="custom-table-row">
                <td style={{ color: 'var(--text-primary)' }}>{row[0]}</td>
                <td style={{ color: 'var(--text-primary)' }}>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export {SearchInterface, WeatherProfileCard, WeatherTable}