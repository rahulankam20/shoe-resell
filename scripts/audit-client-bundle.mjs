import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

// Sentinels and secret name patterns that must never appear inside client bundles
const FORBIDDEN_PATTERNS = [
  { name: 'SUPABASE_SERVICE_ROLE_KEY', pattern: /SUPABASE_SERVICE_ROLE_KEY/i },
  { name: 'CASHFREE_SECRET_KEY', pattern: /CASHFREE_SECRET_KEY/i },
  { name: 'CASHFREE_WEBHOOK_SECRET', pattern: /CASHFREE_WEBHOOK_SECRET/i },
  { name: 'UPSTASH_REDIS_REST_TOKEN', pattern: /UPSTASH_REDIS_REST_TOKEN/i },
  { name: 'DEBUG_ENDPOINT_SECRET', pattern: /DEBUG_ENDPOINT_SECRET/i },
  { name: 'SOLEVAULT_ADMIN_PASSWORD', pattern: /SOLEVAULT_ADMIN_PASSWORD/i },
  { name: 'CASHFREE_LIVE_SECRET_VALUE', pattern: /cfsk_ma_prod_[a-zA-Z0-9_-]{20,}/ },
  { name: 'CASHFREE_TEST_SECRET_VALUE', pattern: /cfsk_ma_test_[a-zA-Z0-9_-]{20,}/ },
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) {
    console.error(`[Audit Error] Dist directory does not exist: ${dirPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (['.js', '.mjs', '.html', '.css', '.map', '.json'].includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function auditClientBundle() {
  console.log('\n[Security Audit] Scanning client bundle in dist/ for server-side secret leaks...');
  const files = getAllFiles(DIST_DIR);
  let leaksFound = 0;

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    for (const { name, pattern } of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`❌ [SECURITY LEAK DETECTED] File "${relativePath}" contains forbidden pattern: ${name}`);
        leaksFound++;
      }
    }
  }

  if (leaksFound > 0) {
    console.error(`\n❌ Client bundle audit failed: ${leaksFound} secret leak(s) detected. Aborting build.`);
    process.exit(1);
  }

  console.log(`✓ Client bundle security audit passed: 0 server secrets detected across ${files.length} files in dist/\n`);
}

auditClientBundle();
