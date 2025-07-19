import { useState } from 'react';
// Floating Session Editor (Session ID display + copy)
const SessionEditor = ({ sessionId }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sessionId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            setCopied(false);
        }
    };

    return (
        <div className="parser-session-editor" title="Session ID">
            <span style={{ fontWeight: 500 }}>Session:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.93em', userSelect: 'all' }}>{sessionId}</span>
            {copied ? (
                <span className="copied">Copied!</span>
            ) : (
                <button className="copy-btn" onClick={handleCopy} aria-label="Copy session ID">
                    Copy
                </button>
            )}
        </div>
    );
};
/* eslint-disable react/prop-types, react/display-name */
import { memo, useCallback } from 'react';
import amexLogo from '../../assets/amex.svg';
import citiLogo from '../../assets/citi.svg';
import discoverLogo from '../../assets/discover.svg';
import capone from '../../assets/capone.svg';
import schwab from '../../assets/schwab.svg';

import { MONTHS } from '../../constants/parserConstants';


const BankSelector = ({ bankName, bankNames, setBankName }) => (
    <div className="my-card">
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
        <div className="mb-3">
            <div className="my-card-header">
                <h4 className="my-card-title">Select Months</h4>
            </div>
            <div className="my-card-body" style={{ textAlign: 'left', padding: '1rem' }}>
                <div className="parser-month-grid">
                    {MONTHS.map(({ value, label }) => (
                        <label key={value} className="parser-month-item">
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

export { BankSelector, MonthSelector, SupportedBanks, SessionEditor };