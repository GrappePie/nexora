import os
from pathlib import Path
from typing import Optional

import boto3
from botocore.client import Config

S3_ENDPOINT = os.getenv("S3_ENDPOINT")
S3_BUCKET = os.getenv("S3_BUCKET", "pos-media")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
LOCAL_DIR = Path(os.getenv("S3_LOCAL_DIR", "storage"))


def upload_bytes(key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload bytes to MinIO/S3 or local storage and return a URL."""
    if S3_ENDPOINT and S3_ACCESS_KEY and S3_SECRET_KEY:
        session = boto3.session.Session()
        client = session.client(
            "s3",
            endpoint_url=S3_ENDPOINT,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
        client.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)
        return f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"
    else:
        path = LOCAL_DIR / key
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        return f"file://{path.absolute()}"
