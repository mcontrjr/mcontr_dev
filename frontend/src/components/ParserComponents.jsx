import { useState, memo, useMemo, useCallback } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import walletLogo from '../assets/wallet.svg';
import amexLogo from '../assets/amex.svg';
import citiLogo from '../assets/citi.svg';
import discoverLogo from '../assets/discover.svg';
import noPurchases from '../assets/no-purchases.svg';
import 'chart.js/auto';
import '../../styles/stock.css';

import { useThemeColors } from '../hooks/useThemeColors';
import { processWeeklyData, filterRecordsBySearch } from '../utils/dataProcessing';
import { 
  API_URL, 
  CHART_COLORS, 
  CHART_DIMENSIONS, 
  MONTHS, 
  CHART_CONFIG 
} from '../constants/parserConstants';

const Header = () => (
    <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <h1>MyParser</h1>
            <a href="https://github.com/mcontrjr/playground/tree/main/projects/parser" target="_blank">
                <img src={walletLogo} className="logo react" alt="Wallet logo" />
            </a>
        </div>
    </>
);

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

const AmountBar = memo(({ lineData }) => {
    const colors = useThemeColors();
    
    const weeklyData = useMemo(() => {
        if (!lineData?.labels?.length) return { labels: [], datasets: [] };
        
        const processed = processWeeklyData(lineData);
        return {
            ...processed,
            datasets: processed.datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: index === 0 ? CHART_COLORS.accent : CHART_COLORS.secondary,
                barPercentage: CHART_CONFIG.barPercentage,
            }))
        };
    }, [lineData]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    color: colors.border
                },
                ticks: {
                    color: colors.secondary,
                    font: {
                        family: CHART_CONFIG.fontFamily
                    }
                }
            },
            y: {
                grid: {
                    color: colors.border
                },
                ticks: {
                    color: colors.secondary,
                    callback: (value) => `$${value.toLocaleString()}`,
                    font: {
                        family: CHART_CONFIG.fontFamily
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        return `${context.dataset.label}: $${value.toLocaleString()}`;
                    }
                },
                titleFont: {
                    family: CHART_CONFIG.fontFamily
                },
                bodyFont: {
                    family: CHART_CONFIG.fontFamily
                }
            },
            legend: {
                labels: {
                    color: colors.primary,
                    font: {
                        family: CHART_CONFIG.fontFamily
                    }
                }
            }
        }
    }), [colors]);

    return (
        <div className="parser-chart-container">
            <Bar data={weeklyData} options={chartOptions} />
        </div>
    );
});

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

const AmountPie = ({ pieData, totalAmount }) => {
    const getThemeColors = () => {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            primary: computedStyle.getPropertyValue('--text-primary').trim(),
            secondary: computedStyle.getPropertyValue('--text-secondary').trim(),
            border: computedStyle.getPropertyValue('--border').trim(),
        };
    };

    const colors = getThemeColors();

    // Create a custom dataset with logo colors
    const customPieData = {
        ...pieData,
        datasets: [{
            ...pieData.datasets[0],
            backgroundColor: [
                '#0d3b66', // Navy blue from logo
                '#006600', // Green from logo
                '#f4d35e', // Yellow from logo
                // Generate additional colors by adjusting opacity of the main colors
                'rgba(50, 124, 194, 0.8)',   // Navy with 80% opacity
                'rgba(4, 210, 4, 0.8)',     // Green with 80% opacity
                'rgba(243, 210, 89, 0.8)',  // Yellow with 80% opacity
                'rgba(87, 243, 241, 0.6)',   // Navy with 60% opacity
                'rgba(245, 234, 40, 0.6)',     // Green with 60% opacity
                'rgba(191, 35, 4, 0.6)',  // Yellow with 60% opacity
                // Add more variations if needed
            ]
        }]
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', height: '500px' }}>
            {/* Pie Chart */}
            <div style={{ flex: '1', minWidth: '400px' }}>
                <Pie 
                    data={customPieData} 
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                titleFont: {
                                    family: '"Roboto Mono", monospace'
                                },
                                bodyFont: {
                                    family: '"Roboto Mono", monospace'
                                },
                                callbacks: {
                                    label: function(context) {
                                        const value = context.raw;
                                        return `${context.label}: $${value.toLocaleString()}`;
                                    }
                                }
                            },
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: colors.primary,
                                    padding: 20,
                                    font: {
                                        family: '"Roboto Mono", monospace'
                                    }
                                }
                            }
                        }
                    }}
                />
            </div>
            
            {/* Metrics Panel */}
            <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="my-card" style={{ margin: 0 }}>
                    <div className="my-card-header">
                        <h4 className="my-card-title">Financial Summary</h4>
                    </div>
                    <div className="my-card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Purchases:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.totalPurchases}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Payments:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.totalPayments}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Net Spending:</span>
                                <span style={{ color: totalAmount.netSpending?.includes('-') ? CHART_COLORS.secondary : 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.netSpending}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Avg Purchase:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.avgPurchase}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Purchases:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.purchaseCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Transactions:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.transactionCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

const RecordTable = memo(({ sortedRecords, requestSort }) => {
    const [searchText, setSearchText] = useState('');

    const filteredRecords = useMemo(() => 
        filterRecordsBySearch(sortedRecords, searchText),
        [sortedRecords, searchText]
    );

    const handleSearchChange = useCallback((e) => {
        setSearchText(e.target.value);
    }, []);

    return (
        <div className="parser-records-table">
            <div className="mb-3">
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>All Statement Records [{filteredRecords.length}]</h3>
                <input
                    type="text"
                    placeholder="Search records..."
                    value={searchText}
                    onChange={handleSearchChange}
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontFamily: CHART_CONFIG.fontFamily,
                        fontSize: '1rem'
                    }}
                />
            </div>
            
            <div className="custom-table-container" style={{ maxHeight: `${CHART_DIMENSIONS.tableMaxHeight}px`, overflowY: 'auto' }}>
                <table className="custom-table">
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>
                        <tr>
                            <th onClick={() => requestSort('date')} style={{ cursor: 'pointer', padding: '1rem' }}>
                                Date ↕
                            </th>
                            <th onClick={() => requestSort('description')} style={{ cursor: 'pointer', padding: '1rem', minWidth: '250px' }}>
                                Description ↕
                            </th>
                            <th onClick={() => requestSort('amount')} style={{ cursor: 'pointer', padding: '1rem' }}>
                                Amount ↕
                            </th>
                            <th onClick={() => requestSort('category')} style={{ cursor: 'pointer', padding: '1rem' }}>
                                Category ↕
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record) => (
                            <tr key={record.id} className="custom-table-row">
                                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{record.date}</td>
                                <td style={{ padding: '1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.description}</td>
                                <td style={{ 
                                    padding: '1rem',
                                    color: record.amount >= 0 ? 'var(--text-primary)' : CHART_COLORS.secondary,
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {record.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        backgroundColor: 'var(--accent)',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}>
                                        {record.category}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

const TabNavigation = memo(({ activeTab, setActiveTab }) => (
    <div className="gallery-tabs-header">
        <button
            className={`gallery-tab ${activeTab === 'amountOverTime' ? 'active' : ''}`}
            onClick={() => setActiveTab('amountOverTime')}
        >
            Time Series
        </button>
        <button
            className={`gallery-tab ${activeTab === 'distribution' ? 'active' : ''}`}
            onClick={() => setActiveTab('distribution')}
        >
            Distribution
        </button>
        <button
            className={`gallery-tab ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
        >
            Records
        </button>
    </div>
));

const MainContent = memo(({ sortedRecords, activeTab, lineData, pieData, totalAmount, requestSort }) => {
    if (sortedRecords.length === 0) {
        return (
            <div className="parser-card-container">
                <div className="my-card parser-card-centered">
                    <div className="my-card-body">
                        <h3 style={{ color: 'var(--text-primary)' }}>No purchases for selected months</h3>
                        <img src={noPurchases} className="custom-img" alt="No purchases" style={{ maxWidth: '200px', marginTop: '1rem' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="parser-card-container">
            {activeTab === 'amountOverTime' && (
                <div className="my-card parser-card-chart">
                    <div className="my-card-header">
                        <h3 className="my-card-title">Weekly Purchases & Payments</h3>
                    </div>
                    <div className="my-card-body" style={{ padding: 0 }}>
                        <AmountBar lineData={lineData} />
                    </div>
                </div>
            )}
            {activeTab === 'distribution' && (
                <div className="my-card parser-card-chart">
                    <div className="my-card-header">
                        <h3 className="my-card-title">Spending Distribution & Metrics</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Purchase categories and financial overview</p>
                    </div>
                    <div className="my-card-body" style={{ padding: '1rem' }}>
                        <AmountPie
                            pieData={pieData}
                            totalAmount={totalAmount}
                        />
                    </div>
                </div>
            )}
            {activeTab === 'records' && (
                <div className="my-card parser-card-chart">
                    <div className="my-card-body">
                        <RecordTable
                            sortedRecords={sortedRecords}
                            requestSort={requestSort}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

const ParserTabs = ({ activeTab, bankName, bankNames, setBankName, setActiveTab, lineData, pieData, totalAmount, sortedRecords, searchText, setSearchText, requestSort, selectedMonths, setSelectedMonths, loading }) => (
    <div className="gallery-tabs-container">
        <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
        />
        
        <div className="gallery-tab-content">
            <div className="parser-layout">
                {/* Left Sidebar - Controls (20% width) */}
                <div className="parser-sidebar">
                    <div className="parser-card-sidebar">
                        <BankSelector 
                            bankName={bankName}
                            bankNames={bankNames}
                            setBankName={setBankName}
                        />
                        <MonthSelector
                            selectedMonths={selectedMonths}
                            setSelectedMonths={setSelectedMonths}
                        />
                    </div>
                </div>
                
                {/* Main Content Area (80% width) */}
                <div className="parser-main-content">
                    {loading ? (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            height: '400px' 
                        }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                border: '4px solid var(--border)', 
                                borderTop: '4px solid var(--accent)', 
                                borderRadius: '50%', 
                                animation: 'spin 1s linear infinite' 
                            }}></div>
                        </div>
                    ) : (
                        <MainContent 
                            sortedRecords={sortedRecords}
                            activeTab={activeTab}
                            lineData={lineData}
                            pieData={pieData}
                            totalAmount={totalAmount}
                            requestSort={requestSort}
                        />
                    )}
                </div>
            </div>
        </div>
    </div>
);

const UploadTab = memo(({uploadMessage, setUploadMessage, fetchRecords, fetchBankNames}) => (
    <div className="text-center">
        <div className="my-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="my-card-body">
                <button 
                    className="my-button" 
                    onClick={() => document.getElementById('fileInput').click()}
                    style={{ 
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        minWidth: '200px'
                    }}
                >
                    Choose Files
                </button>
                
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    multiple
                    accept=".pdf"
                    onChange={(e) => {
                        const files = e.target.files;
                        if (files.length === 0) return;
                        
                        fetchRecords(files);
                    }}
                />
            </div>
            
            <div className="my-card-footer">
                <p style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--text-muted)', 
                    margin: 0,
                    fontStyle: 'italic'
                }}>
                    {uploadMessage}
                </p>
            </div>
        </div>
    </div>
));

const SupportedBanks = memo(() => (
    <div className="my-card parser-card-centered text-center">
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
            </div>
        </div>
    </div>
));

export { Header, BankSelector, MonthSelector, ParserTabs, SupportedBanks, UploadTab };