"""
Unit tests for the DataProcessor class.
"""

import pytest
from datetime import date
from src.data_processor import DataProcessor
from src.models import TransactionRecord


@pytest.fixture
def records():
    """Sample records for testing."""
    return [
        TransactionRecord(id=1, bank='AMEX', date=date(2025, 1, 15), description='STARBUCKS', amount=15.50, category='FOOD'),
        TransactionRecord(id=2, bank='CITI', date=date(2025, 1, 20), description='SHELL GAS', amount=45.00, category='GAS'),
        TransactionRecord(id=3, bank='AMEX', date=date(2025, 2, 5), description='AMAZON', amount=89.99, category='SHOPPING'),
        TransactionRecord(id=4, bank='DISCOVER', date=date(2025, 3, 10), description='PAYMENT', amount=-500.00, category='PAYMENT'),
        TransactionRecord(id=5, bank='AMEX', date=date(2025, 1, 25), description='COSTCO', amount=125.00, category='COSTCO'),
    ]


@pytest.fixture
def single_record():
    return [
        TransactionRecord(id=1, bank='AMEX', date=date(2025, 6, 15), description='COFFEE', amount=5.00, category='FOOD'),
    ]


class TestDataProcessorEmpty:
    def test_empty_records(self):
        processor = DataProcessor([], None)
        result = processor.process_all()

        assert result['records'] == []
        assert result['count'] == 0
        assert result['charts']['lineData'] == {'labels': [], 'datasets': []}
        assert result['charts']['pieData'] == {'labels': [], 'datasets': []}
        assert result['charts']['weeklyData'] == {'labels': [], 'datasets': []}
        assert result['metrics']['totalPurchases'] == '$0.00'
        assert result['metrics']['transactionCount'] == 0
        assert result['availableBanks'] == []
        assert result['availableMonths'] == []


class TestDataProcessorLineData:
    def test_line_data_structure(self, records):
        processor = DataProcessor(records)
        line_data = processor.get_line_data()

        assert 'labels' in line_data
        assert 'datasets' in line_data
        assert len(line_data['datasets']) == 2
        assert line_data['datasets'][0]['label'] == 'Purchases'
        assert line_data['datasets'][1]['label'] == 'Payments'

    def test_line_data_sorted_by_date(self, records):
        processor = DataProcessor(records)
        line_data = processor.get_line_data()

        labels = line_data['labels']
        assert labels == sorted(labels)

    def test_line_data_purchases_positive(self, records):
        processor = DataProcessor(records)
        line_data = processor.get_line_data()

        purchases = line_data['datasets'][0]['data']
        for val in purchases:
            assert val >= 0

    def test_line_data_payments_negative_or_zero(self, records):
        processor = DataProcessor(records)
        line_data = processor.get_line_data()

        payments = line_data['datasets'][1]['data']
        for val in payments:
            assert val <= 0

    def test_line_data_colors(self, records):
        processor = DataProcessor(records)
        line_data = processor.get_line_data()

        assert line_data['datasets'][0]['borderColor'] == 'rgba(75,192,192,1)'
        assert line_data['datasets'][1]['borderColor'] == 'rgb(40, 139, 58)'


class TestDataProcessorPieData:
    def test_pie_data_structure(self, records):
        processor = DataProcessor(records)
        pie_data = processor.get_pie_data()

        assert 'labels' in pie_data
        assert 'datasets' in pie_data
        assert len(pie_data['datasets']) == 1
        assert pie_data['datasets'][0]['label'] == 'Spending by Category'

    def test_pie_data_only_purchases(self, records):
        processor = DataProcessor(records)
        pie_data = processor.get_pie_data()

        # Payment (-500) should not be in pie data
        assert 'PAYMENT' not in pie_data['labels']

    def test_pie_data_sorted_descending(self, records):
        processor = DataProcessor(records)
        pie_data = processor.get_pie_data()

        values = pie_data['datasets'][0]['data']
        assert values == sorted(values, reverse=True)


class TestDataProcessorWeeklyData:
    def test_weekly_data_structure(self, records):
        processor = DataProcessor(records)
        weekly = processor.get_weekly_data()

        assert 'labels' in weekly
        assert 'datasets' in weekly
        assert len(weekly['datasets']) == 2
        assert weekly['datasets'][0]['label'] == 'Purchases'
        assert weekly['datasets'][1]['label'] == 'Payments'
        assert weekly['datasets'][0].get('purchases') is True
        assert weekly['datasets'][1].get('payments') is True

    def test_weekly_data_labels_format(self, records):
        processor = DataProcessor(records)
        weekly = processor.get_weekly_data()

        for label in weekly['labels']:
            # Should be like "Jan Week 3"
            parts = label.split(' ')
            assert len(parts) == 3
            assert parts[1] == 'Week'


class TestDataProcessorMetrics:
    def test_metrics_structure(self, records):
        processor = DataProcessor(records)
        metrics = processor.get_metrics()

        assert 'totalPurchases' in metrics
        assert 'totalPayments' in metrics
        assert 'netSpending' in metrics
        assert 'avgPurchase' in metrics
        assert 'transactionCount' in metrics
        assert 'purchaseCount' in metrics

    def test_metrics_values(self, records):
        processor = DataProcessor(records)
        metrics = processor.get_metrics()

        # 4 purchases: 15.50 + 45.00 + 89.99 + 125.00 = 275.49
        assert metrics['totalPurchases'] == '$275.49'
        # 1 payment: 500.00
        assert metrics['totalPayments'] == '$500.00'
        assert metrics['transactionCount'] == 5
        assert metrics['purchaseCount'] == 4

    def test_metrics_formatted_currency(self, records):
        processor = DataProcessor(records)
        metrics = processor.get_metrics()

        for key in ['totalPurchases', 'totalPayments', 'netSpending', 'avgPurchase']:
            assert metrics[key].startswith('$')


class TestDataProcessorMonthFilter:
    def test_month_filter_narrows_records(self, records):
        processor = DataProcessor(records, ['01'])
        filtered = processor.get_filtered_records()

        # Only January records: ids 1, 2, 5
        assert len(filtered) == 3
        for r in filtered:
            assert r.date.month == 1

    def test_month_filter_affects_metrics(self, records):
        processor_all = DataProcessor(records)
        processor_jan = DataProcessor(records, ['01'])

        metrics_all = processor_all.get_metrics()
        metrics_jan = processor_jan.get_metrics()

        assert metrics_all['transactionCount'] == 5
        assert metrics_jan['transactionCount'] == 3

    def test_no_filter_returns_all(self, records):
        processor = DataProcessor(records, None)
        filtered = processor.get_filtered_records()
        assert len(filtered) == 5

    def test_empty_filter_returns_all(self, records):
        processor = DataProcessor(records, [])
        filtered = processor.get_filtered_records()
        assert len(filtered) == 5


class TestDataProcessorAvailableBanksMonths:
    def test_available_banks_from_all_records(self, records):
        processor = DataProcessor(records, ['01'])
        banks = processor.get_available_banks()

        # Should include all banks, not just filtered ones
        assert 'AMEX' in banks
        assert 'CITI' in banks
        assert 'DISCOVER' in banks

    def test_available_months_from_all_records(self, records):
        processor = DataProcessor(records, ['01'])
        months = processor.get_available_months()

        # Should include all months, not just filtered ones
        assert '01' in months
        assert '02' in months
        assert '03' in months


class TestDataProcessorSingleRecord:
    def test_single_record_line_data(self, single_record):
        processor = DataProcessor(single_record)
        line = processor.get_line_data()

        assert len(line['labels']) == 1
        assert line['datasets'][0]['data'] == [5.0]
        assert line['datasets'][1]['data'] == [0.0]

    def test_single_record_metrics(self, single_record):
        processor = DataProcessor(single_record)
        metrics = processor.get_metrics()

        assert metrics['totalPurchases'] == '$5.00'
        assert metrics['totalPayments'] == '$0.00'
        assert metrics['transactionCount'] == 1
        assert metrics['purchaseCount'] == 1
        assert metrics['avgPurchase'] == '$5.00'


class TestDataProcessorProcessAll:
    def test_process_all_structure(self, records):
        processor = DataProcessor(records)
        result = processor.process_all()

        assert 'records' in result
        assert 'count' in result
        assert 'charts' in result
        assert 'metrics' in result
        assert 'availableBanks' in result
        assert 'availableMonths' in result

        assert 'lineData' in result['charts']
        assert 'pieData' in result['charts']
        assert 'weeklyData' in result['charts']
