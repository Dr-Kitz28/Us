#!/usr/bin/env python3
"""
Train profile embedding model
"""

import json
import os

import click
import numpy as np
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

from src.models import EmbeddingConfig, ProfileEmbedder


def fetch_profiles(db_url: str, limit: int = None) -> list[dict]:
    """Fetch profiles from database"""
    conn = psycopg2.connect(db_url)
    
    query = """
        SELECT 
            u.id as user_id,
            p.bio,
            p.interests,
            p.looking_for as prompts
        FROM "User" u
        LEFT JOIN "Profile" p ON u.id = p."userId"
        WHERE p.bio IS NOT NULL OR p.interests IS NOT NULL
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query)
        rows = cur.fetchall()
    
    conn.close()
    
    profiles = []
    for row in rows:
        profiles.append({
            "user_id": row["user_id"],
            "bio": row["bio"],
            "interests": row["interests"],
            "prompts": [],  # Parse if stored as JSON
        })
    
    return profiles


@click.command()
@click.option("--db-url", envvar="POSTGRES_URL", required=True, help="Database URL")
@click.option("--output", "-o", required=True, help="Output directory for embeddings")
@click.option("--model-name", default="sentence-transformers/all-MiniLM-L6-v2", help="Model to use")
@click.option("--batch-size", default=32, type=int, help="Batch size for encoding")
@click.option("--limit", type=int, help="Limit number of profiles (for testing)")
def main(db_url: str, output: str, model_name: str, batch_size: int, limit: int):
    """Train/generate profile embeddings."""
    
    print(f"Fetching profiles from database...")
    profiles = fetch_profiles(db_url, limit=limit)
    print(f"Found {len(profiles)} profiles with content")
    
    if not profiles:
        print("No profiles found. Exiting.")
        return
    
    # Initialize embedder
    config = EmbeddingConfig(
        model_name=model_name,
        batch_size=batch_size,
    )
    embedder = ProfileEmbedder(config)
    
    print(f"Generating embeddings with {model_name}...")
    embeddings = embedder.embed_profiles_batch(profiles)
    
    # Save outputs
    os.makedirs(output, exist_ok=True)
    
    # Save embeddings
    embeddings_path = os.path.join(output, "embeddings.npy")
    np.save(embeddings_path, embeddings)
    print(f"Saved embeddings to {embeddings_path}")
    
    # Save user IDs
    user_ids = [p["user_id"] for p in profiles]
    user_ids_path = os.path.join(output, "user_ids.json")
    with open(user_ids_path, "w") as f:
        json.dump(user_ids, f)
    print(f"Saved user IDs to {user_ids_path}")
    
    # Save metadata
    metadata = {
        "n_profiles": len(profiles),
        "embedding_dim": embeddings.shape[1],
        "model_name": model_name,
    }
    metadata_path = os.path.join(output, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Done! Generated {len(profiles)} embeddings of dimension {embeddings.shape[1]}")


if __name__ == "__main__":
    load_dotenv()
    main()
