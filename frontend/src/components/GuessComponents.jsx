import '../../styles/stock.css'
import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'

// Keypad Component
function GameKeypad({ guess, onKeypadPress, onClear, onBackspace, gameWon }) {
  return (
    <div className="keypad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          className="keypad-button"
          onClick={() => onKeypadPress(num.toString())}
          disabled={gameWon}
        >
          {num}
        </button>
      ))}
      <button
        className="keypad-button keypad-button-small"
        onClick={onClear}
        disabled={gameWon || !guess}
      >
        Cl
      </button>
      <button
        className="keypad-button"
        onClick={() => onKeypadPress('0')}
        disabled={gameWon}
      >
        0
      </button>
      <button
        className="keypad-button"
        onClick={onBackspace}
        disabled={gameWon || !guess}
      >
        ⌫
      </button>
    </div>
  );
}

// Game Interface Component
function GameInterface({ 
  message, 
  guess, 
  onKeypadPress, 
  onClear, 
  onBackspace, 
  onSubmitGuess, 
  onResetGame, 
  onClearHistory, 
  gameWon, 
  attempts, 
  gameHistory, 
  hasActiveGame 
}) {
  const isValidGuess = guess && Number(guess) >= 1 && Number(guess) <= 100;
  
  return (
    <div className="game-interface">
      
      <div className="game-right-panel animate-fade-in-up">
        <div className="my-card-body">
          
          <p className="mb-3" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            {message}
          </p>
          
          <div className="guess-display">
            {guess || '?'}
          </div>

          <GameKeypad 
            guess={guess}
            onKeypadPress={onKeypadPress}
            onClear={onClear}
            onBackspace={onBackspace}
            gameWon={gameWon}
          />
        </div>
      </div>

      <div className="game-controls">
        <button 
          className="my-button"
          onClick={onSubmitGuess}
          disabled={gameWon || !isValidGuess}
          style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', marginBottom: '1rem' }}
        >
          Submit Guess {guess && `(${guess})`}
        </button>
        {guess && !isValidGuess && (
          <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
            Warning: Number must be between 1-100
          </p>
        )}

        <div className="button-group">
          <button 
            className="my-button"
            onClick={onResetGame}
          >
            {gameWon ? 'New Game' : 'Reset Game'}
          </button>
          {gameHistory.length > 0 && (
            <button 
              className="my-button"
              onClick={onClearHistory}
            >
              Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Chart Component
function GameChart({ sessionAttempts, currentRound, theme }) {
  const [chartKey, setChartKey] = useState(0);
  
  const getThemeColors = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      primary: computedStyle.getPropertyValue('--text-primary').trim(),
      secondary: computedStyle.getPropertyValue('--text-primary').trim(),
      border: computedStyle.getPropertyValue('--border').trim(),
    };
  };

  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [theme]);

  const colors = getThemeColors();

  const chartData = {
    labels: sessionAttempts.map((_, index) => `Attempt ${index + 1}`),
    datasets: [
      {
        label: 'Your Guess',
        data: sessionAttempts.map(attempt => attempt.guess),
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        tension: 0.1,
        fill: false,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.primary,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.primary,
          font: { family: '"Roboto Mono", monospace' }
        }
      },
      title: {
        display: true,
        text: `Game ${currentRound}`,
        font: { family: '"Roboto Mono", monospace' },
        color: colors.primary
      },
      tooltip: {
          callbacks: {
              label: function(context) {
                  const value = context.raw;
                  return `${context.dataset.label}: ${value.toLocaleString()}`;
              }
          },
          titleFont: {
              family: '"Roboto Mono", monospace'
          },
          bodyFont: {
              family: '"Roboto Mono", monospace'
          }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: colors.border,
        },
        ticks: {
          color: colors.secondary,
          font: {
              family: '"Roboto Mono", monospace'
          }
        }
      },
      x: {
        grid: {
          color: colors.border,
          font: {
            family: '"Roboto Mono", monospace'
          }
        },
        ticks: {
          color: colors.secondary,
          font: {
            family: '"Roboto Mono", monospace'
          }
        }
      }
    },
  };

  return (
    <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
      <h3 className="text-center mb-3" style={{ color: 'var(--text-primary)' }}>
        Current Game Progress
      </h3>
      <div className="game-left-panel">
        <div className="my-card-body">
          <Line key={chartKey} data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

// Game History Component
function GameHistory({ gameHistory }) {
  return (
    <div className="animate-fade-in-up">
      <h3 className="text-center mb-3" style={{ color: 'var(--text-primary)' }}>
        Game History
      </h3>
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Target</th>
              <th>Attempts</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {gameHistory.map((game, index) => (
              <tr key={index} className="custom-table-row">
                <td>{game.round}</td>
                <td>{game.target}</td>
                <td>{game.attempts}</td>
                <td>
                  <span style={{ 
                    color: game.attempts === 1 ? '#22c55e' : 
                           game.attempts <= 3 ? '#3b82f6' : 
                           game.attempts <= 7 ? '#f59e0b' : '#ef4444'
                  }}>
                    {game.attempts === 1 ? 'Perfect!' :
                     game.attempts <= 3 ? 'Excellent' :
                     game.attempts <= 7 ? 'Good' : 'Keep practicing'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Game Sidebar Component
function GameSidebar({ sessionAttempts, currentRound, theme, gameHistory }) {
  return (
    <div className="game-left-panel">
      {sessionAttempts.length > 0 && (
        <GameChart 
          sessionAttempts={sessionAttempts} 
          currentRound={currentRound} 
          theme={theme} 
        />
      )}
      
      {gameHistory.length > 0 && (
        <GameHistory gameHistory={gameHistory} />
      )}
    </div>
  );
}

export { GameInterface, GameSidebar }