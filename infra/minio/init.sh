#!/bin/bash

# MinIO Initialization Script for NeonCasino
# This script creates the necessary buckets and sets up initial configuration

set -e

echo "Starting MinIO initialization..."

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
until mc alias set myminio http://localhost:9000 minioadmin minioadmin123; do
    echo "MinIO not ready yet, waiting..."
    sleep 2
done

echo "MinIO is ready!"

# Create buckets
echo "Creating buckets..."

# Main buckets
mc mb myminio/neoncasino-media --ignore-existing
mc mb myminio/neoncasino-kyc --ignore-existing
mc mb myminio/neoncasino-avatars --ignore-existing
mc mb myminio/neoncasino-games --ignore-existing
mc mb myminio/neoncasino-backups --ignore-existing

# Set bucket policies
echo "Setting bucket policies..."

# Public read access for media and avatars
mc policy set download myminio/neoncasino-media
mc policy set download myminio/neoncasino-avatars
mc policy set download myminio/neoncasino-games

# Private access for KYC documents
mc policy set private myminio/neoncasino-kyc

# Private access for backups
mc policy set private myminio/neoncasino-backups

# Set CORS for media buckets
echo "Setting CORS policies..."

# CORS for media buckets
mc anonymous set-json /tmp/media-cors.json myminio/neoncasino-media
mc anonymous set-json /tmp/media-cors.json myminio/neoncasino-avatars
mc anonymous set-json /tmp/media-cors.json myminio/neoncasino-games

# Create CORS configuration file
cat > /tmp/media-cors.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"AWS": "*"},
            "Action": [
                "s3:GetBucketLocation",
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::neoncasino-media"
        },
        {
            "Effect": "Allow",
            "Principal": {"AWS": "*"},
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::neoncasino-media/*"
        }
    ]
}
EOF

# Set lifecycle policies
echo "Setting lifecycle policies..."

# Set lifecycle for KYC documents (delete after 7 years for compliance)
mc ilm add myminio/neoncasino-kyc --expiry-days 2555

# Set lifecycle for backups (delete after 30 days)
mc ilm add myminio/neoncasino-backups --expiry-days 30

# Set lifecycle for media (delete after 1 year)
mc ilm add myminio/neoncasino-media --expiry-days 365

# Create initial folder structure
echo "Creating folder structure..."

# Create folders in media bucket
mc cp --recursive /tmp/empty/ myminio/neoncasino-media/avatars/
mc cp --recursive /tmp/empty/ myminio/neoncasino-media/games/
mc cp --recursive /tmp/empty/ myminio/neoncasino-media/promotions/

# Create folders in KYC bucket
mc cp --recursive /tmp/empty/ myminio/neoncasino-kyc/passports/
mc cp --recursive /tmp/empty/ myminio/neoncasino-kyc/utility-bills/
mc cp --recursive /tmp/empty/ myminio/neoncasino-kyc/selfies/

# Create empty file for folder creation
mkdir -p /tmp/empty
touch /tmp/empty/.keep

echo "MinIO initialization completed successfully!"

# List buckets
echo "Available buckets:"
mc ls myminio

# List bucket contents
echo "Bucket contents:"
mc ls myminio/neoncasino-media --recursive
mc ls myminio/neoncasino-kyc --recursive

echo "MinIO setup is complete!"



















