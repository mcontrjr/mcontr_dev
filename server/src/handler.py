import json
import psycopg2
from typing import Optional, List
from contextlib import contextmanager
from fastapi import HTTPException

from src.logger import log
from src.models import ParsedTransaction, TransactionRecord, ClearResponse
from src.config import DB_CONFIG, CATEGORY_KEYWORDS

# Class for a single record + objects for responses


class PostgresHandler:
    def __init__(self):
        self.config = DB_CONFIG
        self._session_income: dict = {}

    def set_income(self, session_id: str, monthly_income: float) -> None:
        """Store monthly income for a session (in-memory)."""
        self._session_income[session_id] = monthly_income

    def get_income(self, session_id: str) -> Optional[float]:
        """Retrieve monthly income for a session."""
        return self._session_income.get(session_id)

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

    def _row_to_record(self, row) -> TransactionRecord:
        """Convert a database row tuple to a TransactionRecord."""
        return TransactionRecord(
            id=row[0],
            bank=row[1],
            date=row[2],
            description=row[3],
            amount=row[4],
            category=row[5]
        )

    def save_to_database(self, purchases: List[ParsedTransaction], session_id: str):
        """
        Appends purchases from statements into a DB. DB is configured to only accept unique description entries.
        """
        try:
            with self.db_connection(auto_commit=False) as (conn, cur):
                existing_records = self.get_records(None, session_id)
                existing_tuples = [(r.description, float(r.amount), r.date) for r in existing_records]
                log.debug(f"Existing purchases in database: {existing_records}")
                inserted = 0

                for purchase in purchases:
                    if existing_tuples:
                        if any(purchase.description == desc and
                               purchase.amount == amt and
                               purchase.date == (d.date() if hasattr(d, 'date') else d)
                               for desc, amt, d in existing_tuples):
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

    def get_records(self, bank_name: Optional[str], session_id: str) -> List[TransactionRecord]:
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
                return [self._row_to_record(row) for row in records]
        except Exception as e:
            log.error(f"Error retrieving records from database: {e}")
            raise HTTPException(status_code=500, detail="Error retrieving records from database.")

    def clear_records(self, session_id: str) -> ClearResponse:
        """
        Clears all records from the bank_statements table.
        Returns a ClearResponse with the number of records deleted.
        """
        try:
            with self.db_connection() as (conn, cur):
                # Get the count of records before deletion
                cur.execute("SELECT COUNT(*) FROM bank_statements WHERE session_id = %s", (session_id,))
                count_before = cur.fetchone()[0]

                # Delete records for this session only
                cur.execute("DELETE FROM bank_statements WHERE session_id = %s", (session_id,))

                log.info(f"Cleared {count_before} records from the database.")
                return ClearResponse(
                    message='Successfully cleared all records',
                    records_deleted=count_before
                )
        except Exception as e:
            log.error(f"Error clearing records from database: {e}")
            raise HTTPException(status_code=500, detail="Error clearing records from database.")

    # ── Session Category Methods ──────────────────────────────────────────────

    def get_session_categories(self, session_id: str) -> dict:
        """Get per-session category keyword overrides."""
        try:
            with self.db_connection() as (conn, cur):
                cur.execute(
                    "SELECT category, keywords FROM session_categories WHERE session_id = %s",
                    (session_id,)
                )
                return {row[0]: row[1] for row in cur.fetchall()}
        except Exception as e:
            log.error(f"Error getting session categories: {e}")
            return {}

    def upsert_session_category(self, session_id: str, category: str, keywords: list) -> None:
        """Create or update a session-specific category keyword list."""
        try:
            with self.db_connection() as (conn, cur):
                cur.execute("""
                    INSERT INTO session_categories (session_id, category, keywords)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (session_id, category)
                    DO UPDATE SET keywords = EXCLUDED.keywords
                """, (session_id, category, json.dumps(keywords)))
        except Exception as e:
            log.error(f"Error upserting session category: {e}")
            raise HTTPException(status_code=500, detail="Error saving category")

    def delete_session_category(self, session_id: str, category: str) -> bool:
        """Remove a session-specific category override. Returns True if a row was deleted."""
        try:
            with self.db_connection() as (conn, cur):
                cur.execute(
                    "DELETE FROM session_categories WHERE session_id = %s AND category = %s",
                    (session_id, category)
                )
                return cur.rowcount > 0
        except Exception as e:
            log.error(f"Error deleting session category: {e}")
            raise HTTPException(status_code=500, detail="Error deleting category")

    def get_merged_categories(self, session_id: str) -> dict:
        """Merge global CATEGORY_KEYWORDS with any session-specific overrides."""
        merged = dict(CATEGORY_KEYWORDS)
        merged.update(self.get_session_categories(session_id))
        return merged

    def recategorize_records(self, session_id: str) -> int:
        """Re-assign categories for all records in a session using merged keyword dict."""
        merged = self.get_merged_categories(session_id)
        records = self.get_records(None, session_id)

        updates = []
        for record in records:
            desc_upper = record.description.upper()
            new_category = 'OTHER'
            for category, keywords in merged.items():
                if any(kw.upper() in desc_upper for kw in keywords):
                    new_category = category
                    break
            updates.append((new_category, record.id))

        try:
            with self.db_connection() as (conn, cur):
                for category, record_id in updates:
                    cur.execute(
                        "UPDATE bank_statements SET category = %s WHERE id = %s AND session_id = %s",
                        (category, record_id, session_id)
                    )
            return len(updates)
        except Exception as e:
            log.error(f"Error recategorizing records: {e}")
            raise HTTPException(status_code=500, detail="Error recategorizing records")

    def update_record(self, id: int, updates: dict, session_id: str) -> Optional[TransactionRecord]:
        """
        Updates a record in the database.

        :param id: The ID of the record to update
        :param updates: Dictionary of fields to update (e.g., {'category': 'FOOD'})
        :param session_id: Session ID for data isolation
        :return: The updated TransactionRecord if successful, None otherwise
        """
        try:
            with self.db_connection() as (conn, cur):
                # Build the UPDATE query dynamically
                set_clauses = []
                values = []

                for field, value in updates.items():
                    # Only allow updating certain fields for security
                    if field in ['category', 'description', 'amount']:
                        set_clauses.append(f"{field} = %s")
                        values.append(value)

                if not set_clauses:
                    log.warning("No valid fields to update")
                    return None

                # Add the WHERE conditions
                values.extend([id, session_id])

                query = f"UPDATE bank_statements SET {', '.join(set_clauses)} WHERE id = %s AND session_id = %s"

                log.info(f"Executing update query: {query} with values: {values}")
                cur.execute(query, values)

                # Check if any rows were affected
                if cur.rowcount == 0:
                    log.warning(f"No record found with id {id} for session {session_id}")
                    return None

                # Fetch the updated record
                cur.execute("SELECT * FROM bank_statements WHERE id = %s AND session_id = %s", (id, session_id))
                row = cur.fetchone()
                if row:
                    log.info(f"Successfully updated record {id}")
                    return self._row_to_record(row)

                return None

        except Exception as e:
            log.error(f"Error updating record {id}: {e}")
            raise HTTPException(status_code=500, detail=f"Error updating record: {e}")
