module.exports = async (page, scenario, vp) => {
  console.log('🔧 Setting up page environment...');
  
  // Helper function to parse cookie/localStorage strings
  const parseKeyValuePairs = (str) => {
    if (!str) return {};
    
    const pairs = {};
    str.split(';').forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (key && value) {
        pairs[key] = value;
      }
    });
    return pairs;
  };
  
  // Set viewport
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1
  });
  
  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Extract HTTP authentication from URL if present
  const urlObj = new URL(scenario.url);
  if (urlObj.username && urlObj.password) {
    console.log('🔐 HTTP authentication detected in URL');
    
    // Decode URL-encoded password (e.g., %40 becomes @)
    const decodedPassword = decodeURIComponent(urlObj.password);
    
    await page.authenticate({
      username: urlObj.username,
      password: decodedPassword
    });
    
    console.log(`🔐 HTTP authentication configured for user: ${urlObj.username}`);
    
    // Clean the URL for the actual request (remove credentials)
    const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    console.log(`🔗 Clean URL: ${cleanUrl}`);
    
    // Update the scenario URL to the clean version
    scenario.url = cleanUrl;
  }
  
  // Store localStorage data in scenario for use in onReady
  if (scenario.customOptions && scenario.customOptions.localStorage) {
    console.log('💾 LocalStorage data will be set after page load...');
    scenario.localStorageData = parseKeyValuePairs(scenario.customOptions.localStorage);
  }
  
  // Block certain resource types to speed up loading
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    const url = request.url();
    
    // Block OneTrust-related requests
    if (url.includes('onetrust') || url.includes('cookielaw') || url.includes('optanon')) {
      console.log('🚫 Blocking OneTrust request:', url);
      request.abort();
      return;
    }
    
    // Block .gif images as requested
    if (url.includes('.gif')) {
      console.log('🚫 Blocking GIF image:', url);
      request.abort();
      return;
    }
    
    // Block unnecessary resources for faster loading
    if (['font', 'media'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });
  
  // Set default consent cookies
  const defaultCookies = [
    {
      name: 'consent',
      value: 'accepted',
      domain: urlObj.hostname
    },
    {
      name: 'OptanonConsent',
      value: 'accepted',
      domain: urlObj.hostname
    },
    {
      name: 'OptanonAlertBoxClosed',
      value: new Date().toISOString(),
      domain: urlObj.hostname
    }
  ];
  
  // Parse and add custom cookies if provided
  if (scenario.customOptions && scenario.customOptions.cookies) {
    console.log('🍪 Applying custom cookies...');
    const customCookies = parseKeyValuePairs(scenario.customOptions.cookies);
    
    Object.entries(customCookies).forEach(([name, value]) => {
      defaultCookies.push({
        name,
        value,
        domain: urlObj.hostname
      });
      console.log(`🍪 Added custom cookie: ${name}=${value}`);
    });
  }
  
  // Set all cookies
  try {
    await page.setCookie(...defaultCookies);
  } catch (error) {
    console.log('⚠️  Could not set cookies:', error.message);
  }
  
  // Add custom CSS to hide elements that might cause flakiness
  await page.addStyleTag({
    content: `
      /* Hide elements that might cause test flakiness */
      .cookie-banner,
      .notification,
      .toast,
      .onetrust-consent-sdk,
      .ot-sdk-container,
      .optanon-alert-box-wrapper,
      .optanon-alert-box-bottom,
      .optanon-alert-box-top,
      .ot-fade-in,
      .ot-banner,
      .ot-pc-footer,
      .ot-pc-header,
      .ot-pc-content,
      .ot-close-icon,
      .ot-btn-container,
      .ot-floating-button,
      .ot-sdk-show-settings,
      .ot-pc-sdk,
      .ot-overlay,
      #onetrust-consent-sdk,
      #optanon-popup-wrapper,
      #optanon-popup-bg,
      #optanon-popup-bottom,
      #optanon,
      [data-testid="loading"],
      .loading,
      .spinner,
      img[src*=".gif"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* Ensure animations are disabled */
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      
      /* Stabilize text rendering to reduce positional noise */
      * {
        font-feature-settings: normal !important;
        font-kerning: none !important;
        text-rendering: geometricPrecision !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }
    `
  });
  
  console.log('✅ Page environment setup completed');
}; 