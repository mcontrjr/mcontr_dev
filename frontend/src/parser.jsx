import React, { useState, useCallback } from 'react';
import 'chart.js/auto';
import '../styles/stock.css';
import '../styles/parser.css';
import { SupportedBanks, UploadTab } from './components/ParserComponents.jsx';
import { useTheme, AltModernHeader } from './components/MainComponents.jsx';
import { Bar, Pie } from 'react-chartjs-2';
import noPurchases from './assets/no-purchases.svg';
import logo from './assets/parser-logo.svg';

import { useParserData } from './hooks/useParserData';
import { useThemeColors } from './hooks/useThemeColors';
import { processWeeklyData } from './utils/dataProcessing';
import { 
  CHART_COLORS, 
  CHART_DIMENSIONS, 
  CHART_CONFIG, 
  TAB_NAMES 
} from './constants/parserConstants';

const AmountBar = ({ lineData }) => {
    const getThemeColors = () => {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            primary: computedStyle.getPropertyValue('--text-primary').trim(),
            secondary: computedStyle.getPropertyValue('--text-secondary').trim(),
            border: computedStyle.getPropertyValue('--border').trim(),
        };
    };

    const colors = getThemeColors();
    
    const processWeeklyData = (data) => {
        const weeklyData = {};
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        data.labels.forEach((date, index) => {
            const [year, month, day] = date.split('-');
            const weekNum = Math.ceil(parseInt(day) / 7);
            const monthIndex = parseInt(month, 10) - 1;
            const monthName = monthNames[monthIndex] || month;
            const weekKey = `${year}-${month}-W${weekNum}`;

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    purchases: 0,
                    payments: 0,
                    label: `${monthName} Week ${weekNum}`
                };
            }

            weeklyData[weekKey].purchases += data.datasets[0].data[index] || 0;
            weeklyData[weekKey].payments += Math.abs(data.datasets[1].data[index] || 0);
        });
        
        return {
            labels: Object.values(weeklyData).map(week => week.label),
            datasets: [
                {
                    label: 'Purchases',
                    data: Object.values(weeklyData).map(week => week.purchases),
                    backgroundColor: '#f4d35e',
                    barPercentage: 0.8,
                },
                {
                    label: 'Payments',
                    data: Object.values(weeklyData).map(week => week.payments),
                    backgroundColor: '#006600',
                    barPercentage: 0.8,
                }
            ]
        };
    };

    const weeklyData = processWeeklyData(lineData);

    return (
        <div className="parser-chart-container">
            <Bar
                data={weeklyData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: colors.secondary,
                                font: { family: '"Roboto Mono", monospace' }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                color: colors.secondary,
                                callback: (value) => `$${value.toLocaleString()}`,
                                font: { family: '"Roboto Mono", monospace' }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                                }
                            }
                        },
                        legend: {
                            labels: {
                                color: colors.primary,
                                font: { family: '"Roboto Mono", monospace' }
                            }
                        }
                    }
                }}
            />
        </div>
    );
};

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

    const customPieData = {
        ...pieData,
        datasets: [{
            ...pieData.datasets[0],
            backgroundColor: [
                '#0d3b66', '#006600', '#f4d35e',
                'rgba(50, 124, 194, 0.8)', 'rgba(4, 210, 4, 0.8)', 'rgba(243, 210, 89, 0.8)',
                'rgba(87, 243, 241, 0.6)', 'rgba(245, 234, 40, 0.6)', 'rgba(191, 35, 4, 0.6)',
            ]
        }]
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', height: '500px' }}>
            <div style={{ flex: '1', minWidth: '400px' }}>
                <Pie 
                    data={customPieData} 
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: $${context.raw.toLocaleString()}`;
                                    }
                                }
                            },
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: colors.primary,
                                    padding: 20,
                                    font: { family: '"Roboto Mono", monospace' }
                                }
                            }
                        }
                    }}
                />
            </div>
            
            <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="my-card" style={{ margin: 0 }}>
                    <div className="my-card-header">
                        <h4 className="my-card-title">Financial Summary</h4>
                    </div>
                    <div className="my-card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Purchases:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.totalPurchases}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Payments:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.totalPayments}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Net Spending:</span>
                                <span style={{ color: totalAmount.netSpending?.includes('-') ? '#006600' : 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.netSpending}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Avg Purchase:</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalAmount.avgPurchase}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
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

const RecordTable = ({ sortedRecords, requestSort }) => {
    const [searchText, setSearchText] = useState('');

    const filteredRecords = sortedRecords.filter(record =>
        record.description.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="parser-records-table">
            <div className="mb-3">
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>All Statement Records [{filteredRecords.length}]</h3>
                <input
                    type="text"
                    placeholder="Search records..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontFamily: '"Roboto Mono", monospace',
                        fontSize: '1rem'
                    }}
                />
            </div>
            
            <div className="custom-table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
                                    color: record.amount >= 0 ? 'var(--text-primary)' : '#006600',
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
};

const Parser = () => {
    const { theme, toggleTheme } = useTheme();
    const [uploadMessage, setUploadMessage] = useState('Upload your statements here..');
    const [activeFunctionTab, setActiveFunctionTab] = useState(TAB_NAMES.UPLOAD);
    
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
        uploadFiles,
        retryFetch
    } = useParserData();

    const handleUpload = useCallback((files) => {
        uploadFiles(files, setUploadMessage);
    }, [uploadFiles, setUploadMessage]);



    if (error) return (
        <div className="parser-dashboard-layout">
            <div className="parser-nav-panel">
                <div className="parser-nav-header">
                    <h3>Parser</h3>
                </div>
            </div>
            <div className="parser-main-layout">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="parser-main-card">
                        <h3 style={{ color: 'var(--text-primary)' }}>Error Loading Data</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                            {error.message || 'Unable to connect to the parser server. Please try again.'}
                        </p>
                        <button 
                            className="my-button mt-2" 
                            onClick={retryFetch}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            <AltModernHeader  theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
            <div className="parser-dashboard-layout">
                {/* Left Navigation Panel - 10% */}
                <div className="parser-nav-panel">
                    <div className="parser-nav-header">
                        <h3>Parser</h3>
                    </div>
                    <div className="parser-nav-buttons">
                        <button
                            className={`parser-nav-button ${activeFunctionTab === TAB_NAMES.UPLOAD ? 'active' : ''}`}
                            onClick={() => setActiveFunctionTab(TAB_NAMES.UPLOAD)}
                        >
                            Upload
                        </button>
                        <button
                            className={`parser-nav-button ${activeFunctionTab === TAB_NAMES.ANALYZE ? 'active' : ''}`}
                            onClick={() => {
                                setActiveFunctionTab(TAB_NAMES.ANALYZE)
                                setUploadMessage('Upload more statements here.')
                            }}
                        >
                            Breakdown
                        </button>
                    </div>
                </div>

                {/* Filters Sidebar - 20% */}
                {activeFunctionTab === TAB_NAMES.ANALYZE && (
                    <div className="parser-filters-sidebar">
                        <div className="parser-filters-header">
                            <h3>Filters</h3>
                        </div>
                        <div className="parser-filters-content">
                            <div className="my-card mb-2">
                                <div className="my-card-header">
                                    <h4 className="my-card-title">Bank Selector</h4>
                                </div>
                                <div className="my-card-body">
                                    {bankNames.length === 0 ? (
                                        <div className="parser-select-dialog">
                                            <button
                                                className="my-button"
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'var(--bg-card)',
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--text-secondary)',
                                                    fontFamily: CHART_CONFIG.fontFamily
                                                }}
                                                disabled
                                            >
                                                None
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="parser-select-dialog">
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
                            
                            <div className="my-card">
                                <div className="my-card-header">
                                    <h4 className="my-card-title">Select Months</h4>
                                </div>
                                <div className="my-card-body" style={{ textAlign: 'left', padding: '1rem' }}>
                                    <div className="parser-month-grid">
                                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month) => (
                                            <label key={month} className="parser-month-item">
                                                <input
                                                    type="checkbox"
                                                    value={month}
                                                    name={month}
                                                    checked={selectedMonths.includes(month)}
                                                    onChange={({ target: { value, checked } }) => {
                                                        setSelectedMonths(prev => {
                                                            const newMonths = checked 
                                                                ? [...prev, value] 
                                                                : prev.filter(month => month !== value);
                                                            return newMonths;
                                                        });
                                                    }}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                <span style={{ fontSize: '0.8rem' }}>
                                                    {new Date(0, month - 1).toLocaleString('default', { month: 'short' })}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area - 70% */}
                <div className="parser-main-layout">
                    <div className="parser-content-area">
                        {activeFunctionTab === TAB_NAMES.ANALYZE && (
                            <div className="parser-tab-content">
                                {loading ? (
                                    <div className="parser-loading">
                                        <div className="parser-spinner"></div>
                                    </div>
                                ) : (
                                    <>
                                        {sortedRecords.length > 0 ? (
                                            <>
                                                {/* First Card: Weekly Chart */}
                                                <div className="parser-main-card">
                                                    <h3>Weekly Purchases & Payments</h3>
                                                    <div style={{ height: '400px' }}>
                                                        <AmountBar lineData={lineData} />
                                                    </div>
                                                </div>

                                                {/* Second Card: Spending Distribution */}
                                                <div className="parser-main-card">
                                                    <h3>Spending Distribution & Metrics</h3>
                                                    <AmountPie pieData={pieData} totalAmount={totalAmount} />
                                                </div>

                                                {/* Third Card: Records Table */}
                                                <div className="parser-main-card">
                                                    <h3>Transaction Records</h3>
                                                    <RecordTable sortedRecords={sortedRecords} requestSort={requestSort} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="parser-main-card">
                                                <div style={{ textAlign: 'center' }}>
                                                    <h3 style={{ color: 'var(--text-primary)' }}>No purchases for selected months</h3>
                                                    <img src={noPurchases} className="custom-img" alt="No purchases" style={{ maxWidth: '200px', marginTop: '1rem' }} />
                                                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                                                        Try selecting different months or uploading more statements.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        
                        {activeFunctionTab === TAB_NAMES.UPLOAD && (
                            <div className="parser-upload-content">
                                <UploadTab
                                    uploadMessage={uploadMessage}
                                    setUploadMessage={setUploadMessage}
                                    fetchRecords={handleUpload}
                                    fetchBankNames={() => {}}
                                />
                                
                                <div className="mt-4">
                                    <SupportedBanks />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Parser;