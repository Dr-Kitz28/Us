#!/usr/bin/env python3
"""
Extract events from Postgres database for ML training
"""

import os
from datetime import datetime, timedelta

import click
from dotenv import load_dotenv

from src.data import EventConfig, EventExtractor


@click.command()
@click.option("--db-url", envvar="POSTGRES_URL", required=True, help="Database URL")
@click.option("--output", "-o", required=True, help="Output directory for events")
@click.option("--start-date", type=click.DateTime(), help="Start date for extraction")
@click.option("--days", type=int, default=90, help="Number of days to extract")
@click.option("--hash-ids/--no-hash-ids", default=True, help="Hash user IDs for privacy")
def main(db_url: str, output: str, start_date: datetime, days: int, hash_ids: bool):
    """Extract events from Postgres for ML training."""
    
    if start_date is None:
        start_date = datetime.now() - timedelta(days=days)
    
    config = EventConfig(
        db_url=db_url,
        output_dir=output,
        start_date=start_date,
        hash_user_ids=hash_ids,
    )
    
    print(f"Extracting events from {start_date.date()} to now")
    print(f"Output directory: {output}")
    print(f"Hash user IDs: {hash_ids}")
    
    with EventExtractor(config) as extractor:
        extractor.save_to_parquet(output)
    
    print("Done!")


if __name__ == "__main__":
    load_dotenv()
    main()
