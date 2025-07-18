import psycopg2
from typing import Optional
from contextlib import contextmanager
from fastapi import HTTPException

from src.logger import log
from src.models import ParsedTransaction
from typing import List
from src.config import DB_CONFIG

# Class for a single record + objects for responses


class PostgresHandler:
    def __init__(self):
        self.config = DB_CONFIG

    @contextmanager
    def db_connection(self, auto_commit=True):
        """Context manager for database connections with automatic cleanup."""
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            cur = conn.cursor()
            yield conn, cur
            if auto_commit:
                conn.commit()
        except Exception as e:
            if conn is not None:
                conn.rollback()
            raise e
        finally:
            if conn is not None:
                conn.close()

    def save_to_database(self, purchases: List[ParsedTransaction], session_id: str):
        """
        Appends purchases from statements into a DB. DB is configured to only accept unique description entries.
        """
        try:
            with self.db_connection(auto_commit=False) as (conn, cur):
                existing_purchases = self.get_records(None, session_id).get('records', [])
                log.debug(f"Existing purchases in database: {existing_purchases}")
                inserted = 0

                for purchase in purchases:
                    if existing_purchases:
                        if any(purchase.description == existing_purchase[3] and
                               purchase.amount == float(existing_purchase[4]) and
                               purchase.date == existing_purchase[2].date()
                               for existing_purchase in existing_purchases):
                            log.info(f"Purchase {purchase} already exists in database. Skipping insertion.")
                            continue
                    else:
                        log.info(f"Purchase {purchase}")
                    try:
                        cur.execute("""
                            INSERT INTO bank_statements (bank, date, description, amount, category, session_id)
                            VALUES (%s, %s, %s, %s, %s, %s)""",
                                    (purchase.bank, purchase.date, purchase.description, purchase.amount, purchase.category, session_id))
                        log.info(f"Inserted purchase: {purchase}")
                        inserted += 1
                    except psycopg2.IntegrityError as e:
                        conn.rollback()
                        log.info(f"{e}: Purchase {purchase} already exists. Skipping insertion.")
                        continue
                    except Exception as e:
                        conn.rollback()
                        log.error(f"Error inserting purchase {purchase}: {e}")
                        continue
                conn.commit()
                log.info(f"Inserted {inserted} new purchases into the database.")
        except Exception as e:
            log.error(f"Error saving to database: {e}")

    def get_records(self, bank_name: Optional[str], session_id: str) -> dict:
        try:
            with self.db_connection() as (conn, cur):
                query = "SELECT * FROM bank_statements WHERE session_id = %s"
                params = [session_id]

                if bank_name:
                    query += " AND bank = %s"
                    params.append(bank_name)

                cur.execute(query, params)
                log.info(f"Query: {query}")

                records = cur.fetchall()
                log.info(f"Retrieved {len(records)} records from the database.")
                resp = {
                    'records': records,
                    'count': len(records)
                }
                return resp
        except Exception as e:
            log.error(f"Error retrieving records from database: {e}")
            raise HTTPException(status_code=500, detail="Error retrieving records from database.")

    def clear_records(self, session_id: str) -> dict:
        """
        Clears all records from the bank_statements table.
        Returns the number of records deleted.
        """
        try:
            with self.db_connection() as (conn, cur):
                # Get the count of records before deletion
                cur.execute("SELECT COUNT(*) FROM bank_statements WHERE session_id = %s", (session_id,))
                count_before = cur.fetchone()[0]

                # Delete records for this session only
                cur.execute("DELETE FROM bank_statements WHERE session_id = %s", (session_id,))

                log.info(f"Cleared {count_before} records from the database.")
                return {
                    'message': 'Successfully cleared all records',
                    'records_deleted': count_before
                }
        except Exception as e:
            log.error(f"Error clearing records from database: {e}")
            raise HTTPException(status_code=500, detail="Error clearing records from database.")
