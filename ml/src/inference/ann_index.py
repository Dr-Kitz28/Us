"""
ANN (Approximate Nearest Neighbor) Index Operations
Uses HNSW for fast similarity search
"""

import json
import os
from datetime import datetime
from typing import Optional

import hnswlib
import numpy as np
from pydantic import BaseModel


class ANNIndexConfig(BaseModel):
    """Configuration for ANN index"""
    space: str = "cosine"  # 'cosine', 'l2', or 'ip'
    ef_construction: int = 200
    M: int = 16
    ef_search: int = 100
    max_elements: int = 1000000  # 1M profiles


class ANNIndex:
    """
    HNSW-based ANN index for fast profile similarity search
    
    Key operations:
    - Build index from embeddings
    - Query for k nearest neighbors
    - Save/load index to/from disk
    - Upload to R2/S3 for serving
    """
    
    def __init__(self, config: Optional[ANNIndexConfig] = None, dim: int = 384):
        self.config = config or ANNIndexConfig()
        self.dim = dim
        self.index: Optional[hnswlib.Index] = None
        self.id_to_user: dict[int, str] = {}
        self.user_to_id: dict[str, int] = {}
        self.metadata: dict = {}
    
    def build(self, embeddings: np.ndarray, user_ids: list[str]) -> None:
        """
        Build index from embeddings
        
        Args:
            embeddings: np.ndarray of shape (n_users, dim)
            user_ids: List of user IDs corresponding to embeddings
        """
        n_elements = len(embeddings)
        
        # Initialize index
        self.index = hnswlib.Index(space=self.config.space, dim=self.dim)
        self.index.init_index(
            max_elements=max(n_elements, self.config.max_elements),
            ef_construction=self.config.ef_construction,
            M=self.config.M,
        )
        
        # Build ID mappings
        self.id_to_user = {i: uid for i, uid in enumerate(user_ids)}
        self.user_to_id = {uid: i for i, uid in enumerate(user_ids)}
        
        # Add items to index
        internal_ids = np.arange(n_elements)
        self.index.add_items(embeddings, internal_ids)
        
        # Set search parameters
        self.index.set_ef(self.config.ef_search)
        
        # Update metadata
        self.metadata = {
            "n_elements": n_elements,
            "dim": self.dim,
            "space": self.config.space,
            "built_at": datetime.utcnow().isoformat(),
            "ef_construction": self.config.ef_construction,
            "M": self.config.M,
        }
        
        print(f"Built ANN index with {n_elements} elements")
    
    def query(
        self, 
        embedding: np.ndarray, 
        k: int = 50,
        exclude_ids: Optional[list[str]] = None
    ) -> list[tuple[str, float]]:
        """
        Find k nearest neighbors for a query embedding
        
        Args:
            embedding: Query embedding of shape (dim,)
            k: Number of neighbors to return
            exclude_ids: User IDs to exclude from results
            
        Returns:
            List of (user_id, distance) tuples
        """
        if self.index is None:
            raise ValueError("Index not built. Call build() first.")
        
        # Query more than k to account for exclusions
        query_k = k + (len(exclude_ids) if exclude_ids else 0) + 10
        query_k = min(query_k, self.index.get_current_count())
        
        # Reshape for batch query
        embedding = embedding.reshape(1, -1)
        
        # Query index
        internal_ids, distances = self.index.knn_query(embedding, k=query_k)
        
        # Convert to user IDs and filter
        results = []
        exclude_set = set(exclude_ids) if exclude_ids else set()
        
        for internal_id, distance in zip(internal_ids[0], distances[0]):
            user_id = self.id_to_user.get(internal_id)
            if user_id and user_id not in exclude_set:
                # Convert distance to similarity for cosine
                if self.config.space == "cosine":
                    similarity = 1 - distance
                else:
                    similarity = -distance  # For L2, lower is better
                    
                results.append((user_id, float(similarity)))
                
                if len(results) >= k:
                    break
        
        return results
    
    def query_batch(
        self, 
        embeddings: np.ndarray, 
        k: int = 50
    ) -> list[list[tuple[str, float]]]:
        """
        Batch query for multiple embeddings
        
        Args:
            embeddings: np.ndarray of shape (n_queries, dim)
            k: Number of neighbors per query
            
        Returns:
            List of results for each query
        """
        if self.index is None:
            raise ValueError("Index not built. Call build() first.")
        
        internal_ids, distances = self.index.knn_query(embeddings, k=k)
        
        all_results = []
        for query_ids, query_distances in zip(internal_ids, distances):
            results = []
            for internal_id, distance in zip(query_ids, query_distances):
                user_id = self.id_to_user.get(internal_id)
                if user_id:
                    if self.config.space == "cosine":
                        similarity = 1 - distance
                    else:
                        similarity = -distance
                    results.append((user_id, float(similarity)))
            all_results.append(results)
        
        return all_results
    
    def save(self, path: str) -> None:
        """Save index and mappings to disk"""
        if self.index is None:
            raise ValueError("No index to save")
        
        os.makedirs(path, exist_ok=True)
        
        # Save HNSW index
        index_path = os.path.join(path, "index.bin")
        self.index.save_index(index_path)
        
        # Save mappings
        mappings_path = os.path.join(path, "mappings.json")
        with open(mappings_path, "w") as f:
            json.dump({
                "id_to_user": {str(k): v for k, v in self.id_to_user.items()},
                "metadata": self.metadata,
            }, f)
        
        print(f"Saved index to {path}")
    
    def load(self, path: str) -> None:
        """Load index and mappings from disk"""
        # Load mappings first to get dimension
        mappings_path = os.path.join(path, "mappings.json")
        with open(mappings_path, "r") as f:
            data = json.load(f)
        
        self.id_to_user = {int(k): v for k, v in data["id_to_user"].items()}
        self.user_to_id = {v: k for k, v in self.id_to_user.items()}
        self.metadata = data.get("metadata", {})
        
        # Load HNSW index
        self.dim = self.metadata.get("dim", self.dim)
        space = self.metadata.get("space", self.config.space)
        
        self.index = hnswlib.Index(space=space, dim=self.dim)
        index_path = os.path.join(path, "index.bin")
        self.index.load_index(index_path)
        self.index.set_ef(self.config.ef_search)
        
        print(f"Loaded index from {path} with {len(self.id_to_user)} elements")
    
    def upload_to_r2(
        self, 
        local_path: str,
        bucket: str,
        r2_path: str,
        endpoint: str,
        access_key: str,
        secret_key: str,
    ) -> str:
        """
        Upload index to Cloudflare R2
        
        Returns:
            R2 path of uploaded index
        """
        import boto3
        
        s3 = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )
        
        # Upload all files in directory
        for filename in os.listdir(local_path):
            local_file = os.path.join(local_path, filename)
            r2_key = f"{r2_path}/{filename}"
            
            s3.upload_file(local_file, bucket, r2_key)
            print(f"Uploaded {filename} to r2://{bucket}/{r2_key}")
        
        return f"r2://{bucket}/{r2_path}"


def build_index_from_embeddings(
    embeddings_path: str,
    user_ids_path: str,
    output_path: str,
    config: Optional[ANNIndexConfig] = None,
) -> ANNIndex:
    """
    Build ANN index from saved embeddings
    
    Args:
        embeddings_path: Path to .npy file with embeddings
        user_ids_path: Path to .json file with user IDs
        output_path: Path to save index
        config: Index configuration
        
    Returns:
        Built ANNIndex
    """
    embeddings = np.load(embeddings_path)
    
    with open(user_ids_path, "r") as f:
        user_ids = json.load(f)
    
    index = ANNIndex(config=config, dim=embeddings.shape[1])
    index.build(embeddings, user_ids)
    index.save(output_path)
    
    return index
