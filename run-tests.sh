#!/bin/bash

echo "=== Google Ads API Testing Suite ==="
echo "1. Testing Google Ads API credentials..."

# Test Google Ads API
node test-google-ads-direct.js

echo ""
echo "2. Starting backend server..."

# Start backend in background
node google-ads-backend.js &
BACKEND_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "3. Testing backend health..."
curl -s http://localhost:3000/api/health

echo ""
echo "4. Testing keyword generation..."
curl -s -X POST http://localhost:3000/api/products/generate-keywords \
  -H "Content-Type: application/json" \
  -d '{"productTitle":"Wireless Bluetooth Headphones","productPrice":"$29.99","category":"Electronics"}'

echo ""
echo "5. Testing Google Ads API endpoint..."
curl -s -X POST http://localhost:3000/api/google-ads/keyword-data \
  -H "Content-Type: application/json" \
  -d '{"keyword":"wireless headphones"}'

echo ""
echo "6. Cleaning up..."
kill $BACKEND_PID 2>/dev/null

echo ""
echo "=== Testing Complete ==="
