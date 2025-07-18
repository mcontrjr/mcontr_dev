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
from src.config import CATEGORY_KEYWORDS
from src.models import ParsedTransaction, BankConfiguration, BankType, TransactionCategory
from datetime import datetime, date

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
    keyword_to_category = CATEGORY_KEYWORDS
    
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
    def determine_category(description: str) -> TransactionCategory:
        description = description.upper()
        for category, keywords in Parser.keyword_to_category.items():
            if any(keyword in description for keyword in keywords):
                return TransactionCategory(category)
        return TransactionCategory.OTHER
    
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
    
    def _is_tabular_header_or_total_line(self, description: str) -> bool:
        """Check if description is a header or total line that should be skipped."""
        skip_patterns = [
            'Trans Date', 'Post Date', 'Description', 'Amount', 'Total Transactions'
        ]
        return any(pattern in description for pattern in skip_patterns)
    
    def _parse_tabular_amount(self, amount_str: str) -> float:
        """Parse amount from tabular format string."""
        try:
            clean_amount = amount_str.replace(' ', '').replace('$', '').replace(',', '')
            return float(clean_amount)
        except ValueError:
            return None
    
    def _parse_capital_one_date(self, date_str: str) -> str:
        """Parse Capital One date format to SQL date."""
        try:
            current_year = datetime.now().year
            date_obj = datetime.strptime(f"{date_str} {current_year}", "%b %d %Y")
            return date_obj.strftime("%Y-%m-%d")
        except ValueError:
            return None
    
    def _clean_tabular_description(self, description: str) -> str:
        """Clean and normalize tabular description."""
        return " ".join(description.strip().split())
    
    def _create_tabular_transaction(self, date_str: str, description: str, amount: float) -> ParsedTransaction:
        """Create a transaction object for tabular format."""
        category = Parser.determine_category(description)
        transaction_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        return ParsedTransaction(
            bank=BankType.CAPITAL_ONE,
            date=transaction_date,
            description=description,
            amount=amount,
            category=category
        )
    
    def parse_purchases_from_tabular(self) -> List[ParsedTransaction]:
        """
        Extracts transactions from tabular PDF text format.
        For example, Capital One uses a tabular format where transactions are not on separate lines.
        
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
            _ = match[1]  # post_date not used
            description = self._clean_tabular_description(match[2])
            amount_str = match[3]
            
            # Skip header and total lines
            if self._is_tabular_header_or_total_line(description):
                continue
            
            # Parse amount
            amount = self._parse_tabular_amount(amount_str)
            if amount is None:
                continue
            
            # Parse date
            sql_date = self._parse_capital_one_date(trans_date)
            if sql_date is None:
                continue
            
            # Create transaction
            transaction = self._create_tabular_transaction(sql_date, description, amount)
            purchases.append(transaction)
            
            log.info(f"Found Capital One transaction on {trans_date} under {transaction.category} for ${amount} with description: {description}")
        
        return purchases

    def _is_header_or_balance_line(self, line: str) -> bool:
        """Check if line is a header or balance line that should be skipped."""
        skip_patterns = [
            'Beginning Balance', 'Ending Balance', 'Date', 'Posted', 
            'Interest Earned', 'Annual Percentage Yield'
        ]
        return any(pattern in line for pattern in skip_patterns)
    
    def _is_credit_transaction(self, description: str) -> bool:
        """Determine if transaction is a credit based on description keywords."""
        credit_keywords = [
            'Deposit', 'DIRECT DEP', 'CASHOUT', 'DDA TO DDA', 
            'Interest Paid', 'Fee Rebate', 'ATM Fee Rebate'
        ]
        return any(keyword in description for keyword in credit_keywords)
    
    def _extract_amount_from_line(self, line: str, description: str) -> tuple[float, bool]:
        """
        Extract amount from a line and determine if it's a debit or credit.
        
        :param line: Line to extract amount from
        :param description: Full description to check for credit indicators
        :return: (amount, is_credit) tuple
        """
        # Pattern for three amounts: debit, credit, balance
        three_amounts_match = re.search(r'\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}$', line)
        if three_amounts_match:
            amounts = re.findall(r'\$[\d,]+\.\d{2}', line)
            amount = float(amounts[0].replace('$', '').replace(',', ''))
            is_credit = self._is_credit_transaction(description)
            return (-amount if is_credit else amount, is_credit)
        
        # Pattern for two amounts: amount and balance (Schwab format)
        two_amounts_match = re.search(r'\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}$', line)
        if two_amounts_match:
            amounts = re.findall(r'\$[\d,]+\.\d{2}', line)
            amount = float(amounts[0].replace('$', '').replace(',', ''))
            is_credit = self._is_credit_transaction(description)
            return (-amount if is_credit else amount, is_credit)
        
        # Pattern for single amount at end of line
        single_amount_match = re.search(r'\$[\d,]+\.\d{2}$', line)
        if single_amount_match:
            amount_str = single_amount_match.group()
            amount = float(amount_str.replace('$', '').replace(',', ''))
            is_credit = self._is_credit_transaction(description)
            return (-amount if is_credit else amount, is_credit)
        
        return None, False
    
    def _find_transaction_amount(self, lines: List[str], start_index: int) -> tuple[float, int, str]:
        """
        Find the amount for a transaction by looking ahead through lines.
        
        :param lines: All lines from the text
        :param start_index: Index to start looking from
        :return: (amount, next_index, description) tuple
        """
        description_parts = []
        current_line = lines[start_index]
        date_match = re.search(r'(\d{2}\/\d{2})', current_line)
        
        if date_match:
            description_parts.append(current_line[date_match.end():].strip())
        
        j = start_index
        while j < len(lines):
            check_line = lines[j]
            full_description = ' '.join(description_parts).strip()
            
            # Try to extract amount from current line
            amount, is_credit = self._extract_amount_from_line(check_line, full_description)
            if amount is not None:
                # Clean up description
                description = ' '.join(description_parts).strip()
                description = re.sub(r'\s+', ' ', description)  # Normalize whitespace
                description = re.sub(r'\$[\d,]+\.\d{2}.*$', '', description).strip()
                
                return amount, j + 1, description
            
            # Add this line to description if it doesn't contain the amount
            if j == start_index:
                pass  # Already added above
            else:
                description_parts.append(lines[j].strip())
            
            j += 1
        
        return None, j, None
    
    def parse_transactions_from_checkings(self) -> List[ParsedTransaction]:
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
                    if self._is_header_or_balance_line(line):
                        i += 1
                        continue
                    
                    # Find the amount and description for this transaction
                    amount, next_index, description = self._find_transaction_amount(lines, i)
                    
                    # Skip if no valid amount found or description is empty
                    if amount is None or not description:
                        i += 1
                        continue
                    
                    # Convert date to SQL format
                    sql_date = self.convert_to_sql_date(date_str)
                    
                    # Determine category
                    category = self.determine_category(description)
                    
                    transaction_type = "debit" if amount > 0 else "credit"
                    log.info(f"Found {transaction_type} transaction on {date_str} under {category} for ${amount} with description: {description}")
                    
                    transaction_date = datetime.strptime(sql_date, "%Y-%m-%d").date()
                    transaction = ParsedTransaction(
                        bank=BankType(self.config.bank),
                        date=transaction_date,
                        description=description,
                        amount=amount,
                        category=category
                    )
                    transactions.append(transaction)
                    
                    i = next_index
                else:
                    i += 1
            
            log.info(f"Successfully parsed {len(transactions)} transactions from checking account")
            return transactions
        except Exception as e:
            log.error(f"Error parsing transactions from checking account: {e}")
            raise

    def _has_sufficient_lines(self, current_index: int, lines: List[str]) -> bool:
        """Check if there are enough lines to parse purchase data."""
        return current_index + 2 < len(lines)
    
    def _extract_amount_from_lines(self, lines: List[str], start_index: int) -> float:
        """Extract amount from a group of lines starting at given index."""
        amount_line = " ".join([line for line in lines[start_index:start_index+5]])
        log.debug(f"Amount Line: {amount_line}")
        return self.extract_currency(amount_line)
    
    def _create_purchase_transaction(self, date_str: str, description: str, amount: float) -> ParsedTransaction:
        """Create a purchase transaction object."""
        sql_date = self.convert_to_sql_date(date_str)
        category = self.determine_category(description)
        transaction_date = datetime.strptime(sql_date, "%Y-%m-%d").date()
        return ParsedTransaction(
            bank=BankType(self.config.bank),
            date=transaction_date,
            description=description,
            amount=amount,
            category=category
        )
    
    def _process_purchase_line(self, lines: List[str], line_index: int, date_match: re.Match) -> ParsedTransaction:
        """Process a single line that contains a purchase date."""
        if not self._has_sufficient_lines(line_index, lines):
            log.warning("Not enough lines to parse description and amount for date: %s", lines[line_index])
            return None
        
        # Extract description
        description = self.extract_description(lines[line_index:line_index+2], date_match)
        if description is None:
            log.debug(f"Description was None. Skipping...")
            return None
        
        log.debug(f"Description: {description}. Lines: {lines[line_index:line_index+2]}. Date endpos: {date_match.endpos}")
        
        # Extract amount
        amount = self._extract_amount_from_lines(lines, line_index)
        if amount is None:
            log.debug(f"Amount wasn't found in lines starting at {line_index}. Skipping...")
            return None
        
        # Create transaction
        date_str = date_match.group()
        transaction = self._create_purchase_transaction(date_str, description, amount)
        
        log.info(f"Found a purchase on {date_str} under {transaction.category} for ${amount} with description: \n\t{description}\n")
        return transaction
    
    def parse_purchases_from_text(self) -> List[ParsedTransaction]:
        """
        Parses purchases from extracted text.

        :return: JSON-like list of dictionaries with purchase details
        """
        log.info("Parsing extracted text...")
        purchases = []
        try:
            lines = self.text.split('\n')
            for i, line in enumerate(lines):
                if date_match := re.search(self.config.date_pattern, line):
                    log.debug(f"Found date: {date_match.group()} in line {i}: {line}")
                    
                    transaction = self._process_purchase_line(lines, i, date_match)
                    if transaction is not None:
                        purchases.append(transaction)
                        
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
