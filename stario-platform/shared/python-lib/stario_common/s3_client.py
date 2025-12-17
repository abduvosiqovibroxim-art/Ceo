"""
S3-compatible storage client.
"""

import io
import uuid
from datetime import datetime, timedelta
from typing import BinaryIO, Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from .config import get_settings


class S3Client:
    """S3-compatible storage client (works with MinIO, AWS S3, etc.)."""

    def __init__(self):
        settings = get_settings()
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=Config(signature_version="s3v4"),
        )
        self._settings = settings

    def _ensure_bucket(self, bucket: str) -> None:
        """Ensure a bucket exists."""
        try:
            self._client.head_bucket(Bucket=bucket)
        except ClientError:
            self._client.create_bucket(Bucket=bucket)

    def upload_file(
        self,
        file: BinaryIO,
        bucket: str,
        key: Optional[str] = None,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None,
    ) -> str:
        """Upload a file to S3."""
        self._ensure_bucket(bucket)

        if key is None:
            ext = ""
            if content_type.startswith("image/"):
                ext = "." + content_type.split("/")[1]
            elif content_type.startswith("video/"):
                ext = "." + content_type.split("/")[1]
            elif content_type.startswith("audio/"):
                ext = "." + content_type.split("/")[1].replace("mpeg", "mp3")
            key = f"{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid.uuid4()}{ext}"

        extra_args = {"ContentType": content_type}
        if metadata:
            extra_args["Metadata"] = metadata

        self._client.upload_fileobj(file, bucket, key, ExtraArgs=extra_args)
        return key

    def upload_bytes(
        self,
        data: bytes,
        bucket: str,
        key: Optional[str] = None,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None,
    ) -> str:
        """Upload bytes to S3."""
        return self.upload_file(
            io.BytesIO(data),
            bucket,
            key,
            content_type,
            metadata,
        )

    def download_file(self, bucket: str, key: str) -> bytes:
        """Download a file from S3."""
        buffer = io.BytesIO()
        self._client.download_fileobj(bucket, key, buffer)
        buffer.seek(0)
        return buffer.read()

    def delete_file(self, bucket: str, key: str) -> None:
        """Delete a file from S3."""
        self._client.delete_object(Bucket=bucket, Key=key)

    def get_presigned_url(
        self,
        bucket: str,
        key: str,
        expires_in: int = 3600,
        method: str = "get_object",
    ) -> str:
        """Generate a presigned URL for direct access."""
        return self._client.generate_presigned_url(
            ClientMethod=method,
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def get_upload_presigned_url(
        self,
        bucket: str,
        key: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> dict:
        """Generate a presigned URL for upload."""
        self._ensure_bucket(bucket)
        url = self._client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        return {
            "upload_url": url,
            "key": key,
            "bucket": bucket,
            "expires_at": (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat(),
        }

    def list_files(
        self,
        bucket: str,
        prefix: str = "",
        max_keys: int = 1000,
    ) -> list[dict]:
        """List files in a bucket."""
        try:
            response = self._client.list_objects_v2(
                Bucket=bucket,
                Prefix=prefix,
                MaxKeys=max_keys,
            )
            return [
                {
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"].isoformat(),
                }
                for obj in response.get("Contents", [])
            ]
        except ClientError:
            return []

    def file_exists(self, bucket: str, key: str) -> bool:
        """Check if a file exists."""
        try:
            self._client.head_object(Bucket=bucket, Key=key)
            return True
        except ClientError:
            return False

    def copy_file(
        self,
        source_bucket: str,
        source_key: str,
        dest_bucket: str,
        dest_key: str,
    ) -> None:
        """Copy a file between locations."""
        self._ensure_bucket(dest_bucket)
        self._client.copy_object(
            Bucket=dest_bucket,
            Key=dest_key,
            CopySource={"Bucket": source_bucket, "Key": source_key},
        )


# Global S3 instance
_s3: Optional[S3Client] = None


def get_s3() -> S3Client:
    """Get the global S3 instance."""
    global _s3
    if _s3 is None:
        _s3 = S3Client()
    return _s3
