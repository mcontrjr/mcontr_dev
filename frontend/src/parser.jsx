import React, { useState, useCallback } from 'react';
import 'chart.js/auto';
import '../styles/stock.css';
import '../styles/parser.css';
import { useTheme, AltModernHeader } from './components/UI/MainComponents.jsx';
import UploadSection from './components/parser/UploadSection.jsx';
import TabbedBreakdownSection from './components/parser/TabbedBreakdownSection.jsx';
import logo from './assets/parser-logo.svg';
import { SessionEditor } from './components/parser/ParserComponents.jsx';

import { useParserData } from './hooks/useParserData.js';

const Parser = () => {
    const { theme, toggleTheme } = useTheme();
    const [uploadMessage, setUploadMessage] = useState('Upload your PDF statements to get started');
    const [showBreakdown, setShowBreakdown] = useState(false);

    const {
        bankName,
        bankNames,
        sortedRecords,
        allRecords,
        selectedMonths,
        loading,
        loadingStates,
        isLoading,
        error,
        lineData,
        pieData,
        totalAmount,
        setBankName,
        setSelectedMonths,
        requestSort,
        clearData,
        fetchRecords,
        fetchBankNames,
        retryFetch,
        sessionId,
        updateRecord,
        updateSessionId,
    } = useParserData();

    const handleUploadComplete = useCallback(async () => {
        // Refresh data from backend
        await Promise.all([fetchRecords(), fetchBankNames()]);

        setShowBreakdown(true);
        // Scroll to breakdown section with better timing
        setTimeout(() => {
            const breakdownSection = document.querySelector('.parser-data-section');
            if (breakdownSection) {
                breakdownSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);
    }, [fetchRecords, fetchBankNames]);

    const handleClearData = useCallback(async () => {
        const success = await clearData();
        if (success) {
            setShowBreakdown(false);
            setUploadMessage('All data cleared successfully. Upload new statements to get started.');
        } else {
            setUploadMessage('Error clearing data. Please try again.');
        }
    }, [clearData]);

    if (error) return (
        <>
            <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
            <div className="parser-container">
                <div className="parser-header">
                    <h1>Financial Statement Parser</h1>
                    <p>Upload your bank statements and get instant insights into your spending patterns</p>
                </div>

                <div className="breakdown-section">
                    <div className="breakdown-empty">
                        <div className="empty-icon">[Error]</div>
                        <h3>Error Loading Data</h3>
                        <p>{error.message || 'Unable to connect to the parser server. Please try again.'}</p>
                        <button
                            onClick={retryFetch}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--text-primary)',
                                color: 'var(--bg-card)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                marginTop: '1rem'
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </>
    )

    return (
        <>
            <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
            <div className="parser-container" style={{ position: 'relative' }}>
                <SessionEditor sessionId={sessionId} onSessionIdChange={updateSessionId} />

                <UploadSection
                    onUploadComplete={handleUploadComplete}
                    uploadMessage={uploadMessage}
                    setUploadMessage={setUploadMessage}
                    sessionId={sessionId}
                />

                {(showBreakdown || allRecords.length > 0) && (
                    <TabbedBreakdownSection
                        bankName={bankName}
                        bankNames={bankNames}
                        setBankName={setBankName}
                        selectedMonths={selectedMonths}
                        setSelectedMonths={setSelectedMonths}
                        sortedRecords={sortedRecords}
                        allRecords={allRecords}
                        lineData={lineData}
                        pieData={pieData}
                        totalAmount={totalAmount}
                        requestSort={requestSort}
                        loading={loading}
                        loadingStates={loadingStates}
                        onClearData={handleClearData}
                    />
                )}

                {/* Loading overlay for when data is processing */}
                {isLoading && sortedRecords.length > 0 && (
                    <div className="global-loading-overlay">
                        <div className="global-loading-content">
                            <div className="black-spinner"></div>
                            <p>Processing data...</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Parser;