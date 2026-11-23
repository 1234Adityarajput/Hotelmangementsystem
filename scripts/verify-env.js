// Verification script to validate environment variables
const fs = require('fs');
const path = require('path');

function checkEnvFile(filePath, requiredKeys) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, missing: requiredKeys };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const missing = [];
  for (const key of requiredKeys) {
    if (!content.includes(key + '=')) {
      missing.push(key);
    }
  }
  return { exists: true, missing };
}

console.log('=== Checking Environment Files ===');
const frontendEnv = checkEnvFile(
  path.join(__dirname, '..', 'frontend', '.env.local'),
  ['NEXT_PUBLIC_API_URL']
);
console.log('Frontend .env.local exists:', frontendEnv.exists);
if (frontendEnv.missing.length > 0) {
  console.warn('Frontend missing keys:', frontendEnv.missing);
}

const backendEnv = checkEnvFile(
  path.join(__dirname, '..', 'backend', '.env'),
  ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'FRONTEND_URL']
);
console.log('Backend .env exists:', backendEnv.exists);
if (backendEnv.missing.length > 0) {
  console.warn('Backend missing keys:', backendEnv.missing);
}

console.log('Environment file check complete.');
