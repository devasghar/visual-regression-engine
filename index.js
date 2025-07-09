#!/usr/bin/env node

const { program } = require('commander');
const TestRunner = require('./src/test-runner');
const UrlManager = require('./src/url-manager');

program
  .version('1.0.0')
  .description('Visual Regression Testing Tool using BackstopJS')
  .requiredOption('-r, --reference <url>', 'Reference URL')
  .requiredOption('-t, --test <urls>', 'Test URL(s) - comma separated for multiple URLs')
  .option('-s, --sitemap <url>', 'Sitemap URL (for future crawling functionality)')
  .option('--threshold <number>', 'Similarity threshold (0-1)', '0.4')
  .option('--label <string>', 'Test label/name', 'Visual Regression Test')
  .option('--delay <number>', 'Delay before screenshot (ms)', '3000')
  .option('--debug', 'Enable debug mode')
  .parse();

const options = program.opts();

async function main() {
  try {
    console.log('🚀 Starting Visual Regression Testing...');
    console.log(`📋 Reference URL: ${options.reference}`);
    console.log(`🎯 Test URL(s): ${options.test}`);
    console.log(`📊 Threshold: ${options.threshold}`);
    
    // Parse test URLs
    const testUrls = UrlManager.parseUrls(options.test);
    
    // Future enhancement: Handle sitemap crawling
    if (options.sitemap) {
      console.log('🗺️  Sitemap crawling will be implemented in future version');
      // const sitemapUrls = await UrlManager.crawlSitemap(options.sitemap);
      // testUrls.push(...sitemapUrls);
    }
    
    // Initialize test runner
    const testRunner = new TestRunner({
      referenceUrl: options.reference,
      testUrls: testUrls,
      threshold: parseFloat(options.threshold),
      label: options.label,
      delay: parseInt(options.delay),
      debug: options.debug
    });
    
    // Run the tests
    await testRunner.runTests();
    
    console.log('✅ Visual regression testing completed!');
    console.log('📖 Run "npm run openReport" to view results');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main(); 