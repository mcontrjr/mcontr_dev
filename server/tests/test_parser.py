import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from src.parser import Parser, AmexConfig, CitiConfig, DiscoverConfig, CapitalOneConfig, SchwabConfig
from unittest import TestCase

TestCase.maxDiff = None
class TestParser:

    def test_determine_category(self):
        assert Parser.determine_category("Chevron Gas Station") == "GAS"
        assert Parser.determine_category("Netflix Subscription") == "STREAMING"
        assert Parser.determine_category("Unknown Merchant") == "OTHER"

    def test_convert_to_sql_date(self):
        assert Parser.convert_to_sql_date("01/06") == "2025-01-06"

    def test_extract_currency(self):
        assert Parser.extract_currency("$123.45") == 123.45
        assert Parser.extract_currency("-$1,234.56") == -1234.56
        assert Parser.extract_currency("$ 123.45") == 123.45
        assert Parser.extract_currency("$ -1,234.56") == -1234.56
        assert Parser.extract_currency("$ -4.56") == -4.56
        assert Parser.extract_currency("No currency here") == None

class TestAmexParser(TestParser):

    def test_parse_purchases_from_text(self):
        with open("tests/mock_amex.txt", "r") as file:
            mock_text = file.read()
        parser = Parser("tests/dummy_path.pdf", config=AmexConfig(), text=mock_text)
        purchases = parser.parse_purchases_from_text()
        print(purchases)

        expected_purchases = [
            {
                'Bank': 'AMEX',
                'Date': "2024-07-22",
                'Description': "PRUNEYARD CINEMAS ECOMM 000000001 CAMPBELL CA",
                'Amount': 35.50,
                'Category': "FOOD"
            },
            {
                'Bank': 'AMEX',
                'Date': "2024-07-23",
                'Description': "DOUBLETREE NORWALK NORWALK CA",
                'Amount': 852.49,
                'Category': "TRAVEL"
            },
            {
                'Bank': 'AMEX',
                'Date': "2024-12-16",
                'Description': "PARAMOUNT+ WEST HOLLYWOO CA",
                'Amount': 12.99,
                'Category': "STREAMING"
            },
            {
                'Bank': 'AMEX',
                'Date': "2024-12-20",
                'Description': "AplPay STEVENS CREEK TOYOTA SAN JOSE CA",
                'Amount': 139.99,
                'Category': "AUTO"
            },
            {
                'Bank': 'AMEX',
                'Date': "2024-12-20",
                'Description': "FASTRAK CSC TOLLS OAKLAND CA",
                'Amount': 7.00,
                'Category': "TRAVEL"
            },
            {
                'Bank': 'AMEX',
                'Date': "2024-12-21",
                'Description': "AMAZON GROCE*Z99KX7LU1 AMZN.COM/BILL WA",
                'Amount': 31.70,
                'Category': "AMAZON"
            },
            {
                'Bank': 'AMEX',
                'Date': "2024-12-22",
                'Description': "SNOW.COM/VAIL RESORTS SKI 888-838-0495 CO",
                'Amount': 173.00,
                'Category': "SKI"
            }
        ]
        # Convert ParsedTransaction objects to dictionaries for comparison
        purchase_dicts = []
        for purchase in purchases:
            purchase_dicts.append({
                'Bank': purchase.bank,
                'Date': purchase.date.strftime('%Y-%m-%d'),
                'Description': purchase.description,
                'Amount': purchase.amount,
                'Category': purchase.category
            })
        TestCase().assertCountEqual(purchase_dicts, expected_purchases)

class TestCitiParser(TestParser):

    def test_parse_purchases_from_text(self):
        with open("tests/mock_citi.txt", "r") as file:
            mock_text = file.read()
        parser = Parser("tests/dummy_path.pdf", config=CitiConfig(), text=mock_text)
        purchases = parser.parse_purchases_from_text()
        print(purchases)

        expected_purchases = [
            {
                'Bank': 'CITI',
                'Date': "2025-01-25",
                'Description': "LYFT *1 RIDE 01-24 LYFT.COM CA",
                'Amount': 40.09,
                'Category': "TRAVEL"
            },
            {
                'Bank': 'CITI',
                'Date': "2025-01-25",
                'Description': "SLICE*KINGKONGNYPIZZA",
                'Amount': 35.08,
                'Category': "FOOD"
            },
            {
                'Bank': 'CITI',
                'Date': "2025-01-25",
                'Description': "HOUSE OF BAGELS CAMPBELL CA",
                'Amount': 15.73,
                'Category': "FOOD"
            },
            {
                'Bank': 'CITI',
                'Date': "2025-01-20",
                'Description': "COSTCO WHSE #0129 SANTA CLARA CA",
                'Amount': 10.88,
                'Category': "COSTCO"
            },
            {
                'Bank': 'CITI',
                'Date': "2025-01-20",
                'Description': "COSTCO GAS #0129 SANTA CLARA CA",
                'Amount': 42.26,
                'Category': "GAS"
            }
        ]
        # Convert ParsedTransaction objects to dictionaries for comparison
        purchase_dicts = []
        for purchase in purchases:
            purchase_dicts.append({
                'Bank': purchase.bank,
                'Date': purchase.date.strftime('%Y-%m-%d'),
                'Description': purchase.description,
                'Amount': purchase.amount,
                'Category': purchase.category
            })
        TestCase().assertCountEqual(purchase_dicts, expected_purchases)

class TestDiscoverParser(TestParser):

    def test_parse_purchases_from_text(self):
        with open("tests/mock_discover.txt", "r") as file:
            mock_text = file.read()
        parser = Parser("tests/dummy_path.pdf", config=DiscoverConfig(), text=mock_text)
        purchases = parser.parse_purchases_from_text()
        print(purchases)

        expected_purchases = [
            {
                'Bank': 'DISCOVER',
                'Date': "2025-02-24",
                'Description': "JACK IN THE BOX 0533 OAKLAND CA",
                'Amount': 13.32,
                'Category': "FOOD"
            },
            {
                'Bank': 'DISCOVER',
                'Date': "2025-02-14",
                'Description': "INTERNET PAYMENT - THANK YOU",
                'Amount': -62.93,
                'Category': "INTERNET"
            },
            {
                'Bank': 'DISCOVER',
                'Date': "2025-02-14",
                'Description': "SQ *11TH HOUR COFFEE W SANTA CRUZ CA",
                'Amount': 55.80,
                'Category': "FOOD"
            },
            {
                'Bank': 'DISCOVER',
                'Date': "2025-02-13",
                'Description': "SAFEWAY #1476 SAN JOSE CA",
                'Amount': 43.45,
                'Category': "FOOD"
            },
            {
                'Bank': 'DISCOVER',
                'Date': "2025-01-27",
                'Description': "TARGET 00014274091 SAN JOSE CA",
                'Amount': -4.64,
                'Category': "TARGET"
            },
            {
                'Bank': 'DISCOVER',
                'Date': "2025-01-26",
                'Description': "TARGET 00022814091 SAN JOSE CA",
                'Amount': 75.53,
                'Category': "TARGET"
            }
        ]
        # Convert ParsedTransaction objects to dictionaries for comparison
        purchase_dicts = []
        for purchase in purchases:
            purchase_dicts.append({
                'Bank': purchase.bank,
                'Date': purchase.date.strftime('%Y-%m-%d'),
                'Description': purchase.description,
                'Amount': purchase.amount,
                'Category': purchase.category
            })
        TestCase().assertCountEqual(purchase_dicts, expected_purchases)

class TestCapitalOneParser(TestParser):

    def test_parse_purchases_from_text(self):
        with open("tests/mock_cap_one.txt", "r") as file:
            mock_text = file.read()
        parser = Parser("tests/dummy_path.pdf", config=CapitalOneConfig(), text=mock_text)
        purchases = parser.parse_purchases_from_tabular()
        print(purchases)

        expected_purchases = [
            {
                'Bank': 'CAPITAL ONE',
                'Date': "2025-06-10",
                'Description': "COT*FLT844-422-6922MA",
                'Amount': -133.8,
                'Category': "TRAVEL"
            },
            {
                'Bank': 'CAPITAL ONE',
                'Date': "2025-06-13",
                'Description': "CAPITAL ONE MOBILE PYMT",
                'Amount': -400.0,
                'Category': "PAYMENT"
            },
            {
                'Bank': 'CAPITAL ONE',
                'Date': "2025-06-02",
                'Description': "COT*FLT627-2363070MA",
                'Amount': 91.99,
                'Category': "TRAVEL"
            },
            {
                'Bank': 'CAPITAL ONE',
                'Date': "2025-06-09",
                'Description': "COT*FLT844-422-6922MA",
                'Amount': 680.98,
                'Category': "TRAVEL"
            },
            {
                'Bank': 'CAPITAL ONE',
                'Date': "2025-06-11",
                'Description': "TARGET 00020883SAN JOSECA",
                'Amount': 78.84,
                'Category': "TARGET"
            },
            {
                'Bank': 'CAPITAL ONE',
                'Date': "2025-06-11",
                'Description': "COSTCO WHSE #0129SANTA CLARACA",
                'Amount': 151.71,
                'Category': "COSTCO"
            },
            {
                'Bank': 'CAPITAL ONE',
                'Date': "2025-06-03",
                'Description': "CAPITAL ONE MEMBER FEE",
                'Amount': 395.00,
                'Category': "OTHER"
            }
        ]
        # Convert ParsedTransaction objects to dictionaries for comparison
        purchase_dicts = []
        for purchase in purchases:
            purchase_dicts.append({
                'Bank': purchase.bank,
                'Date': purchase.date.strftime('%Y-%m-%d'),
                'Description': purchase.description,
                'Amount': purchase.amount,
                'Category': purchase.category
            })
        TestCase().assertCountEqual(purchase_dicts, expected_purchases)

class TestSchwabParser(TestParser):

    def test_parse_purchases_from_text(self):
        with open("tests/mock_schwab.txt", "r") as file:
            mock_text = file.read()
        parser = Parser("tests/dummy_path.pdf", config=SchwabConfig(), text=mock_text)
        purchases = parser.parse_transactions_from_checkings()
        print(purchases)

        expected_purchases = [
            {
                'Bank': 'SCHWAB',
                'Date': '2025-05-31',
                'Description': 'Visa Debit Card Point of Sale Purchase DABS SAN JOSE, CA, US',
                'Amount': 8.77,
                'Category': 'OTHER'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-02',
                'Description': 'Electronic Withdrawal APPFOLIO, INC. F WEB PMTS 060225',
                'Amount': 2.49,
                'Category': 'RENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-02',
                'Description': 'Electronic Withdrawal MAGNIFY REAL EST WEB PMTS 060225',
                'Amount': 2375.0,
                'Category': 'RENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-02',
                'Description': 'Electronic Withdrawal CITI CARD ONLINE PAYMENT 250601',
                'Amount': 248.35,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-02',
                'Description': 'Electronic Withdrawal CITI CARD ONLINE PAYMENT 250601',
                'Amount': 953.8,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-02',
                'Description': 'Electronic Withdrawal AMEX EPAYMENT ACH PMT 250602',
                'Amount': 1718.87,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-03',
                'Description': 'Electronic Withdrawal DISCOVER E-PAYMENT 250602',
                'Amount': 22.28,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-03',
                'Description': 'Electronic Deposit F20SM4YHT5 DDA TO DDA',
                'Amount': -1100.0,
                'Category': 'DEPOSIT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-06',
                'Description': 'Electronic Deposit ZEBRA TECHNOLOG DIRECT DEP 250606~ Tran: ACHDD',
                'Amount': -2962.25,
                'Category': 'DEPOSIT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-11',
                'Description': 'Electronic Deposit VENMO CASHOUT 250610',
                'Amount': -182.3,
                'Category': 'DEPOSIT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-12',
                'Description': 'Electronic Withdrawal PGANDE WEB ONLINE JUN 25',
                'Amount': 111.45,
                'Category': 'UTILITIES'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-13',
                'Description': 'Electronic Withdrawal DEPT EDUCATION STUDENT LN 250612',
                'Amount': 250.0,
                'Category': 'LOANS'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-16',
                'Description': 'Electronic Withdrawal VENMO PAYMENT 250613',
                'Amount': 5.5,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-16',
                'Description': 'Electronic Withdrawal DISCOVER E-PAYMENT 250613',
                'Amount': 52.33,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-16',
                'Description': 'Electronic Withdrawal AMEX EPAYMENT ACH PMT 250616',
                'Amount': 153.35,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-16',
                'Description': 'Electronic Withdrawal CAPITAL ONE MOBILE PMT',
                'Amount': 400.0,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-16',
                'Description': 'Electronic Withdrawal CITI CARD ONLINE PAYMENT 250613',
                'Amount': 854.08,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-20',
                'Description': 'Electronic Deposit ZEBRA TECHNOLOG DIRECT DEP 250620~ Tran: ACHDD',
                'Amount': -2962.23,
                'Category': 'DEPOSIT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-20',
                'Description': 'ATM Withdrawal PAI ATM 1190 COLEMAN AV SAN JOSE, CA, US',
                'Amount': 143.25,
                'Category': 'ATM'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-20',
                'Description': 'Electronic Deposit F20ST88DL3 DDA TO DDA',
                'Amount': -800.0,
                'Category': 'DEPOSIT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-23',
                'Description': 'Electronic Withdrawal COMCAST-XFINITY CABLE SVCS 250620~ Tran: ACHDW',
                'Amount': 55.0,
                'Category': 'INTERNET'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-23',
                'Description': 'Electronic Withdrawal CAPITAL ONE MOBILE PMT',
                'Amount': 952.31,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-26',
                'Description': 'Electronic Withdrawal TOYOTA ACH RTL 06252025 P110796343-26269~ Tran: ACHDW',
                'Amount': 800.0,
                'Category': 'LOANS'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-26',
                'Description': 'Visa Debit Card Point of Sale Purchase CSJ SMART METERS 4085353850, CA, US',
                'Amount': 0.75,
                'Category': 'PARKING'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-26',
                'Description': 'Electronic Withdrawal AMEX EPAYMENT ACH PMT 250626',
                'Amount': 293.4,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-26',
                'Description': 'Electronic Withdrawal CITI CARD ONLINE PAYMENT 250625',
                'Amount': 1305.87,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-27',
                'Description': 'Electronic Withdrawal CAPITAL ONE MOBILE PMT',
                'Amount': 1008.96,
                'Category': 'PAYMENT'
            },
            {
                'Bank': 'SCHWAB',
                'Date': '2025-06-27',
                'Description': 'Electronic Withdrawal VENMO PAYMENT 250626',
                'Amount': 20.0,
                'Category': 'PAYMENT'
            },
            {   'Bank': 'SCHWAB',
                'Date': '2025-06-30',
                'Description': 'ATM Fee Rebate',
                'Amount': -3.25,
                'Category': 'OTHER'
            },
            {   'Bank': 'SCHWAB',
                'Date': '2025-06-30',
                'Description': 'Interest Paid',
                'Amount': -0.83,
                'Category': 'OTHER'
            }
        ]
        # Convert ParsedTransaction objects to dictionaries for comparison
        purchase_dicts = []
        for purchase in purchases:
            purchase_dicts.append({
                'Bank': purchase.bank,
                'Date': purchase.date.strftime('%Y-%m-%d'),
                'Description': purchase.description,
                'Amount': purchase.amount,
                'Category': purchase.category
            })
        TestCase().assertCountEqual(purchase_dicts, expected_purchases)
