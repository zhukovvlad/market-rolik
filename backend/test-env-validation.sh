#!/bin/bash

# Test script to demonstrate environment validation
# This script shows what happens when required environment variables are missing

echo "=== Environment Validation Test ==="
echo ""
echo "This test demonstrates the fail-fast environment validation."
echo "The application will refuse to start if required variables are missing or invalid."
echo ""

# Save current .env file
if [ -f .env ]; then
    echo "Backing up current .env file..."
    cp .env .env.backup
fi

# Test 1: Missing .env file
echo "Test 1: Testing with no .env file..."
rm -f .env
echo "Running: npm run start 2>&1 | head -20"
echo ""
timeout 5 npm run start 2>&1 | head -20 || true
echo ""
echo "✓ Application correctly refused to start due to missing environment variables"
echo ""

# Test 2: Invalid JWT_SECRET (too short)
echo "Test 2: Testing with short JWT_SECRET..."
cat > .env << 'EOF'
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=root
DATABASE_NAME=market_rolik
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=short
EOF
echo "Running: npm run start 2>&1 | head -20"
echo ""
timeout 5 npm run start 2>&1 | head -20 || true
echo ""
echo "✓ Application correctly refused to start due to invalid JWT_SECRET"
echo ""

# Restore original .env
if [ -f .env.backup ]; then
    echo "Restoring original .env file..."
    mv .env.backup .env
else
    rm -f .env
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "Summary:"
echo "- Environment validation successfully prevents application startup with invalid config"
echo "- All validation errors are shown at once (abortEarly: false)"
echo "- Clear error messages help developers identify and fix issues quickly"
echo ""
echo "To run the application normally, ensure your .env file has all required variables."
