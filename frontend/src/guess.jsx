import { useState, useEffect } from 'react';
import '../styles/stock.css';
import { useTheme, AltModernHeader, Footer } from './components/MainComponents';
import { GameInterface, GameSidebar } from './components/GuessComponents';
import light_logo from './assets/guess-light-logo.svg';
import dark_logo from './assets/guess-dark-logo.svg';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);



function getRandomNum() {
  return Math.floor(Math.random() * 100) + 1;
}

export default function GuessPage() {
  const { theme, toggleTheme } = useTheme();
  const startMessage = 'Guess a number between 1-100!'
  const [attempts, setAttempts] = useState(0);
  const [randomNum, setRandomNum] = useState(getRandomNum());
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState(startMessage);
  const [gameHistory, setGameHistory] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [sessionAttempts, setSessionAttempts] = useState([]);

  console.log('Target:', randomNum);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !gameWon && guess && Number(guess) >= 1 && Number(guess) <= 100) {
        submitGuess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [guess, gameWon]);

  const handleKeypadPress = (digit) => {
    if (guess.length < 3) {
      setGuess(prev => prev + digit);
    }
  };

  const handleClear = () => {
    setGuess('');
  };

  const handleBackspace = () => {
    setGuess(prev => prev.slice(0, -1));
  };

  const submitGuess = () => {
    if (!guess || guess === '') return;
    
    const guessNum = Number(guess);
    
    if (guessNum < 1 || guessNum > 100) {
      setMessage(`Please enter a number between 1 and 100! Your guess: ${guessNum}`);
      setGuess('');
      return;
    }
    
    const newAttempt = attempts + 1;
    setAttempts(newAttempt);
    
    const newAttemptData = {
      attempt: newAttempt,
      guess: guessNum,
      target: randomNum,
      difference: Math.abs(guessNum - randomNum)
    };
    
    setSessionAttempts(prev => [...prev, newAttemptData]);
    compareGuess(guessNum, newAttempt);
    setGuess('');
  }

  const concludingMessage = (attemptNum) => {
    if (attemptNum === 1) {
      setMessage('Damn I\'m pretty sure you cheated but good job!')
    } else if (attemptNum < 5) {
      setMessage(`Less than 5 is super solid!`);
    } else if (attemptNum < 10) {
      setMessage(`Not great but you finally got it!`);
    }
    else {
      setMessage(`You should keep playing for the practice!`);
    }
  }

  const compareGuess = (guess, attemptNum) => {
    if (guess === randomNum) {
      setGameWon(true);
      setGameHistory(prev => [...prev, { round: currentRound, attempts: attemptNum, target: randomNum }]);
      concludingMessage(attemptNum);
    } else if (guess < randomNum) {
      setMessage(`Too low! Your guess: ${guess}. Try higher!`);
    } else {
      setMessage(`Too high! Your guess: ${guess}. Try lower!`);
    }
  }

  const resetGame = () => {
    setGuess('');
    setMessage(startMessage);
    setRandomNum(getRandomNum());
    setAttempts(0);
    setGameWon(false);
    setCurrentRound(prev => prev + 1);
    setSessionAttempts([]);
  }

  const clearHistory = () => {
    setGameHistory([]);
    setCurrentRound(1);
  }

  const hasActiveGame = sessionAttempts.length > 0;

  return (
    <>
      <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={light_logo} dark_logo={dark_logo} />
      <main>
        <section className="my-section">
          <div className="my-container">
            {!hasActiveGame && (
              <h2 className="my-section-title animate-fade-in-up">Guessing Game</h2>
            )}
            
            {hasActiveGame ? (
              <div className="game-layout-active">
                <div className="game-left-panel">
                  <GameSidebar 
                    sessionAttempts={sessionAttempts}
                    currentRound={currentRound}
                    theme={theme}
                    gameHistory={gameHistory}
                  />
                </div>
                
                <div className="game-right-panel">
                  <GameInterface
                    message={message}
                    guess={guess}
                    onKeypadPress={handleKeypadPress}
                    onClear={handleClear}
                    onBackspace={handleBackspace}
                    onSubmitGuess={submitGuess}
                    onResetGame={resetGame}
                    onClearHistory={clearHistory}
                    gameWon={gameWon}
                    attempts={attempts}
                    gameHistory={gameHistory}
                    hasActiveGame={hasActiveGame}
                  />
                </div>
              </div>
            ) : (
              <div className="game-layout-centered">
                <GameInterface
                  message={message}
                  guess={guess}
                  onKeypadPress={handleKeypadPress}
                  onClear={handleClear}
                  onBackspace={handleBackspace}
                  onSubmitGuess={submitGuess}
                  onResetGame={resetGame}
                  onClearHistory={clearHistory}
                  gameWon={gameWon}
                  attempts={attempts}
                  gameHistory={gameHistory}
                  hasActiveGame={hasActiveGame}
                />
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}