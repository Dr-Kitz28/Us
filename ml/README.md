# Python ML/DL for Dating App
# Training, evaluation, and artifact production

## Overview

This directory contains the machine learning infrastructure for the dating app, including:

- **Training pipelines** for recommendation models
- **Embedding generation** for profile matching
- **ANN index building** (HNSW) for fast similarity search
- **Safety classifiers** for content moderation
- **Evaluation frameworks** for model performance

## Directory Structure

```
ml/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── pyproject.toml           # Project configuration
├── config/
│   └── config.yaml          # Training configurations
├── data/
│   ├── raw/                 # Raw event exports
│   ├── processed/           # Cleaned training data
│   └── splits/              # Train/val/test splits
├── models/
│   ├── embeddings/          # Profile embedding models
│   ├── ranking/             # Match ranking models
│   └── safety/              # Content safety classifiers
├── scripts/
│   ├── extract_events.py    # Extract events from Postgres
│   ├── build_datasets.py    # Build training datasets
│   ├── train_embeddings.py  # Train embedding model
│   ├── train_ranker.py      # Train ranking model
│   ├── build_ann_index.py   # Build HNSW index
│   └── evaluate.py          # Model evaluation
├── notebooks/
│   ├── eda.ipynb            # Exploratory data analysis
│   ├── baseline.ipynb       # Baseline models
│   └── experiments.ipynb    # Experiment tracking
├── src/
│   ├── __init__.py
│   ├── data/
│   │   ├── __init__.py
│   │   ├── events.py        # Event extraction
│   │   ├── datasets.py      # Dataset builders
│   │   └── transforms.py    # Data transforms
│   ├── models/
│   │   ├── __init__.py
│   │   ├── embeddings.py    # Embedding models
│   │   ├── ranker.py        # Ranking models
│   │   └── safety.py        # Safety classifiers
│   ├── training/
│   │   ├── __init__.py
│   │   ├── trainer.py       # Training loops
│   │   └── losses.py        # Loss functions
│   ├── evaluation/
│   │   ├── __init__.py
│   │   ├── metrics.py       # Evaluation metrics
│   │   └── reports.py       # Report generation
│   └── inference/
│       ├── __init__.py
│       ├── ann_index.py     # ANN index operations
│       └── serving.py       # Model serving utilities
└── artifacts/
    ├── indices/             # Built ANN indices
    ├── models/              # Trained model weights
    └── reports/             # Evaluation reports
```

## Quick Start

### 1. Setup Environment

```bash
cd ml
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Extract Events from Database

```bash
python scripts/extract_events.py \
  --db-url $POSTGRES_URL \
  --output data/raw/ \
  --start-date 2024-01-01
```

### 3. Build Training Dataset

```bash
python scripts/build_datasets.py \
  --input data/raw/ \
  --output data/processed/ \
  --split-ratio 0.8,0.1,0.1
```

### 4. Train Embedding Model

```bash
python scripts/train_embeddings.py \
  --config config/config.yaml \
  --data data/processed/ \
  --output models/embeddings/
```

### 5. Build ANN Index

```bash
python scripts/build_ann_index.py \
  --embeddings models/embeddings/latest \
  --output artifacts/indices/ \
  --upload-r2
```

## Model Architecture

### Profile Embeddings

We use a dual-encoder architecture for profile embeddings:

1. **Text Encoder**: Sentence-BERT for bio/prompts
2. **Image Encoder**: EfficientNet for photos (optional)
3. **Behavioral Encoder**: MLP for interaction history
4. **Fusion Layer**: Concatenate + project to shared space

### Ranking Model

Gradient boosted trees (LightGBM) for initial ranking, with features:

- Embedding similarity scores
- User activity signals
- Reciprocity predictions
- Demographic compatibility

### Safety Classifier

Multi-label classifier for:
- Inappropriate content detection
- Spam/scam detection
- Harassment patterns
- Fake profile signals

## Artifact Registry

Models and indices are tracked in Postgres with metadata:

```sql
CREATE TABLE model_registry (
  id UUID PRIMARY KEY,
  model_type VARCHAR(50),      -- 'embedding', 'ranker', 'safety'
  version VARCHAR(50),
  r2_path VARCHAR(255),
  metrics JSONB,
  created_at TIMESTAMP,
  is_active BOOLEAN
);
```

## Cost-Bounded Training

Training runs on:
- **Local machine**: Development and debugging
- **Google Colab**: Free GPU for training
- **Oracle VM (free tier)**: Light batch scoring

Artifacts are uploaded to R2 (Cloudflare) for serving.

## Event Schema

### Impressions
```json
{
  "event_type": "impression",
  "user_id": "uuid",
  "candidate_ids": ["uuid", ...],
  "positions": [1, 2, 3, ...],
  "context_hash": "sha256",
  "timestamp": "iso8601"
}
```

### Swipe Batches
```json
{
  "event_type": "swipe_batch",
  "user_id": "uuid",
  "swipes": [
    {"candidate_id": "uuid", "action": "like", "duration_ms": 2500},
    {"candidate_id": "uuid", "action": "pass", "duration_ms": 800}
  ],
  "session_id": "uuid",
  "timestamp": "iso8601"
}
```

### Matches
```json
{
  "event_type": "match",
  "user_a_id": "uuid",
  "user_b_id": "uuid",
  "match_type": "mutual_like",
  "timestamp": "iso8601"
}
```

## Guardrails

- **No raw PII in analytics**: User IDs are hashed, no emails/names
- **Retention windows**: Raw events deleted after 90 days
- **Sampling**: Non-essential analytics sampled at 10%
- **Audit logs**: All model deployments logged

## Integration with Next.js

The TypeScript codebase calls the Python ML artifacts via:

1. **ANN Index**: Loaded into Redis for fast lookups
2. **Ranking Model**: ONNX export for serverless inference
3. **Safety Classifier**: API endpoint on Oracle VM

See `/lib/rsbm/reciprocalMatcher.ts` for integration points.
