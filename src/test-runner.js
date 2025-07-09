const backstop = require('backstopjs');
const fs = require('fs').promises;
const path = require('path');

class TestRunner {
  constructor(options) {
    this.referenceUrl = options.referenceUrl;
    this.testUrls = options.testUrls;
    this.threshold = options.threshold;
    this.label = options.label;
    this.delay = options.delay;
    this.debug = options.debug;
    this.configPath = path.join(__dirname, '..', 'backstop.json');
  }

  async runTests() {
    try {
      // Generate BackstopJS configuration
      const config = this.generateBackstopConfig();
      
      // Write configuration to file
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      
      if (this.debug) {
        console.log('📝 Generated BackstopJS configuration:', JSON.stringify(config, null, 2));
      }
      
      console.log('📸 Taking reference screenshots...');
      await backstop('reference', { config: this.configPath });
      
      console.log('🔍 Running visual regression tests...');
      await backstop('test', { config: this.configPath });
      
      console.log('✅ Tests completed successfully!');
      
    } catch (error) {
      if (error.message && error.message.includes('Mismatch errors found')) {
        console.log('⚠️  Visual differences detected. Review the report.');
        console.log('💡 Use "npm run approve" to approve changes if they are expected.');
      } else {
        throw error;
      }
    }
  }

  generateBackstopConfig() {
    const scenarios = [];
    
    // Create scenarios for each test URL
    this.testUrls.forEach((testUrl, index) => {
      scenarios.push({
        label: `${this.label} - ${testUrl}`,
        url: testUrl,
        referenceUrl: this.referenceUrl,
        delay: this.delay,
        removeSelectors: [
          'img[src*=".gif"]', // Ignore .gif images to prevent false positives
          '.onetrust-consent-sdk', // Ignore OneTrust consent banners
          '[data-testid="loading"]',
          '.loading',
          '.spinner'
        ],
        hideSelectors: [
          '.cookie-banner',
          '.notification',
          '.toast'
        ],
        misMatchThreshold: this.threshold,
        requireSameDimensions: false, // Allow position mismatches
        onBeforeScript: 'puppet/onBefore.js',
        onReadyScript: 'puppet/onReady.js',
        readyEvent: null,
        readySelector: null,
        cookiePath: 'backstop_data/engine_scripts/cookies.json',
        postInteractionWait: 0,
        selectors: ['document'],
        selectorExpansion: true,
        expect: 0,
        misMatchThreshold: this.threshold,
        requireSameDimensions: false
      });
    });

    return {
      id: 'visual-regression-test',
      viewports: [
        {
          label: 'desktop',
          width: 1980,
          height: 1080
        }
      ],
      onBeforeScript: 'puppet/onBefore.js',
      onReadyScript: 'puppet/onReady.js',
      scenarios: scenarios,
      paths: {
        bitmaps_reference: 'backstop_data/bitmaps_reference',
        bitmaps_test: 'backstop_data/bitmaps_test',
        engine_scripts: 'backstop_data/engine_scripts',
        html_report: 'backstop_data/html_report',
        ci_report: 'backstop_data/ci_report'
      },
      report: ['browser'],
      engine: 'puppeteer',
      engineOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      asyncCaptureLimit: 5,
      asyncCompareLimit: 50,
      debug: this.debug,
      debugWindow: false,
      resembleOutputOptions: {
        errorColor: {
          red: 255,
          green: 0,
          blue: 255
        },
        errorType: 'movement', // More tolerant of positional differences
        transparency: 0.5, // Increased transparency for better visual comparison
        largeImageThreshold: 1200,
        useCrossOrigin: false,
        outputDiff: true,
        scaleToSameSize: true, // Scale images to same size for better comparison
        ignore: 'antialiasing' // Ignore antialiasing differences
      }
    };
  }
}

module.exports = TestRunner; 