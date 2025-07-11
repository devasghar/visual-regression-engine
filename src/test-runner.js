const backstop = require('backstopjs');
const fs = require('fs').promises;
const path = require('path');

class TestRunner {
  constructor(options) {
    this.urlPairs = options.urlPairs || [];
    this.threshold = options.threshold;
    this.label = options.label;
    this.delay = options.delay;
    this.cookies = options.cookies;
    this.localStorage = options.localStorage;
    this.debug = options.debug;
    this.configPath = path.join(__dirname, '..', 'backstop.json');
    
    // Get absolute paths for engine scripts
    this.engineScriptsPath = path.join(__dirname, '..', 'backstop_data', 'engine_scripts');
    this.onBeforeScript = path.join(this.engineScriptsPath, 'puppet', 'onBefore.js');
    this.onReadyScript = path.join(this.engineScriptsPath, 'puppet', 'onReady.js');
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
    
    // Create scenarios for each URL pair
    this.urlPairs.forEach((urlPair, index) => {
      const scenario = {
        label: `${this.label} - ${urlPair.test} vs ${urlPair.reference}`,
        url: urlPair.test,
        referenceUrl: urlPair.reference,
        delay: this.delay,
        removeSelectors: [
          'img[src*=".gif"]', // Ignore .gif images to prevent false positives
          '.onetrust-consent-sdk', // Ignore OneTrust consent banners
          '.ot-sdk-container',
          '.optanon-alert-box-wrapper',
          '.optanon-alert-box-bottom',
          '.optanon-alert-box-top',
          '.ot-fade-in',
          '.ot-banner',
          '.ot-pc-footer',
          '.ot-pc-header',
          '.ot-pc-content',
          '.ot-close-icon',
          '.ot-btn-container',
          '.ot-floating-button',
          '.ot-sdk-show-settings',
          '.ot-pc-sdk',
          '.ot-overlay',
          '#onetrust-consent-sdk',
          '#optanon-popup-wrapper',
          '#optanon-popup-bg',
          '#optanon-popup-bottom',
          '#optanon',
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
        onBeforeScript: this.onBeforeScript,
        onReadyScript: this.onReadyScript,
        readyEvent: null,
        readySelector: null,
        cookiePath: path.join(this.engineScriptsPath, 'cookies.json'),
        postInteractionWait: 0,
        selectors: ['document'],
        selectorExpansion: true,
        expect: 0,
        misMatchThreshold: this.threshold,
        requireSameDimensions: false
      };
      
      // Add custom cookies and localStorage if provided
      if (this.cookies || this.localStorage) {
        scenario.customOptions = {
          cookies: this.cookies,
          localStorage: this.localStorage
        };
      }
      
      scenarios.push(scenario);
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
      onBeforeScript: this.onBeforeScript,
      onReadyScript: this.onReadyScript,
      scenarios: scenarios,
      paths: {
        bitmaps_reference: path.join(__dirname, '..', 'backstop_data', 'bitmaps_reference'),
        bitmaps_test: path.join(__dirname, '..', 'backstop_data', 'bitmaps_test'),
        engine_scripts: this.engineScriptsPath,
        html_report: path.join(__dirname, '..', 'backstop_data', 'html_report'),
        ci_report: path.join(__dirname, '..', 'backstop_data', 'ci_report')
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