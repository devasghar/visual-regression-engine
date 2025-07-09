module.exports = async (page, scenario, vp) => {
  console.log('🔄 Handling lazy loading and page readiness...');
  
  // Wait for initial page load using a delay function
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Set custom localStorage if provided (now that we're on the target domain)
  if (scenario.localStorageData) {
    console.log('💾 Applying custom localStorage...');
    
    try {
      await page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value);
          console.log(`💾 Set localStorage: ${key}=${value}`);
        });
      }, scenario.localStorageData);
      
      console.log('✅ LocalStorage values set successfully');
      
      // Navigate again so the page can read localStorage values and bypass consent
      console.log('🔄 Navigating again to apply localStorage values...');
      await page.goto(scenario.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      console.log('✅ Page reloaded with localStorage values');
      
      // Wait a bit for the page to process localStorage and potentially redirect
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.log('⚠️  Could not set localStorage or navigate:', error.message);
    }
  }
  
  // Function to slowly scroll and handle lazy loading
  const handleLazyLoading = async () => {
    console.log('📜 Starting slow scroll to trigger lazy loading...');
    
    // Get page height
    let pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });
    
    const viewportHeight = vp.height;
    const scrollStep = Math.max(100, viewportHeight / 10); // Scroll in small increments
    let currentPosition = 0;
    
    // Scroll slowly to bottom
    while (currentPosition < pageHeight) {
      await page.evaluate((scrollTo) => {
        window.scrollTo(0, scrollTo);
      }, currentPosition);
      
      currentPosition += scrollStep;
      
      // Wait between scrolls to allow lazy loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if new content has loaded (page height might have changed)
      const newPageHeight = await page.evaluate(() => {
        return Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
      });
      
      if (newPageHeight > pageHeight) {
        console.log('📈 New content detected, adjusting scroll target...');
        pageHeight = newPageHeight;
      }
    }
    
    console.log('🏁 Reached bottom of page');
  };
  
  // Execute lazy loading handling
  await handleLazyLoading();
  
  // Wait for any remaining lazy content to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Wait for page to be ready
  try {
    await page.waitForFunction(() => {
      // Check if there are any pending requests or loading indicators
      return document.readyState === 'complete' && 
             !document.querySelector('.loading, .spinner, [data-testid="loading"]');
    }, { timeout: 10000 });
  } catch (error) {
    console.log('⚠️  Page readiness timeout, proceeding with screenshot...');
  }
  
  // Scroll back to top for consistent screenshots
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  
  // Final wait before screenshot
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Aggressively remove any OneTrust and loading elements
  await page.evaluate(() => {
    // Remove all OneTrust consent elements
    const oneTrustSelectors = [
      '.onetrust-consent-sdk',
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
      '.loading',
      '.spinner',
      '[data-testid="loading"]'
    ];
    
    oneTrustSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        console.log('🗑️  Removing element:', selector);
        el.remove();
      });
    });
    
    // Also remove any elements that might contain 'onetrust' or 'optanon' in their class or id
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const className = el.className || '';
      const id = el.id || '';
      if(typeof className === 'string' && typeof id === 'string') {
        if (className.includes('onetrust') || className.includes('optanon') || 
            id.includes('onetrust') || id.includes('optanon')) {
          console.log('🗑️  Removing OneTrust element:', el.className || el.id);
          el.remove();
        }
      }
    });
  });
  
  console.log('✅ Page is ready for screenshot');
}; 