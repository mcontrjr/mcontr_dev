"""
Backend data processor that consolidates all chart/metric computation.
Replaces frontend-side processing from dataProcessing.js.
"""
import math
from typing import List, Optional
import pandas as pd

from src.models import TransactionRecord

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


class DataProcessor:
    def __init__(self, records: List[TransactionRecord],
                 selected_months: Optional[List[str]] = None):
        self._all_records = records
        self._selected_months = selected_months or []
        if records:
            self._df = pd.DataFrame([r.dict() for r in records])
            self._df['date'] = pd.to_datetime(self._df['date'])
        else:
            self._df = pd.DataFrame()
        self._filtered_df = self._apply_month_filter()

    def _apply_month_filter(self) -> pd.DataFrame:
        if self._df.empty or not self._selected_months:
            return self._df.copy()
        month_strs = [m.zfill(2) for m in self._selected_months]
        return self._df[self._df['date'].dt.strftime('%m').isin(month_strs)].copy()

    def get_filtered_records(self) -> List[TransactionRecord]:
        if self._filtered_df.empty:
            return []
        df = self._filtered_df.copy()
        df['date'] = df['date'].dt.date
        return [TransactionRecord(**row) for row in df.to_dict('records')]

    def get_line_data(self) -> dict:
        if self._filtered_df.empty:
            return {'labels': [], 'datasets': []}

        df = self._filtered_df.sort_values('date')
        dates = df['date'].dt.strftime('%Y-%m-%d').tolist()
        purchases = [float(a) if a > 0 else 0.0 for a in df['amount']]
        payments = [float(a) if a < 0 else 0.0 for a in df['amount']]

        return {
            'labels': dates,
            'datasets': [
                {
                    'label': 'Purchases',
                    'data': purchases,
                    'borderColor': 'rgba(75,192,192,1)',
                    'backgroundColor': 'rgba(75,192,192,0.2)',
                },
                {
                    'label': 'Payments',
                    'data': payments,
                    'borderColor': 'rgb(40, 139, 58)',
                    'backgroundColor': 'rgba(26, 125, 35, 0.2)',
                },
            ],
        }

    def get_pie_data(self) -> dict:
        if self._filtered_df.empty:
            return {'labels': [], 'datasets': []}

        purchases = self._filtered_df[self._filtered_df['amount'] > 0]
        if purchases.empty:
            return {'labels': [], 'datasets': []}

        category_sums = purchases.groupby('category')['amount'].sum().sort_values(ascending=False)

        return {
            'labels': category_sums.index.tolist(),
            'datasets': [{
                'label': 'Spending by Category',
                'data': [float(v) for v in category_sums.values],
            }],
        }

    def get_weekly_data(self) -> dict:
        if self._filtered_df.empty:
            return {'labels': [], 'datasets': []}

        df = self._filtered_df.sort_values('date').copy()
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        df['week_num'] = df['date'].dt.day.apply(lambda d: math.ceil(d / 7))
        df['week_key'] = df.apply(
            lambda r: f"{r['year']}-{r['month']:02d}-W{r['week_num']}", axis=1
        )

        weekly = {}
        for _, row in df.iterrows():
            key = row['week_key']
            if key not in weekly:
                month_name = MONTH_NAMES[row['month'] - 1]
                weekly[key] = {
                    'purchases': 0.0,
                    'payments': 0.0,
                    'label': f"{month_name} Week {row['week_num']}"
                }
            amt = float(row['amount'])
            if amt > 0:
                weekly[key]['purchases'] += amt
            else:
                weekly[key]['payments'] += abs(amt)

        labels = [v['label'] for v in weekly.values()]
        purchase_data = [v['purchases'] for v in weekly.values()]
        payment_data = [v['payments'] for v in weekly.values()]

        return {
            'labels': labels,
            'datasets': [
                {
                    'label': 'Purchases',
                    'data': purchase_data,
                    'purchases': True,
                },
                {
                    'label': 'Payments',
                    'data': payment_data,
                    'payments': True,
                },
            ],
        }

    def get_metrics(self) -> dict:
        if self._filtered_df.empty:
            return {
                'totalPurchases': '$0.00',
                'totalPayments': '$0.00',
                'netSpending': '$0.00',
                'avgPurchase': '$0.00',
                'transactionCount': 0,
                'purchaseCount': 0,
            }

        purchases = self._filtered_df[self._filtered_df['amount'] > 0]
        payments = self._filtered_df[self._filtered_df['amount'] < 0]

        total_purchases = float(purchases['amount'].sum()) if not purchases.empty else 0.0
        total_payments = float(abs(payments['amount'].sum())) if not payments.empty else 0.0
        net_spending = total_purchases - total_payments
        avg_purchase = total_purchases / len(purchases) if len(purchases) > 0 else 0.0

        def fmt(amount):
            return f"${amount:,.2f}"

        return {
            'totalPurchases': fmt(total_purchases),
            'totalPayments': fmt(total_payments),
            'netSpending': fmt(net_spending),
            'avgPurchase': fmt(avg_purchase),
            'transactionCount': len(self._filtered_df),
            'purchaseCount': len(purchases),
        }

    def get_available_banks(self) -> List[str]:
        if self._df.empty:
            return []
        return sorted(self._df['bank'].unique().tolist())

    def get_available_months(self) -> List[str]:
        if self._df.empty:
            return []
        return sorted(self._df['date'].dt.strftime('%m').unique().tolist())

    def process_all(self) -> dict:
        """Produce the full EnrichedRecordsResponse shape."""
        filtered_records = self.get_filtered_records()
        return {
            'records': filtered_records,
            'count': len(filtered_records),
            'charts': {
                'lineData': self.get_line_data(),
                'pieData': self.get_pie_data(),
                'weeklyData': self.get_weekly_data(),
            },
            'metrics': self.get_metrics(),
            'availableBanks': self.get_available_banks(),
            'availableMonths': self.get_available_months(),
        }
