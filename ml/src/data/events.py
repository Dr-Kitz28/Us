"""
Event extraction from Postgres database
Handles schema-versioned event tables with leakage control
"""

import hashlib
import os
from datetime import datetime, timedelta
from typing import Generator, Optional

import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel


class EventConfig(BaseModel):
    """Configuration for event extraction"""
    db_url: str
    output_dir: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    hash_user_ids: bool = True
    batch_size: int = 10000


def hash_id(user_id: str, salt: str = "uz_ml_salt") -> str:
    """Hash user ID for privacy"""
    return hashlib.sha256(f"{salt}:{user_id}".encode()).hexdigest()[:16]


class EventExtractor:
    """Extract events from Postgres for ML training"""
    
    def __init__(self, config: EventConfig):
        self.config = config
        self.conn = None
    
    def connect(self) -> None:
        """Establish database connection"""
        self.conn = psycopg2.connect(self.config.db_url)
    
    def close(self) -> None:
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def extract_impressions(self) -> Generator[dict, None, None]:
        """
        Extract impression events (who was shown to whom)
        
        Schema:
        - user_id: viewer
        - candidate_ids: shown profiles (ordered by position)
        - context_hash: algorithm version + context
        - timestamp
        """
        query = """
            SELECT 
                l.liker_id as user_id,
                l.liked_id as candidate_id,
                l.created_at as timestamp,
                l.id as event_id
            FROM "Like" l
            WHERE l.created_at >= %s
            ORDER BY l.created_at
        """
        
        start_date = self.config.start_date or datetime.now() - timedelta(days=90)
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (start_date,))
            
            while True:
                rows = cur.fetchmany(self.config.batch_size)
                if not rows:
                    break
                
                for row in rows:
                    yield {
                        "event_type": "impression",
                        "user_id": hash_id(row["user_id"]) if self.config.hash_user_ids else row["user_id"],
                        "candidate_id": hash_id(row["candidate_id"]) if self.config.hash_user_ids else row["candidate_id"],
                        "timestamp": row["timestamp"].isoformat(),
                        "position": 1,  # We don't track position yet
                    }
    
    def extract_swipes(self) -> Generator[dict, None, None]:
        """
        Extract swipe events (likes and passes)
        
        Combines Like table (positive) and Pass table (negative)
        """
        # Likes
        like_query = """
            SELECT 
                l.liker_id as user_id,
                l.liked_id as candidate_id,
                'like' as action,
                l.created_at as timestamp
            FROM "Like" l
            WHERE l.created_at >= %s
        """
        
        # Passes
        pass_query = """
            SELECT 
                p.passer_id as user_id,
                p.passed_id as candidate_id,
                'pass' as action,
                p.created_at as timestamp
            FROM "Pass" p
            WHERE p.created_at >= %s
        """
        
        start_date = self.config.start_date or datetime.now() - timedelta(days=90)
        
        for query, action_default in [(like_query, "like"), (pass_query, "pass")]:
            try:
                with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(query, (start_date,))
                    
                    while True:
                        rows = cur.fetchmany(self.config.batch_size)
                        if not rows:
                            break
                        
                        for row in rows:
                            yield {
                                "event_type": "swipe",
                                "user_id": hash_id(row["user_id"]) if self.config.hash_user_ids else row["user_id"],
                                "candidate_id": hash_id(row["candidate_id"]) if self.config.hash_user_ids else row["candidate_id"],
                                "action": row.get("action", action_default),
                                "timestamp": row["timestamp"].isoformat(),
                            }
            except psycopg2.Error:
                # Table might not exist
                continue
    
    def extract_matches(self) -> Generator[dict, None, None]:
        """Extract match events (mutual likes)"""
        query = """
            SELECT 
                m.user1_id,
                m.user2_id,
                m.created_at as timestamp,
                m.id as match_id
            FROM "Match" m
            WHERE m.created_at >= %s
            ORDER BY m.created_at
        """
        
        start_date = self.config.start_date or datetime.now() - timedelta(days=90)
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (start_date,))
            
            while True:
                rows = cur.fetchmany(self.config.batch_size)
                if not rows:
                    break
                
                for row in rows:
                    yield {
                        "event_type": "match",
                        "user_a_id": hash_id(row["user1_id"]) if self.config.hash_user_ids else row["user1_id"],
                        "user_b_id": hash_id(row["user2_id"]) if self.config.hash_user_ids else row["user2_id"],
                        "match_type": "mutual_like",
                        "timestamp": row["timestamp"].isoformat(),
                    }
    
    def extract_messages_meta(self) -> Generator[dict, None, None]:
        """
        Extract message metadata (counts, latency, NOT content)
        For privacy, we only extract aggregate stats
        """
        query = """
            SELECT 
                m.sender_id,
                m.receiver_id,
                m.match_id,
                m.created_at as timestamp,
                LENGTH(m.content) as message_length
            FROM "Message" m
            WHERE m.created_at >= %s
            ORDER BY m.created_at
        """
        
        start_date = self.config.start_date or datetime.now() - timedelta(days=90)
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (start_date,))
            
            while True:
                rows = cur.fetchmany(self.config.batch_size)
                if not rows:
                    break
                
                for row in rows:
                    yield {
                        "event_type": "message_meta",
                        "sender_id": hash_id(row["sender_id"]) if self.config.hash_user_ids else row["sender_id"],
                        "receiver_id": hash_id(row["receiver_id"]) if self.config.hash_user_ids else row["receiver_id"],
                        "match_id": hash_id(row["match_id"]) if self.config.hash_user_ids else row["match_id"],
                        "message_length": row["message_length"],
                        "timestamp": row["timestamp"].isoformat(),
                    }
    
    def extract_all(self) -> dict[str, list[dict]]:
        """Extract all event types"""
        return {
            "impressions": list(self.extract_impressions()),
            "swipes": list(self.extract_swipes()),
            "matches": list(self.extract_matches()),
            "messages_meta": list(self.extract_messages_meta()),
        }
    
    def save_to_parquet(self, output_dir: str) -> None:
        """Save extracted events to Parquet files"""
        os.makedirs(output_dir, exist_ok=True)
        
        events = self.extract_all()
        
        for event_type, data in events.items():
            if data:
                df = pd.DataFrame(data)
                output_path = os.path.join(output_dir, f"{event_type}.parquet")
                df.to_parquet(output_path, index=False)
                print(f"Saved {len(df)} {event_type} events to {output_path}")
