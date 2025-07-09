module.exports = async (page, scenario, vp) => {
  console.log('🔄 Handling lazy loading and page readiness...');
  
  // Wait for initial page load using a delay function
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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
  
  // Check for any remaining loading indicators
  await page.evaluate(() => {
    const loadingElements = document.querySelectorAll('.loading, .spinner, [data-testid="loading"]');
    loadingElements.forEach(el => el.remove());
  });
  
  console.log('✅ Page is ready for screenshot');
}; 