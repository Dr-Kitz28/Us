#!/usr/bin/env python3
"""
Build HNSW ANN index from embeddings
"""

import json
import os

import click
import numpy as np
from dotenv import load_dotenv

from src.inference import ANNIndex, ANNIndexConfig


@click.command()
@click.option("--embeddings", "-e", required=True, help="Path to embeddings directory")
@click.option("--output", "-o", required=True, help="Output directory for index")
@click.option("--ef-construction", default=200, type=int, help="HNSW ef_construction param")
@click.option("--M", "m", default=16, type=int, help="HNSW M param")
@click.option("--ef-search", default=100, type=int, help="HNSW ef_search param")
@click.option("--upload-r2", is_flag=True, help="Upload to R2 after building")
def main(
    embeddings: str, 
    output: str, 
    ef_construction: int, 
    m: int, 
    ef_search: int,
    upload_r2: bool
):
    """Build HNSW ANN index from embeddings."""
    
    # Load embeddings
    embeddings_path = os.path.join(embeddings, "embeddings.npy")
    user_ids_path = os.path.join(embeddings, "user_ids.json")
    
    print(f"Loading embeddings from {embeddings_path}")
    embedding_matrix = np.load(embeddings_path)
    
    with open(user_ids_path, "r") as f:
        user_ids = json.load(f)
    
    print(f"Loaded {len(user_ids)} embeddings of dimension {embedding_matrix.shape[1]}")
    
    # Build index
    config = ANNIndexConfig(
        ef_construction=ef_construction,
        M=m,
        ef_search=ef_search,
    )
    
    index = ANNIndex(config=config, dim=embedding_matrix.shape[1])
    index.build(embedding_matrix, user_ids)
    
    # Save index
    os.makedirs(output, exist_ok=True)
    index.save(output)
    
    # Test query
    print("\nTesting index with random query...")
    test_embedding = embedding_matrix[0]
    results = index.query(test_embedding, k=5, exclude_ids=[user_ids[0]])
    print(f"Top 5 similar profiles:")
    for uid, score in results:
        print(f"  {uid}: {score:.4f}")
    
    # Upload to R2 if requested
    if upload_r2:
        r2_endpoint = os.environ.get("R2_ENDPOINT")
        r2_access_key = os.environ.get("R2_ACCESS_KEY")
        r2_secret_key = os.environ.get("R2_SECRET_KEY")
        r2_bucket = os.environ.get("R2_BUCKET", "uz-ml-artifacts")
        
        if all([r2_endpoint, r2_access_key, r2_secret_key]):
            from datetime import datetime
            r2_path = f"indices/{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            uploaded_path = index.upload_to_r2(
                output, r2_bucket, r2_path,
                r2_endpoint, r2_access_key, r2_secret_key
            )
            print(f"\nUploaded to {uploaded_path}")
        else:
            print("\nR2 credentials not configured. Skipping upload.")
    
    print("\nDone!")


if __name__ == "__main__":
    load_dotenv()
    main()
