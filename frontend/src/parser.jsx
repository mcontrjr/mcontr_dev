import { useState, useCallback, useEffect, useRef } from 'react';
import 'chart.js/auto';
import '../styles/stock.css';
import '../styles/parser.css';
import { useTheme, AltModernHeader } from './components/UI/MainComponents.jsx';
import UploadSection from './components/parser/UploadSection.jsx';
import TabbedBreakdownSection from './components/parser/TabbedBreakdownSection.jsx';
import logo from './assets/parser-logo.svg';
import { SessionBar } from './components/parser/ParserComponents.jsx';

import { useParserData } from './hooks/useParserData.js';

const Parser = () => {
    const { theme, toggleTheme } = useTheme();
    const [uploadMessage, setUploadMessage] = useState('Upload your PDF statements to get started');
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [uploadExpanded, setUploadExpanded] = useState(true);

    const uploadRef = useRef(null);
    // Enabled after data first loads + initialization debounce settles (~800ms)
    const collapseEnabledRef = useRef(false);

    const {
        bankName,
        bankNames,
        sortedRecords,
        allRecords,
        selectedMonths,
        availableMonths,
        loading,
        loadingStates,
        isLoading,
        error,
        lineData,
        pieData,
        weeklyData,
        totalAmount,
        monthlyIncome,
        lastUpdated,
        setBankName,
        setSelectedMonths,
        requestSort,
        clearData,
        fetchRecords,
        retryFetch,
        hardReload,
        saveMonthlyIncome,
        sessionId,
        updateRecord,
        updateSessionId,
        categories,
        sessionOverrides,
        upsertCategory,
        deleteCategory,
    } = useParserData();

    // Enable filter-based collapse 800ms after data first arrives,
    // giving time for the initial selectedMonths population to settle.
    useEffect(() => {
        if (allRecords.length === 0) {
            collapseEnabledRef.current = false;
            return;
        }
        const t = setTimeout(() => {
            collapseEnabledRef.current = true;
        }, 800);
        return () => clearTimeout(t);
    }, [allRecords.length]);

    // Auto-collapse on filter changes once data is loaded
    useEffect(() => {
        if (collapseEnabledRef.current && uploadExpanded) {
            setUploadExpanded(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bankName, selectedMonths]);

    // Auto-collapse when user scrolls past the upload section
    useEffect(() => {
        if (!uploadExpanded) return;
        const handleScroll = () => {
            const el = uploadRef.current;
            if (!el) return;
            if (el.getBoundingClientRect().bottom < 0) {
                setUploadExpanded(false);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [uploadExpanded]);

    const handleUploadComplete = useCallback(async () => {
        await fetchRecords();
        setShowBreakdown(true);
        setUploadExpanded(false);
        setTimeout(() => {
            const breakdownSection = document.querySelector('.parser-data-section');
            if (breakdownSection) {
                breakdownSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);
    }, [fetchRecords]);

    const handleClearData = useCallback(async () => {
        const success = await clearData();
        if (success) {
            setShowBreakdown(false);
            setUploadExpanded(true);
            setUploadMessage('All data cleared successfully. Upload new statements to get started.');
        } else {
            setUploadMessage('Error clearing data. Please try again.');
        }
    }, [clearData]);

    const handlePull = useCallback(async () => {
        await fetchRecords();
        setShowBreakdown(true);
        setUploadExpanded(false);
    }, [fetchRecords]);

    // FAB: expand upload section and scroll to it
    const handleFabClick = useCallback(() => {
        setUploadExpanded(true);
        setTimeout(() => {
            uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }, []);

    const dataLoaded = showBreakdown || allRecords.length > 0;

    if (error) return (
        <>
            <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
            <div className="parser-container" data-test-id="parser-container">
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
    );

    return (
        <>
            <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
            <div className="parser-container" data-test-id="parser-container" style={{ position: 'relative' }}>
                <SessionBar
                    sessionId={sessionId}
                    onSessionIdChange={updateSessionId}
                    onPull={handlePull}
                    loading={loading}
                    monthlyIncome={monthlyIncome}
                    onIncomeSave={saveMonthlyIncome}
                    hardReload={hardReload}
                    lastUpdated={lastUpdated}
                />

                {/* Upload section anchor — always in DOM for scroll detection */}
                <div ref={uploadRef}>
                    {uploadExpanded && (
                        <div data-test-id="upload-section">
                            <UploadSection
                                onUploadComplete={handleUploadComplete}
                                uploadMessage={uploadMessage}
                                setUploadMessage={setUploadMessage}
                                sessionId={sessionId}
                            />
                        </div>
                    )}
                </div>

                {dataLoaded && (
                    <TabbedBreakdownSection
                        sessionId={sessionId}
                        updateRecord={updateRecord}
                        bankName={bankName}
                        bankNames={bankNames}
                        setBankName={setBankName}
                        selectedMonths={selectedMonths}
                        setSelectedMonths={setSelectedMonths}
                        availableMonths={availableMonths}
                        sortedRecords={sortedRecords}
                        allRecords={allRecords}
                        lineData={lineData}
                        pieData={pieData}
                        totalAmount={totalAmount}
                        weeklyData={weeklyData}
                        requestSort={requestSort}
                        loading={loading}
                        loadingStates={loadingStates}
                        onClearData={handleClearData}
                        monthlyIncome={monthlyIncome}
                        categories={categories}
                        sessionOverrides={sessionOverrides}
                        upsertCategory={upsertCategory}
                        deleteCategory={deleteCategory}
                    />
                )}

                {/* Floating upload button — expands and scrolls to upload section */}
                {!uploadExpanded && (
                    <button
                        className="upload-fab"
                        onClick={handleFabClick}
                        title="Upload more files"
                        data-test-id="upload-fab"
                    >
                        [+]
                    </button>
                )}

                {/* Loading overlay */}
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
