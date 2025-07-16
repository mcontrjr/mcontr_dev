import { MONTH_NAMES, WEEK_CALCULATION, CURRENCY_CONFIG } from '../constants/parserConstants';

export const processWeeklyData = (data) => {
  const weeklyData = {};

  data.labels.forEach((date, index) => {
    const [year, month, day] = date.split('-');
    const weekNum = Math.ceil(parseInt(day) / WEEK_CALCULATION.daysPerWeek);
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = MONTH_NAMES[monthIndex] || month;
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
        purchases: true
      },
      {
        label: 'Payments',
        data: Object.values(weeklyData).map(week => week.payments),
        payments: true
      }
    ]
  };
};

export const processChartData = (records, selectedMonths) => {
  const filteredRecords = selectedMonths.length > 0
    ? records.filter(record => selectedMonths.includes(record.date.split('-')[1]))
    : records;
  
  const sortedRecords = filteredRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

  const dates = sortedRecords.map(record => record.date);
  const purchases = sortedRecords.map(record => record.amount > 0 ? record.amount : 0);
  const payments = sortedRecords.map(record => record.amount < 0 ? record.amount : 0);

  return {
    lineData: {
      labels: dates,
      datasets: [
        {
          label: 'Purchases',
          data: purchases,
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
        },
        {
          label: 'Payments',
          data: payments,
          borderColor: 'rgb(40, 139, 58)',
          backgroundColor: 'rgba(26, 125, 35, 0.2)',
        },
      ],
    },
    sortedRecords
  };
};

export const processPieChartData = (records) => {
  const categoryData = {};
  const purchaseRecords = records.filter(record => record.amount > 0);

  purchaseRecords.forEach(record => {
    categoryData[record.category] = (categoryData[record.category] || 0) + record.amount;
  });

  const sortedCategories = Object.fromEntries(
    Object.entries(categoryData).sort(([, a], [, b]) => b - a)
  );

  return {
    labels: Object.keys(sortedCategories),
    datasets: [{
      label: 'Spending by Category',
      data: Object.values(sortedCategories),
    }]
  };
};

export const calculateFinancialMetrics = (records) => {
  const purchaseRecords = records.filter(record => record.amount > 0);
  const paymentRecords = records.filter(record => record.amount < 0);

  const totalPurchases = purchaseRecords.reduce((sum, record) => sum + record.amount, 0);
  const totalPayments = Math.abs(paymentRecords.reduce((sum, record) => sum + record.amount, 0));
  const netSpending = totalPurchases - totalPayments;
  const avgPurchase = purchaseRecords.length > 0 ? totalPurchases / purchaseRecords.length : 0;

  return {
    totalPurchases: formatCurrency(totalPurchases),
    totalPayments: formatCurrency(totalPayments),
    netSpending: formatCurrency(netSpending),
    avgPurchase: formatCurrency(avgPurchase),
    transactionCount: records.length,
    purchaseCount: purchaseRecords.length
  };
};

export const formatCurrency = (amount) => {
  return amount.toLocaleString(CURRENCY_CONFIG.locale, {
    style: CURRENCY_CONFIG.style,
    currency: CURRENCY_CONFIG.currency
  });
};

export const filterRecordsBySearch = (records, searchText) => {
  if (!searchText.trim()) return records;
  
  return records.filter(record =>
    record.description.toLowerCase().includes(searchText.toLowerCase())
  );
};

export const sortRecords = (records, sortConfig) => {
  if (!sortConfig) return records;

  return [...records].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });
};