
import { useState, useCallback } from 'react';
import 'chart.js/auto';
import '../styles/stock.css';
import '../styles/parser.css';
import { useTheme, AltModernHeader } from './components/UI/MainComponents.jsx';
import UploadSection from './components/parser/UploadSection';
import BreakdownSection from './components/parser/BreakdownSection';
import logo from './assets/parser-logo.svg';

import { useParserData } from './hooks/useParserData';

const Parser = () => {
    const { theme, toggleTheme } = useTheme();
    const [uploadMessage, setUploadMessage] = useState('Upload your PDF statements to get started');
    const [showBreakdown, setShowBreakdown] = useState(false);

    const {
        bankName,
        bankNames,
        sortedRecords,
        selectedMonths,
        loading,
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
        sessionId
    } = useParserData();

    const handleUploadComplete = useCallback(async () => {
        // Refresh data from backend
        await Promise.all([fetchRecords(), fetchBankNames()]);

        setShowBreakdown(true);
        // Scroll to breakdown section
        setTimeout(() => {
            const breakdownSection = document.querySelector('.breakdown-section');
            if (breakdownSection) {
                breakdownSection.scrollIntoView({ behavior: 'smooth' });
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
            <div className="my-section">

                <UploadSection
                    onUploadComplete={handleUploadComplete}
                    uploadMessage={uploadMessage}
                    setUploadMessage={setUploadMessage}
                    sessionId={sessionId}
                />

                {(showBreakdown || sortedRecords.length > 0) && (
                    <BreakdownSection
                        bankName={bankName}
                        bankNames={bankNames}
                        setBankName={setBankName}
                        selectedMonths={selectedMonths}
                        setSelectedMonths={setSelectedMonths}
                        sortedRecords={sortedRecords}
                        lineData={lineData}
                        pieData={pieData}
                        totalAmount={totalAmount}
                        requestSort={requestSort}
                        loading={loading}
                        onClearData={handleClearData}
                    />
                )}
            </div>
        </>
    );
};

export default Parser;