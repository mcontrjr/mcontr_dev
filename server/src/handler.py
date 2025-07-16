import psycopg2
import os
from typing import Optional
from fastapi import HTTPException

from src.logger import log

## Class for a single record + objects for responses


class PostgresHandler:
    def __init__(self):
        self.config = {
            'dbname': os.getenv('DB_NAME'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432')
        }
    
    def save_to_database(self, purchases: list, session_id: str):
        """
        Appends purchases from statements into a DB. DB is configured to only accept unique description entries.
        """
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            cur = conn.cursor()
            
            existing_purchases = self.get_records(None, session_id).get('records', [])
            log.debug(f"Existing purchases in database: {existing_purchases}")
            inserted = 0

            for purchase in purchases:
                if existing_purchases:
                    if any(purchase['Description'] == existing_purchase[3] and 
                        purchase['Amount'] == float(existing_purchase[4]) and 
                        purchase['Date'] == existing_purchase[2].strftime('%Y-%m-%d') 
                        for existing_purchase in existing_purchases):
                        log.info(f"Purchase {purchase} already exists in database. Skipping insertion.")
                        continue
                else:
                    log.info(f"Purchase {purchase}")
                try:
                    cur.execute("""
                        INSERT INTO bank_statements (bank, date, description, amount, category, session_id) 
                        VALUES (%s, %s, %s, %s, %s, %s)""",
                        (purchase['Bank'], purchase['Date'], purchase['Description'], purchase['Amount'], purchase['Category'], session_id))
                    log.info(f"Inserted purchase: {purchase}")
                    inserted += 1
                except psycopg2.IntegrityError as e:
                    conn.commit()
                    log.info(f"{e}: Purchase {purchase} already exists. Skipping insertion.")
                    conn.rollback()
                    continue
                except Exception as e:
                    conn.commit()
                    log.error(f"Error inserting purchase {purchase}: {e}")
                    conn.rollback()
                    continue
            conn.commit()
            cur.close()
            log.info(f"Inserted {inserted} new purchases into the database.")
        except Exception as e:
            log.error(f"Error saving to database: {e}")
        finally:
            if conn is not None:
                conn.close()
                
    def get_records(self, bank_name: Optional[str], session_id: str) -> dict:
        conn = None
        records = []
        try:
            print(self.config)
            conn = psycopg2.connect(**self.config)
            cur = conn.cursor()
            
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
        finally:
            if conn is not None:
                conn.close()

    def clear_records(self, session_id: str) -> dict:
        """
        Clears all records from the bank_statements table.
        Returns the number of records deleted.
        """
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            cur = conn.cursor()
            
            # Get the count of records before deletion
            cur.execute("SELECT COUNT(*) FROM bank_statements WHERE session_id = %s", (session_id,))
            count_before = cur.fetchone()[0]
            
            # Delete records for this session only
            cur.execute("DELETE FROM bank_statements WHERE session_id = %s", (session_id,))
            conn.commit()
            
            log.info(f"Cleared {count_before} records from the database.")
            return {
                'message': 'Successfully cleared all records',
                'records_deleted': count_before
            }
        except Exception as e:
            log.error(f"Error clearing records from database: {e}")
            raise HTTPException(status_code=500, detail="Error clearing records from database.")
        finally:
            if conn is not None:
                conn.close()