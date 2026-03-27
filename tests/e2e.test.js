const https = require('https');

const BASE_URL = 'https://matrix.laofu.online';

const pages = [
  '/',
  '/docs/',
  '/docs/getting-started/',
  '/docs/installation/',
  '/docs/cli/',
  '/docs/config/',
  '/docs/quick-start/',
  '/docs/concepts/',
  '/docs/concepts/phases/',
  '/docs/concepts/quality-levels/',
  '/docs/concepts/meetings/',
  '/docs/concepts/skills/',
  '/robots.txt',
  '/sitemap.xml'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 OpenMatrix Website E2E Tests\n');

  let passed = 0;
  let failed = 0;

  // Test 1: All pages return 200
  console.log('📋 Test 1: All pages return 200');
  for (const page of pages) {
    const url = BASE_URL + page;
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        console.log(`  ✅ ${page}`);
        passed++;
      } else {
        console.log(`  ❌ ${page} - Status: ${res.status}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ ${page} - Error: ${e.message}`);
      failed++;
    }
  }

  // Test 2: Sidebar has 3 sections
  console.log('\n📋 Test 2: Sidebar has 3 sections on doc pages');
  const docPages = pages.filter(p => p.startsWith('/docs/') && !p.includes('robots') && !p.includes('sitemap'));
  for (const page of docPages) {
    const url = BASE_URL + page;
    try {
      const res = await fetch(url);
      const sectionCount = (res.body.match(/sidebar-section/g) || []).length;
      if (sectionCount >= 3) {
        console.log(`  ✅ ${page} - ${sectionCount} sections`);
        passed++;
      } else {
        console.log(`  ❌ ${page} - Only ${sectionCount} sections`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ ${page} - Error: ${e.message}`);
      failed++;
    }
  }

  // Test 3: Homepage has version badge
  console.log('\n📋 Test 3: Homepage has version badge');
  try {
    const res = await fetch(BASE_URL);
    if (res.body.includes('v0.1.')) {
      console.log('  ✅ Version badge found');
      passed++;
    } else {
      console.log('  ❌ Version badge not found');
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 4: CLI page has /om command
  console.log('\n📋 Test 4: CLI page has /om command');
  try {
    const res = await fetch(BASE_URL + '/docs/cli/');
    if (res.body.includes('/om</code>') || res.body.includes('<code>/om</code>')) {
      console.log('  ✅ /om command found');
      passed++;
    } else {
      console.log('  ❌ /om command not found');
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

runTests();