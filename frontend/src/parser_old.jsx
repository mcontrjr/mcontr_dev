import React, { useState, useCallback } from 'react';
import 'chart.js/auto';
import '../styles/stock.css';
import '../styles/parser.css';
import '../styles/parser-mobile.css';
import { useTheme, AltModernHeader } from './components/MainComponents.jsx';
import UploadSection from './components/UploadSection';
import BreakdownSection from './components/BreakdownSection';
import { SupportedBanks } from './components/ParserComponents.jsx';
import logo from './assets/parser-logo.svg';

import { useParserData } from './hooks/useParserData';
import { TAB_NAMES } from './constants/parserConstants';

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
        uploadFiles,
        retryFetch
    } = useParserData();

    const handleUploadComplete = useCallback((data) => {
        setShowBreakdown(true);
        // Scroll to breakdown section
        setTimeout(() => {
            const breakdownSection = document.querySelector('.breakdown-section');
            if (breakdownSection) {
                breakdownSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    }, []);



    if (error) return (
        <>
            <AltModernHeader theme={theme} toggleTheme={toggleTheme} light_logo={logo} dark_logo={logo} />
            <div className="parser-container">
                <div className="error-section">
                    <div className="error-card">
                        <h3>Error Loading Data</h3>
                        <p>{error.message || 'Unable to connect to the parser server. Please try again.'}</p>
                        <button className="retry-button" onClick={retryFetch}>
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
            <div className="parser-container">
                <UploadSection 
                    onUploadComplete={handleUploadComplete}
                    uploadMessage={uploadMessage}
                    setUploadMessage={setUploadMessage}
                />
                
                <div className="supported-banks-section">
                    <SupportedBanks />
                </div>
                
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
                    />
                )}
            </div>
        </>
    );
};

export default Parser;