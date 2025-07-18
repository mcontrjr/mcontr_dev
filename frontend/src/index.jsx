 
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import ErrorBoundary from './components/UI/ErrorBoundary.jsx'
import MainPage from './main.jsx'
import InfoPage from './info.jsx'
import GuessPage from './guess.jsx'
import RandomPage from './random.jsx'
import WeatherPage from './weather.jsx'
import ParserPage from './parser.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path='/' element={<ErrorBoundary><MainPage /></ErrorBoundary>}/>
          <Route path='/info' element={<ErrorBoundary><InfoPage /></ErrorBoundary>}/>
          <Route path='/guess' element={<ErrorBoundary><GuessPage /></ErrorBoundary>}/>
          <Route path='/random' element={<ErrorBoundary><RandomPage /></ErrorBoundary>}/>
          <Route path='/weather' element={<ErrorBoundary><WeatherPage /></ErrorBoundary>}/>
          <Route path='/parser' element={<ErrorBoundary><ParserPage /></ErrorBoundary>}/>
        </Routes>
      </Router>
    </ErrorBoundary>
  </StrictMode>
)
