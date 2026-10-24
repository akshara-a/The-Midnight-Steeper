import os
import json
import sqlite3
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "midnight_steeper.db")

class LocalCollection:
    """
    Pure embedded zero-dependency local database collection backed by SQLite.
    Zero external database services or cloud accounts required.
    """
    def __init__(self, table_name: str, db_path: str):
        self.table_name = table_name
        self.db_path = db_path
        self._init_table()

    def _get_conn(self):
        return sqlite3.connect(self.db_path)

    def _init_table(self):
        with self._get_conn() as conn:
            conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {self.table_name} (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    async def find_one(self, query: dict, projection: dict = None, sort: list = None) -> dict | None:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync_find_one, query, sort)

    def _sync_find_one(self, query: dict, sort: list = None) -> dict | None:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT data FROM {self.table_name} ORDER BY rowid DESC")
            rows = cursor.fetchall()

            for (raw_data,) in rows:
                doc = json.loads(raw_data)
                match = True
                for k, v in query.items():
                    if k == "_id":
                        continue
                    if isinstance(v, dict):
                        if "$ne" in v and doc.get(k) == v["$ne"]:
                            match = False
                            break
                        if "$in" in v and doc.get(k) not in v["$in"]:
                            match = False
                            break
                    elif doc.get(k) != v:
                        match = False
                        break
                if match:
                    return doc
        return None

    async def find(self, query: dict) -> list:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync_find, query)

    def _sync_find(self, query: dict) -> list:
        with self._get_conn() as conn:
            rows = conn.execute(f"SELECT data FROM {self.table_name}").fetchall()
        docs = [json.loads(raw) for (raw,) in rows]
        return [d for d in docs if all(d.get(k) == v for k, v in query.items() if k != "_id")]

    async def insert_one(self, doc: dict):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._sync_insert_one, doc)

    def _sync_insert_one(self, doc: dict):
        doc_id = doc.get("brew_id") or doc.get("player_id") or str(datetime.now(timezone.utc).timestamp())
        with self._get_conn() as conn:
            conn.execute(
                f"INSERT OR REPLACE INTO {self.table_name} (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                (doc_id, json.dumps(doc))
            )
            conn.commit()

    async def update_one(self, query: dict, update: dict, upsert: bool = False):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._sync_update_one, query, update, upsert)

    def _sync_update_one(self, query: dict, update: dict, upsert: bool = False):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT id, data FROM {self.table_name}")
            rows = cursor.fetchall()
            matched_id = None
            doc = None

            for (row_id, raw_data) in rows:
                candidate = json.loads(raw_data)
                match = True
                for k, v in query.items():
                    if k == "_id":
                        continue
                    if isinstance(v, dict):
                        if "$ne" in v and candidate.get(k) == v["$ne"]:
                            match = False
                            break
                        if "$in" in v and candidate.get(k) not in v["$in"]:
                            match = False
                            break
                    elif candidate.get(k) != v:
                        match = False
                        break
                if match:
                    matched_id = row_id
                    doc = candidate
                    break

            if doc:
                if "$set" in update:
                    doc.update(update["$set"])
                if "$inc" in update:
                    for ik, iv in update["$inc"].items():
                        doc[ik] = doc.get(ik, 0) + iv
                if "$push" in update:
                    for pk, pv in update["$push"].items():
                        if pk not in doc or not isinstance(doc[pk], list):
                            doc[pk] = []
                        doc[pk].append(pv)

                conn.execute(
                    f"UPDATE {self.table_name} SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (json.dumps(doc), matched_id)
                )
                conn.commit()
            elif upsert and "$set" in update:
                new_doc = {**query, **update["$set"]}
                doc_id = new_doc.get("brew_id") or new_doc.get("player_id") or str(datetime.now(timezone.utc).timestamp())
                conn.execute(
                    f"INSERT INTO {self.table_name} (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                    (doc_id, json.dumps(new_doc))
                )
                conn.commit()

# Pure embedded local SQLite collections
users_collection = LocalCollection("users", SQLITE_DB_PATH)
brews_collection = LocalCollection("brews", SQLITE_DB_PATH)
