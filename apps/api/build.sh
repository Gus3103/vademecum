#!/bin/bash
# Build script for AWS Elastic Beanstalk
# Runs from the apps/api directory

set -e

echo "Building @drug-medicine-lookup/shared..."
cd ../../packages/shared
npm install
npm run build

echo "Building @drug-medicine-lookup/api..."
cd ../../apps/api
npm install
npm run build

echo "Build complete."
