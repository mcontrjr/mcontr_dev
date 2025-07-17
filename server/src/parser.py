#!/usr/bin/python3
import os
import argparse
import re
from typing import List
from datetime import datetime
from pypdf import PdfReader, PageObject
from pypdf.errors import PdfReadError
from dotenv import load_dotenv

from src.handler import PostgresHandler
from src.logger import log

load_dotenv()

# Bank Configurations
class BankConfig():
    def __init__(self, bank: str, start_index: int = 0, date_pattern: str = r'^\d{2}\/\d{2}\/\d{2}', skip_date_in_desc: bool = True, tabular_entries: bool = False, checking = False):
        self.bank = bank
        self.start_index = start_index
        self.date_pattern = date_pattern
        self.skip_date_in_desc = skip_date_in_desc
        self.tabular_entries = tabular_entries
        self.checking = checking

class DiscoverConfig(BankConfig):
    def __init__(self):
        super().__init__('DISCOVER', skip_date_in_desc=False)

class AmexConfig(BankConfig):
    def __init__(self):
        super().__init__('AMEX', start_index=2)
        
class SchwabConfig(BankConfig):
    def __init__(self):
        super().__init__('SCHWAB', start_index=2, checking=True)
        
class CapitalOneConfig(BankConfig):
    def __init__(self):
        super().__init__('CAPITAL ONE', start_index=2, tabular_entries=True)

class CitiConfig(BankConfig):
    def __init__(self):
        super().__init__('CITI', start_index=1, date_pattern=r'^\d{2}\/\d{2}', skip_date_in_desc=False)
        
        
# Finance Parser
class Parser:
    keyword_to_category = {
        'GAS': ['GAS', 'CHEVRON', 'SHELL'],
        'LOANS': ['DEPT EDUCATION STUDENT LN', 'TOYOTA ACH RTL'],
        'RENT': ['APPFOLIO', 'MAGNIFY REAL EST'],
        'TRAVEL': ['AMERICAN AI', 'TRIP', 'HOTEL', 'TOLLS', 'DOUBLETREE', 'AIRLINE', 'RENTAL CAR', 'EXPEDIA', 'HERTZ', 'ALAMO', 'AVIS', 'RENT A CAR', 'LYFT', 'COT*FLT'],
        'PAYPAL': ['PAYPAL'],
        'AMAZON': ['AMAZON'],
        'GROCERIES': ['TRADER JOE', 'WHOLEF', 'SPROUTS'],
        'TARGET': ['TARGET'],
        'FOOD': ['JACK IN THE BOX', 'COFFEE', 'SAFEWAY', 'IL FORNAIO', 'KEBAB', 'BBQ', 'CHIPOTLE', 'STARBUCKS', 'EATALY', 'CAFE', 'TEA', 'DUNKIN', 'DISH', 'HOUSE OF BAGELS', 'THE MELT', 'DOORDASH', 'MENDOCINO', 'PRUNEYARD CINEMAS', 'PANDA EXPRESS', 'PIZZA', 'TACOS', 'BURGER', 'RESTAURANT'],
        'AUTO': ['GEICO', 'TOYOTA'],
        'COSTCO': ['COSTCO'],
        'STREAMING': ['NETFLIX', 'PARAMOUNT+', 'DISNEYPLUS', 'PEACOCKTV'],
        'PHARMACY': ['PHARMACY', 'CVS', 'WALGREENS'],
        'GYM': ['MOVEMENT'],
        'INTERNET': ['INTERNET', 'XFINITY'],
        'LAUNDRY': ['KIOSOFT'],
        'APPLE PAY': ['APLPAY'],
        'SKI': ['SNOW.COM/VAIL'],
        'PARKING': ['PARKING', 'PARKING GARAGE', 'SMART METERS'],
        'PAYMENT': ['PYMT', 'PAYMENT', 'PMT'],
        'DEPOSIT': ['ELECTRONIC DEPOSIT'],
        'ATM': ['ATM WITHDRAWAL'],
        'UTILITIES': ['PGANDE'],
    }
    
    def __init__(self, path: str, config: BankConfig = None, text: str = None):
        self.path = path
        self.purchases = []
        self.config = config
        self.text = self.extract_text_from_pdf(path) if not text else text
        if self.config.tabular_entries:
            self.purchases = self.parse_purchases_from_tabular()
        elif self.config.checking:
            self.purchases = self.parse_transactions_from_checkings()
        else:
            self.purchases = self.parse_purchases_from_text()

    @staticmethod
    def determine_category(description: str):
        description = description.upper()
        for category, keywords in Parser.keyword_to_category.items():
            if any(keyword in description for keyword in keywords):
                return category
        return 'OTHER'
    
    @staticmethod
    def convert_to_sql_date(date_str: str) -> str:
        """
        Converts a date string in MM/DD format to YYYY-MM-DD format.

        :param date_str: str - Date in MM/DD format
        :return: str - Date in YYYY-MM-DD format
        """
        try:
            converted_date = datetime.strptime(f"{date_str}", "%m/%d/%y")
        except ValueError:
            # If year is missing, default to current year
            current_year = datetime.now().year
            converted_date = datetime.strptime(date_str, "%m/%d")
            converted_date = converted_date.replace(year=current_year)
        return converted_date.strftime("%Y-%m-%d")

    @staticmethod
    def extract_currency(text: str):
        """
        Extracts currency values from a given text and converts them to floats

        :param text: str - A string containing currency values to be extracted.
        :return: list of floats - A list of float numbers representing the extracted currency values.
        """
        text = text.replace(' ', '')
        patterns = [
            r'-\$[\d,]+\.\d{2}',  # (-$12,300.50 or -$345.67)
            r'\$-[\d,]+\.\d{2}',  # ($-12,300.50 or $-345.67)
            r'\$[\d,]+\.\d{2}',  # ($12,300.50 or $345.67)
        ]
        earliest_match = None
        earliest_pos = len(text)
        
        for pattern in patterns:
            log.debug(f"Searching for pattern: {pattern} in text: {text}")
            match = re.search(pattern, text)
            if match and match.start() < earliest_pos:
                earliest_match = match
                earliest_pos = match.start()
            
        if earliest_match:
            clean_value = earliest_match.group().replace('$', '').replace(',', '')
            return float(clean_value)
            
        return None

    @staticmethod
    def determine_bank(pages: List[PageObject]) -> BankConfig:
        """
        Determines the bank configuration based on the file content.

        :return: BankConfig - The bank configuration object.
        """
        config = None
        main_pages = pages[0].extract_text() + pages[-1].extract_text()
        log.debug(f"First and Last page: \n{main_pages}")
        if 'American Express' in main_pages:
            config = AmexConfig()
        if 'Schwab' in main_pages:
            config = SchwabConfig()
        if 'Citi' in main_pages:
            config = CitiConfig()
        if 'Discover Bank' in main_pages:
            config = DiscoverConfig()
        if 'Capital One' in main_pages:
            config = CapitalOneConfig()
        if config is None:
            raise Exception("Could not determine bank, check the first and last pages for keywords.")
        return config
     
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        log.info(f"Opening PDF file: {pdf_path}")
        try:
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                self.config = self.determine_bank(pdf_reader.pages)
                log.info(f"Bank config determined: {self.config.bank}")
                log.info(f"Found {len(pdf_reader.pages)} pages in statement. Starting on page {self.config.start_index + 1}")
                for page in pdf_reader.pages[self.config.start_index:]:
                    new_text = page.extract_text()
                    log.debug(f"New page: {new_text}")
                    text += new_text + "\n"
            log.info(f"Successfully extracted text from PDF: {pdf_path}")
            log.debug(f"Text: {text}")
            return text
        except PdfReadError as e:
            log.error(f"PdfReadError: {e}. Check if pdf file is corrupted and in a valid format.")
            raise e
        except Exception as e:
            log.error(f"Error extracting text from PDF: {e}")
            raise e

    def extract_description(self, lines: List[str], date: re.Match) -> str:
        log.debug(f"Extracting description from lines: {lines} with date: {date.group()}")
        description = " ".join(lines)[date.end():date.endpos].strip()
        description = " ".join(description.split())
        dollar_match = re.search(r'\$', description)
        description = description[:dollar_match.start()].strip() if dollar_match else description
        # Skip if description contains a date, common in only some statements
        if self.config.skip_date_in_desc and re.search(self.config.date_pattern, description):
            log.debug(f"Found a date in description: {description}. Skipping...")
            return None
        else:
            dup_date = re.search(self.config.date_pattern, description)
            description = description[dup_date.end():].strip() if dup_date else description
        return description
    
    def parse_purchases_from_tabular(self) -> List[dict]:
        """
        Extracts transactions from tabular PDF text format.
        For example, Capital One uses a tabular format where transactions are not on separate lines.
        
        :param text: Raw text extracted from Capital One PDF
        :return: List of dictionaries with transaction details
        """
        purchases = []
        
        # Pattern to match transactions in the format: "Jun 2 Jun 3 COT*FLT627-2363070MA $91.99"
        # This pattern captures: trans_date, post_date, description, amount
        transaction_pattern = r'(\w{3}\s+\d{1,2})\s+(\w{3}\s+\d{1,2})\s+([A-Z0-9*\s\-\.\#]+?)\s+(-?\s*\$[\d,]+\.\d{2})'
        
        # Find all transactions using regex
        matches = re.findall(transaction_pattern, self.text)
        
        for match in matches:
            trans_date = match[0]
            _ = match[1]
            description = match[2].strip()
            amount_str = match[3].replace(' ', '')
            
            description = " ".join(description.split())
            
            # Skip if this looks like a header or total line
            if 'Trans Date' in description or 'Post Date' in description or 'Description' in description or 'Amount' in description:
                continue
            if 'Total Transactions' in description:
                continue
                
            # Convert amount to float
            try:
                amount = float(amount_str.replace('$', '').replace(',', ''))
            except ValueError:
                continue
                
            # Convert date to SQL format (assuming current year)
            try:
                current_year = datetime.now().year
                date_obj = datetime.strptime(f"{trans_date} {current_year}", "%b %d %Y")
                sql_date = date_obj.strftime("%Y-%m-%d")
            except ValueError:
                # If date parsing fails, skip this transaction
                continue
            
            # Determine category
            category = Parser.determine_category(description)
            
            log.info(f"Found Capital One transaction on {trans_date} under {category} for ${amount} with description: {description}")
            
            purchases.append({
                'Bank': 'CAPITAL ONE',
                'Date': sql_date,
                'Description': description,
                'Amount': amount,
                'Category': category
            })
        
        return purchases

    def parse_transactions_from_checkings(self) -> List[dict]:
        """
        Parses transactions from checking account statements.
        Handles both debits and credits, marking credits as negative amounts.
        
        :return: List of dictionaries with transaction details
        """
        log.info("Parsing checking account transactions...")
        transactions = []
        try:
            lines = self.text.split('\n')
            i = 0
            while i < len(lines):
                line = lines[i]
                
                # Look for date pattern (MM/DD format)
                if date_match := re.search(r'(\d{2}\/\d{2})', line):
                    date_str = date_match.group()
                    # Skip header lines and balance lines
                    if 'Beginning Balance' in line or 'Ending Balance' in line or 'Date' in line or 'Posted' in line or 'Interest Earned' in line or 'Annual Percentage Yield' in line:
                        i += 1
                        continue
                    
                    # Extract description - it may span multiple lines
                    description_parts = []
                    current_line = line[date_match.end():].strip()
                    
                    # Look ahead to find the amount line
                    j = i
                    amount_found = False
                    debit_amount = None
                    credit_amount = None
                    
                    while j < len(lines) and not amount_found:
                        check_line = lines[j]
                        
                        # Accumulate description text to check for credit indicators
                        full_description = ' '.join(description_parts).strip()
                        
                        # Look for amount pattern: either "debit_amount  credit_amount balance" or single amount
                        # Pattern for three amounts: debit, credit, balance
                        three_amounts_match = re.search(r'\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}$', check_line)
                        if three_amounts_match:
                            # This shouldn't happen in Schwab format, but handle it
                            amounts = re.findall(r'\$[\d,]+\.\d{2}', check_line)
                            if ('Deposit' in full_description or 'DIRECT DEP' in full_description or 'CASHOUT' in full_description or 'DDA TO DDA' in full_description or 'Interest Paid' in full_description or 'Fee Rebate' in full_description or 'ATM Fee Rebate' in full_description):
                                credit_amount = -float(amounts[0].replace('$', '').replace(',', ''))
                            else:
                                debit_amount = float(amounts[0].replace('$', '').replace(',', ''))
                            amount_found = True
                            break
                        
                        # Look for two amounts: amount and balance (Schwab format)
                        two_amounts_match = re.search(r'\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}$', check_line)
                        if two_amounts_match:
                            amounts = re.findall(r'\$[\d,]+\.\d{2}', check_line)
                            # Check if this is a credit/deposit based on description
                            if ('Deposit' in full_description or 'DIRECT DEP' in full_description or 'CASHOUT' in full_description or 'DDA TO DDA' in full_description or 'Interest Paid' in full_description or 'Fee Rebate' in full_description or 'ATM Fee Rebate' in full_description):
                                credit_amount = -float(amounts[0].replace('$', '').replace(',', ''))
                            else:
                                debit_amount = float(amounts[0].replace('$', '').replace(',', ''))
                            amount_found = True
                            break
                        
                        # Look for single amount at end of line
                        single_amount_match = re.search(r'\$[\d,]+\.\d{2}$', check_line)
                        if single_amount_match:
                            amount_str = single_amount_match.group()
                            # Check if this is likely a credit based on description
                            if ('Deposit' in full_description or 'DIRECT DEP' in full_description or 'CASHOUT' in full_description or 'DDA TO DDA' in full_description or 'Interest Paid' in full_description or 'Fee Rebate' in full_description or 'ATM Fee Rebate' in full_description):
                                credit_amount = -float(amount_str.replace('$', '').replace(',', ''))
                            else:
                                debit_amount = float(amount_str.replace('$', '').replace(',', ''))
                            amount_found = True
                            break
                        
                        # Add this line to description if it doesn't contain the amount
                        if j == i:
                            description_parts.append(current_line)
                        else:
                            description_parts.append(lines[j].strip())
                        
                        j += 1
                    
                    # Clean up description
                    description = ' '.join(description_parts).strip()
                    description = re.sub(r'\s+', ' ', description)  # Normalize whitespace
                    
                    # Remove any trailing amount info from description
                    description = re.sub(r'\$[\d,]+\.\d{2}.*$', '', description).strip()
                    
                    # Skip if no valid amount found or description is empty
                    if (debit_amount is None and credit_amount is None) or not description:
                        i += 1
                        continue
                    
                    # Determine final amount
                    final_amount = debit_amount if debit_amount is not None else credit_amount
                    
                    # Convert date to SQL format
                    sql_date = self.convert_to_sql_date(date_str)
                    
                    # Determine category
                    category = self.determine_category(description)
                    
                    transaction_type = "debit" if final_amount > 0 else "credit"
                    log.info(f"Found {transaction_type} transaction on {date_str} under {category} for ${final_amount} with description: {description}")
                    
                    transactions.append({
                        'Bank': self.config.bank,
                        'Date': sql_date,
                        'Description': description,
                        'Amount': final_amount,
                        'Category': category
                    })
                    
                    i = j + 1
                else:
                    i += 1
            
            log.info(f"Successfully parsed {len(transactions)} transactions from checking account")
            return transactions
        except Exception as e:
            log.error(f"Error parsing transactions from checking account: {e}")
            raise

    def parse_purchases_from_text(self) -> List[dict]:
        """
        Parses purchases from extracted text.

        :param text: Extracted text from PDF
        :return: JSON-like list of dictionaries with purchase details
        """
        log.info("Parsing extracted text...")
        purchases = []
        try:
            lines = self.text.split('\n')
            for i, line in enumerate(lines):
                if date := re.search(self.config.date_pattern, line):
                    log.debug(f"Found date: {date.group()} in line {i}: {line}")
                    if i + 2 < len(lines):
                        if (description := self.extract_description(lines[i:i+2], date)) is None:
                            log.debug(f"Description was None. Skipping...")
                            continue
                        log.debug(f"Description: {description}. Lines: {lines[i:i+2]}. Date endpos: {date.endpos}")
                        date_str = date.group()
                        sql_date = self.convert_to_sql_date(date_str)
                        amount_line = " ".join([l for l in lines[i:i+5]])
                        log.debug(f"Amount Line: {amount_line}")
                        amount = self.extract_currency(amount_line)
                        if amount is None:
                            log.debug(f"Amount wasnt found in line: {amount_line}. Skipping...")
                            continue
                        category = self.determine_category(description)
                        log.info(f"Found a purchase on {date_str} under {category} for ${amount} with description: \n\t{description}\n")
                        purchases.append({
                            'Bank': self.config.bank,
                            'Date': sql_date,
                            'Description': description,
                            'Amount': amount,
                            'Category': category
                        })
                    else:
                        log.warning("Not enough lines to parse description and amount for date: %s", line)
            log.info(f"Successfully parsed purchases from text: {purchases}")
            return purchases
        except Exception as e:
            log.error(f"Error parsing purchases from text: {e}")
            raise

    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract purchases from PDF and export to CSV.')
    parser.add_argument('-f', '--file-path', required=True, help='Path to the input PDF file.')
    parser.add_argument('-o', '--output-path', help='Path to the output file.')
    args = parser.parse_args()

    # Only needed in standalone script
    import pandas as pd
    
    statement = Parser(args.file_path)
    df = pd.DataFrame(statement.purchases)
    output_file = f'{statement.config.bank.lower()}_statement.csv' if args.output_path is None else args.output_path
    df.to_csv(output_file, index=False)
    print(f"Saved CSV to {output_file}")
