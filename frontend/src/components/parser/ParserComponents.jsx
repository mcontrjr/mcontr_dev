import { useState, useEffect } from 'react';
/* eslint-disable react/prop-types, react/display-name */
// Session Bar - top of parser page, full-width bar with session management + Pull button
const SessionBar = ({ sessionId, onSessionIdChange, onPull, loading, monthlyIncome, onIncomeSave, hardReload, lastUpdated }) => {
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(sessionId);
    const [incomeInput, setIncomeInput] = useState(monthlyIncome != null ? String(monthlyIncome) : '');
    const [incomeSaving, setIncomeSaving] = useState(false);

    useEffect(() => {
        if (monthlyIncome != null) setIncomeInput(String(monthlyIncome));
    }, [monthlyIncome]);

    // Keep inputValue in sync if sessionId changes externally
    useEffect(() => {
        setInputValue(sessionId);
    }, [sessionId]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sessionId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (error) {
            console.error('Failed to copy session ID:', error);
            setCopied(false);
        }
    };

    const handleEdit = () => {
        setEditing(true);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        if (inputValue && inputValue !== sessionId) {
            onSessionIdChange(inputValue.trim());
        }
        setEditing(false);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        } else if (e.key === 'Escape') {
            setInputValue(sessionId);
            setEditing(false);
        }
    };

    const handleIncomeSave = async () => {
        const parsed = parseFloat(incomeInput);
        if (isNaN(parsed) || parsed < 0) return;
        setIncomeSaving(true);
        try {
            await onIncomeSave(parsed);
        } finally {
            setIncomeSaving(false);
        }
    };

    const handleIncomeKeyDown = (e) => {
        if (e.key === 'Enter') handleIncomeSave();
    };

    const minutesAgo = lastUpdated
        ? Math.floor((Date.now() - lastUpdated) / 60000)
        : null;

    return (
        <div className="parser-session-editor" data-test-id="session-bar" title="Session ID">
            <span style={{ fontWeight: 500 }}>Session:</span>
            {editing ? (
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    data-test-id="session-input"
                    style={{
                        fontFamily: 'monospace',
                        fontSize: '0.93em',
                        width: '22em',
                        border: '1px solid var(--border)',
                        borderRadius: '0px',
                        padding: '0.2em 0.4em',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                    autoFocus
                />
            ) : (
                <span
                    data-test-id="session-input"
                    style={{ fontFamily: 'monospace', fontSize: '0.93em', userSelect: 'all', cursor: 'pointer' }}
                    onClick={handleEdit}
                    title="Click to edit session ID"
                >
                    {sessionId}
                </span>
            )}
            {copied ? (
                <span className="copied">Copied!</span>
            ) : (
                <button className="copy-btn" onClick={handleCopy} aria-label="Copy session ID" data-test-id="copy-session-button">
                    Copy
                </button>
            )}
            <button
                className="pull-btn"
                onClick={onPull}
                disabled={loading}
                aria-label="Pull session data"
                data-test-id="pull-button"
            >
                {loading ? 'Loading...' : 'Pull'}
            </button>

            <span className="session-divider" style={{ margin: '0 0.5em', opacity: 0.3 }}>|</span>

            <span style={{ fontWeight: 500 }}>Income:</span>
            <input
                type="number"
                min="0"
                step="100"
                placeholder="Monthly income"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onKeyDown={handleIncomeKeyDown}
                data-test-id="income-input"
                style={{
                    fontFamily: 'monospace',
                    fontSize: '0.93em',
                    width: '9em',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '0.2em 0.4em',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                }}
            />
            <button
                className="copy-btn"
                onClick={handleIncomeSave}
                disabled={incomeSaving}
                data-test-id="income-save-button"
            >
                {incomeSaving ? '...' : 'Save'}
            </button>

            {hardReload && (
                <>
                    <span className="session-divider" style={{ margin: '0 0.5em', opacity: 0.3 }}>|</span>
                    {minutesAgo != null && (
                        <span style={{ fontSize: '0.8em', opacity: 0.6 }}>
                            {minutesAgo === 0 ? 'Just updated' : `${minutesAgo}m ago`}
                        </span>
                    )}
                    <button
                        className="copy-btn"
                        onClick={hardReload}
                        disabled={loading}
                        title="Bypass cache and reload from server"
                        data-test-id="hard-reload-button"
                    >
                        Hard Reload
                    </button>
                </>
            )}
        </div>
    );
};
import { memo, useCallback } from 'react';
import amexLogo from '../../assets/amex.svg';
import citiLogo from '../../assets/citi.svg';
import discoverLogo from '../../assets/discover.svg';
import capone from '../../assets/capone.svg';
import schwab from '../../assets/schwab.svg';

import { MONTHS } from '../../constants/parserConstants';


const BankSelector = ({ bankName, bankNames, setBankName }) => (
    <div className="my-card" data-test-id="bank-filter">
        <div className="my-card-header">
            <h4 className="my-card-title">Bank Selector</h4>
        </div>
        <div className="my-card-body">
            {bankNames.length === 0 ? (
                // No banks case
                <div className="parser-select-dialog">
                    <button
                        className="my-button"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            fontFamily: '"Roboto Mono", monospace'
                        }}
                        disabled
                    >
                        None
                    </button>
                </div>
            ) : (
                // One or more banks case
                <div className="parser-select-dialog">
                    {/* ALL option when more than one bank */}
                    {bankNames.length > 1 && (
                        <button
                            className="my-button"
                            style={{
                                marginBottom: '0.5rem',
                                backgroundColor: bankName === '' ? 'var(--accent-hover)' : ' var(--accent)',
                            }}
                            onClick={() => setBankName('')}
                        >
                            <span>ALL</span>
                        </button>
                    )}

                    {/* Individual bank options */}
                    {bankNames.map((name) => (
                        <button
                            key={name}
                            className="my-button"
                            style={{
                                marginBottom: '0.5rem',
                                backgroundColor: bankName === name ? 'var(--accent-hover)' : ' var(--accent)',
                            }}
                            onClick={() => setBankName(name)}
                        >
                            <span>{name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
);


const MonthSelector = memo(({ selectedMonths, setSelectedMonths }) => {
    const handleMonthChange = useCallback(({ target: { value, checked } }) => {
        setSelectedMonths(prev => {
            const newMonths = checked
                ? [...prev, value]
                : prev.filter(month => month !== value);
            return newMonths;
        });
    }, [setSelectedMonths]);

    return (
        <div className="mb-3" data-test-id="month-filter">
            <div className="my-card-header">
                <h4 className="my-card-title">Select Months</h4>
            </div>
            <div className="my-card-body" style={{ textAlign: 'left', padding: '1rem' }}>
                <div className="parser-month-grid">
                    {MONTHS.map(({ value, label }) => (
                        <label key={value} className="parser-month-item" data-test-id={`month-${value}`}>
                            <input
                                type="checkbox"
                                value={value}
                                name={value}
                                checked={selectedMonths.includes(value)}
                                onChange={handleMonthChange}
                                style={{ accentColor: 'var(--accent)' }}
                            />
                            <span style={{ fontSize: '0.8rem' }}>
                                {label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
});



const SupportedBanks = memo(() => (
    <div className="my-card-static">
        <div className="my-card-header">
            <h4 className="my-card-title">Supported Banks</h4>
        </div>
        <div className="my-card-body">
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <img
                        src={amexLogo}
                        alt="American Express logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AMEX</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <img
                        src={discoverLogo}
                        alt="Discover logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Discover</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <img
                        src={citiLogo}
                        alt="Citi Bank logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Citi</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <img
                        src={capone}
                        alt="Capital One logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Capital One</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <img
                        src={schwab}
                        alt="Schwab logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Schwab</span>
                </div>
            </div>
        </div>
    </div>
));

export { BankSelector, MonthSelector, SupportedBanks, SessionBar };
