"""
Embedding models for profile representation learning
Uses sentence-transformers for text and optional image encoders
"""

from typing import Optional

import numpy as np
import torch
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer


class EmbeddingConfig(BaseModel):
    """Configuration for embedding model"""
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384
    max_seq_length: int = 256
    batch_size: int = 32
    device: str = "cuda" if torch.cuda.is_available() else "cpu"


class ProfileEmbedder:
    """
    Generate embeddings for user profiles
    
    Combines:
    - Bio text embeddings
    - Prompt answer embeddings
    - Interest embeddings
    
    Future: Add image embeddings when data permits
    """
    
    def __init__(self, config: Optional[EmbeddingConfig] = None):
        self.config = config or EmbeddingConfig()
        self.model = SentenceTransformer(self.config.model_name)
        self.model.max_seq_length = self.config.max_seq_length
        
        if self.config.device == "cuda":
            self.model = self.model.to("cuda")
    
    def embed_text(self, texts: list[str]) -> np.ndarray:
        """
        Embed a list of text strings
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            np.ndarray of shape (n_texts, embedding_dim)
        """
        embeddings = self.model.encode(
            texts,
            batch_size=self.config.batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True,  # For cosine similarity
        )
        return embeddings
    
    def embed_profile(self, profile: dict) -> np.ndarray:
        """
        Embed a single user profile
        
        Args:
            profile: Dict with keys: bio, prompts, interests
            
        Returns:
            np.ndarray of shape (embedding_dim,)
        """
        texts = []
        
        # Add bio
        if profile.get("bio"):
            texts.append(f"Bio: {profile['bio']}")
        
        # Add prompts
        if profile.get("prompts"):
            for prompt in profile["prompts"]:
                texts.append(f"Q: {prompt.get('question', '')} A: {prompt.get('answer', '')}")
        
        # Add interests
        if profile.get("interests"):
            if isinstance(profile["interests"], list):
                texts.append(f"Interests: {', '.join(profile['interests'])}")
            else:
                texts.append(f"Interests: {profile['interests']}")
        
        if not texts:
            # Return zero vector if no text
            return np.zeros(self.config.embedding_dim)
        
        # Combine texts and embed
        combined = " | ".join(texts)
        embedding = self.embed_text([combined])[0]
        return embedding
    
    def embed_profiles_batch(self, profiles: list[dict]) -> np.ndarray:
        """
        Embed multiple profiles in batch
        
        Args:
            profiles: List of profile dicts
            
        Returns:
            np.ndarray of shape (n_profiles, embedding_dim)
        """
        texts = []
        
        for profile in profiles:
            profile_texts = []
            
            if profile.get("bio"):
                profile_texts.append(f"Bio: {profile['bio']}")
            
            if profile.get("prompts"):
                for prompt in profile["prompts"]:
                    profile_texts.append(f"Q: {prompt.get('question', '')} A: {prompt.get('answer', '')}")
            
            if profile.get("interests"):
                if isinstance(profile["interests"], list):
                    profile_texts.append(f"Interests: {', '.join(profile['interests'])}")
                else:
                    profile_texts.append(f"Interests: {profile['interests']}")
            
            combined = " | ".join(profile_texts) if profile_texts else ""
            texts.append(combined)
        
        embeddings = self.embed_text(texts)
        return embeddings
    
    def compute_similarity(self, embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
        """Compute cosine similarity between two embeddings"""
        # Embeddings are already normalized, so dot product = cosine similarity
        return float(np.dot(embedding_a, embedding_b))
    
    def compute_similarity_matrix(self, embeddings_a: np.ndarray, embeddings_b: np.ndarray) -> np.ndarray:
        """Compute pairwise cosine similarity matrix"""
        # Normalized embeddings: similarity = dot product
        return np.dot(embeddings_a, embeddings_b.T)
    
    def save(self, path: str) -> None:
        """Save model to disk"""
        self.model.save(path)
    
    @classmethod
    def load(cls, path: str, config: Optional[EmbeddingConfig] = None) -> "ProfileEmbedder":
        """Load model from disk"""
        instance = cls.__new__(cls)
        instance.config = config or EmbeddingConfig()
        instance.model = SentenceTransformer(path)
        return instance


class TwoTowerModel:
    """
    Two-tower (dual encoder) model for matching
    
    Learns separate embeddings for "user seeking" and "user being shown"
    to capture asymmetric preferences
    """
    
    def __init__(self, config: Optional[EmbeddingConfig] = None):
        self.config = config or EmbeddingConfig()
        
        # Use same base model for both towers (can diverge with fine-tuning)
        self.user_tower = ProfileEmbedder(config)
        self.candidate_tower = ProfileEmbedder(config)
    
    def embed_user(self, profile: dict) -> np.ndarray:
        """Embed user profile (the one swiping)"""
        return self.user_tower.embed_profile(profile)
    
    def embed_candidate(self, profile: dict) -> np.ndarray:
        """Embed candidate profile (the one being shown)"""
        return self.candidate_tower.embed_profile(profile)
    
    def score_pair(self, user_profile: dict, candidate_profile: dict) -> float:
        """Score a user-candidate pair"""
        user_emb = self.embed_user(user_profile)
        cand_emb = self.embed_candidate(candidate_profile)
        return self.user_tower.compute_similarity(user_emb, cand_emb)
    
    def score_candidates(self, user_profile: dict, candidate_profiles: list[dict]) -> np.ndarray:
        """Score multiple candidates for a user"""
        user_emb = self.embed_user(user_profile).reshape(1, -1)
        cand_embs = self.candidate_tower.embed_profiles_batch(candidate_profiles)
        return self.user_tower.compute_similarity_matrix(user_emb, cand_embs)[0]
