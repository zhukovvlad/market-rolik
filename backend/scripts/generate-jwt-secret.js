#!/usr/bin/env node

/**
 * Generate a cryptographically secure JWT secret
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate 64 random bytes and encode as base64
const secret = crypto.randomBytes(64).toString('base64');

console.log('\n🔐 Generated JWT Secret (64 bytes, base64-encoded):\n');
console.log(secret);
console.log('\n📋 Add this to your .env file:\n');
console.log(`JWT_SECRET=${secret}`);
console.log('\n⚠️  Keep this secret safe and never commit it to version control!\n');
