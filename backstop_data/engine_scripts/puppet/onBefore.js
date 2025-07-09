module.exports = async (page, scenario, vp) => {
  console.log('🔧 Setting up page environment...');
  
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
  
  // Block certain resource types to speed up loading
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    const url = request.url();
    
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
  
  // Set cookies if needed (with try-catch to handle domain issues)
  try {
    const cookies = [
      {
        name: 'consent',
        value: 'accepted',
        domain: new URL(scenario.url).hostname
      }
    ];
    
    await page.setCookie(...cookies);
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
      [data-testid="loading"],
      .loading,
      .spinner,
      img[src*=".gif"] {
        display: none !important;
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