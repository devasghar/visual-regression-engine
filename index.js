#!/usr/bin/env node

const { program } = require('commander');
const { spawn } = require('child_process');
const TestRunner = require('./src/test-runner');
const UrlManager = require('./src/url-manager');

program
  .version('1.0.8')
  .description('Visual Regression Testing Tool using BackstopJS')
  .option('-r, --reference <url>', 'Reference URL')
  .option('-t, --test <urls>', 'Test URL(s) - comma separated for multiple URLs')
  .option('-s, --sitemap <url>', 'Sitemap URL for crawling URLs (from either reference or test domain)')
  .option('--sitemap-filter <patterns>', 'Comma-separated patterns to exclude from sitemap URLs (e.g., /admin,/api)')
  .option('--sitemap-limit <number>', 'Maximum number of URLs to crawl from sitemap', '50')
  .option('--url-mapping <mapping>', 'Custom URL mapping (reference1:test1,reference2:test2)')
  .option('--threshold <number>', 'Similarity threshold (0-1)', '0.4')
  .option('--label <string>', 'Test label/name', 'Visual Regression Test')
  .option('--delay <number>', 'Delay before screenshot (ms)', '3000')
  .option('--cookies <string>', 'Custom cookies (name1=value1;name2=value2)')
  .option('--localStorage <string>', 'Custom localStorage (key1=value1;key2=value2)')
  .option('--open-report', 'Open the HTML report in browser')
  .option('--debug', 'Enable debug mode')
  .parse();

const options = program.opts();

async function main() {
  try {
    // Handle open report option
    if (options.openReport) {
      console.log('📖 Opening HTML report...');
      const backstopProcess = spawn('npx', ['backstop', 'openReport'], { stdio: 'inherit' });
      
      backstopProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ Failed to open report. Make sure you have run tests first.');
          process.exit(1);
        }
      });
      
      backstopProcess.on('error', (error) => {
        console.error('❌ Error opening report:', error.message);
        process.exit(1);
      });
      
      return;
    }

    // Validate required options for testing
    if (!options.reference || !options.test) {
      console.error('❌ Error: Both --reference and --test options are required for running tests.');
      console.log('💡 Use --open-report to open the HTML report without running tests.');
      process.exit(1);
    }
    
    console.log('🚀 Starting Visual Regression Testing...');
    console.log(`📋 Reference URL: ${options.reference}`);
    console.log(`🎯 Test URL(s): ${options.test}`);
    console.log(`📊 Threshold: ${options.threshold}`);
    
    if (options.cookies) {
      console.log(`🍪 Custom cookies: ${options.cookies}`);
    }
    
    if (options.localStorage) {
      console.log(`💾 Custom localStorage: ${options.localStorage}`);
    }
    
    // Parse test URLs
    let testUrls = UrlManager.parseUrls(options.test);
    let referenceUrls = [options.reference];
    
    // Handle custom URL mapping
    if (options.urlMapping) {
      console.log('🔗 Using custom URL mapping...');
      const mappings = options.urlMapping.split(',').map(m => m.trim());
      const urlPairs = [];
      
      for (const mapping of mappings) {
        const [referenceUrl, testUrl] = mapping.split(':').map(url => url.trim());
        if (referenceUrl && testUrl) {
          urlPairs.push({
            reference: referenceUrl.startsWith('http') ? referenceUrl : `https://${referenceUrl}`,
            test: testUrl.startsWith('http') ? testUrl : `https://${testUrl}`
          });
        }
      }
      
      if (urlPairs.length > 0) {
        console.log(`✅ Created ${urlPairs.length} URL pairs from mapping`);
        // Initialize test runner with URL pairs
        const testRunner = new TestRunner({
          urlPairs: urlPairs,
          threshold: parseFloat(options.threshold),
          label: options.label,
          delay: parseInt(options.delay),
          cookies: options.cookies,
          localStorage: options.localStorage,
          debug: options.debug
        });
        
        await testRunner.runTests();
        console.log('✅ Visual regression testing completed!');
        console.log('📖 Run "npm run openReport" to view results');
        return;
      }
    }
    
    // Handle sitemap crawling
    if (options.sitemap) {
      console.log(`🗺️  Crawling sitemap: ${options.sitemap}`);
      const sitemapUrls = await UrlManager.crawlSitemap(options.sitemap);
      
      if (sitemapUrls.length > 0) {
        // Filter sitemap URLs if patterns are provided
        let filteredSitemapUrls = sitemapUrls;
        if (options.sitemapFilter) {
          const excludePatterns = options.sitemapFilter.split(',').map(p => p.trim());
          filteredSitemapUrls = UrlManager.filterUrls(sitemapUrls, excludePatterns);
          console.log(`🔍 Filtered URLs from ${sitemapUrls.length} to ${filteredSitemapUrls.length} using patterns: ${excludePatterns.join(', ')}`);
        }
        
        // Limit the number of URLs if specified
        const limit = parseInt(options.sitemapLimit);
        if (filteredSitemapUrls.length > limit) {
          console.log(`📊 Limiting URLs from ${filteredSitemapUrls.length} to ${limit}`);
          filteredSitemapUrls = filteredSitemapUrls.slice(0, limit);
        }
        
        // Determine if sitemap is from reference or test domain
        const sitemapUrlObj = new URL(options.sitemap);
        const referenceUrlObj = new URL(options.reference);
        const testUrlObj = new URL(testUrls[0]);
        
        // Extract authentication credentials from test URL if present
        let testUrlAuth = '';
        if (testUrlObj.username || testUrlObj.password) {
          testUrlAuth = `${testUrlObj.username}${testUrlObj.password ? ':' + testUrlObj.password : ''}@`;
          if (options.debug) {
            console.log(`🔐 Found authentication credentials: ${testUrlAuth.replace(/@$/, '')}`);
          }
        }
        
        const sitemapUrlPairs = [];
        
        for (const sitemapUrl of filteredSitemapUrls) {
          try {
            const currentSitemapUrlObj = new URL(sitemapUrl);
            
            // Check if sitemap is from reference domain
            if (currentSitemapUrlObj.hostname === referenceUrlObj.hostname) {
              // Sitemap URLs are from reference domain, create corresponding test URLs
              // Preserve authentication credentials from original test URL
              const testDomain = testUrlObj.protocol + '//' + testUrlAuth + testUrlObj.hostname + (testUrlObj.port ? ':' + testUrlObj.port : '');
              const correspondingTestUrl = sitemapUrl.replace(referenceUrlObj.origin, testDomain);
              sitemapUrlPairs.push({
                reference: sitemapUrl,
                test: correspondingTestUrl
              });
            } else if (currentSitemapUrlObj.hostname === testUrlObj.hostname) {
              // Sitemap URLs are from test domain, create corresponding reference URLs
              const correspondingReferenceUrl = sitemapUrl.replace(testUrlObj.origin, referenceUrlObj.origin);
              sitemapUrlPairs.push({
                reference: correspondingReferenceUrl,
                test: sitemapUrl
              });
            } else {
              // Sitemap URLs are from a different domain, assume they're test URLs
              // Preserve authentication credentials from original test URL
              const testDomain = testUrlObj.protocol + '//' + testUrlAuth + testUrlObj.hostname + (testUrlObj.port ? ':' + testUrlObj.port : '');
              const correspondingReferenceUrl = sitemapUrl.replace(currentSitemapUrlObj.origin, referenceUrlObj.origin);
              sitemapUrlPairs.push({
                reference: correspondingReferenceUrl,
                test: sitemapUrl
              });
            }
          } catch (error) {
            console.warn(`⚠️  Skipping invalid sitemap URL: ${sitemapUrl}`);
          }
        }
        
        console.log(`✅ Created ${sitemapUrlPairs.length} URL pairs from sitemap`);
        
        // Debug output to show URL pairs
        if (options.debug) {
          console.log('🔍 URL pairs created:');
          sitemapUrlPairs.forEach((pair, index) => {
            console.log(`  ${index + 1}. ${pair.reference} vs ${pair.test}`);
          });
        }
        
        // Add sitemap URL pairs to the main URL pairs list
        if (sitemapUrlPairs.length > 0) {
          // Initialize test runner with sitemap URL pairs
          const testRunner = new TestRunner({
            urlPairs: sitemapUrlPairs,
            threshold: parseFloat(options.threshold),
            label: options.label,
            delay: parseInt(options.delay),
            cookies: options.cookies,
            localStorage: options.localStorage,
            debug: options.debug
          });
          
          await testRunner.runTests();
          console.log('✅ Visual regression testing completed!');
          console.log('📖 Run "npm run openReport" to view results');
          return;
        }
      } else {
        console.log('⚠️  No URLs found in sitemap');
      }
    }
    
    // Remove duplicates
    testUrls = [...new Set(testUrls)];
    referenceUrls = [...new Set(referenceUrls)];
    
    if (testUrls.length === 0) {
      throw new Error('No URLs to test. Please provide test URLs or a valid sitemap.');
    }
    
    console.log(`📋 Total reference URLs: ${referenceUrls.length}`);
    console.log(`📋 Total test URLs: ${testUrls.length}`);
    
    // Create URL pairs for testing (only for non-sitemap URLs)
    const urlPairs = [];
    
    // If we have multiple reference URLs, match them with test URLs
    if (referenceUrls.length > 1 && testUrls.length > 1) {
      // Match reference URLs with test URLs by index
      const maxPairs = Math.min(referenceUrls.length, testUrls.length);
      for (let i = 0; i < maxPairs; i++) {
        urlPairs.push({
          reference: referenceUrls[i],
          test: testUrls[i]
        });
      }
      console.log(`🔗 Created ${urlPairs.length} URL pairs for testing`);
    } else {
      // Use single reference URL for all test URLs
      for (const testUrl of testUrls) {
        urlPairs.push({
          reference: referenceUrls[0],
          test: testUrl
        });
      }
      console.log(`🔗 Created ${urlPairs.length} URL pairs using single reference URL`);
    }
    
    // Initialize test runner with URL pairs
    const testRunner = new TestRunner({
      urlPairs: urlPairs,
      threshold: parseFloat(options.threshold),
      label: options.label,
      delay: parseInt(options.delay),
      cookies: options.cookies,
      localStorage: options.localStorage,
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