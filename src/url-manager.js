const xml2js = require('xml2js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class UrlManager {
  /**
   * Parse comma-separated URLs from command line input
   * @param {string} urlString - Comma-separated URLs
   * @returns {Array<string>} Array of cleaned URLs
   */
  static parseUrls(urlString) {
    if (!urlString) return [];
    
    return urlString
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map(url => {
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${url}`;
        }
        return url;
      });
  }

  /**
   * Validate if a URL is accessible
   * @param {string} url - URL to validate
   * @returns {Promise<boolean>} True if URL is accessible
   */
  static async validateUrl(url) {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      return new Promise((resolve) => {
        const request = client.request({
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname + urlObj.search,
          method: 'HEAD',
          timeout: 10000
        }, (response) => {
          resolve(response.statusCode >= 200 && response.statusCode < 400);
        });
        
        request.on('error', () => resolve(false));
        request.on('timeout', () => resolve(false));
        request.end();
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-discover sitemap URLs from a domain
   * @param {string} baseUrl - Base URL of the website
   * @returns {Promise<Array<string>>} Array of potential sitemap URLs
   */
  static async discoverSitemaps(baseUrl) {
    try {
      const urlObj = new URL(baseUrl);
      const baseUrlClean = `${urlObj.protocol}//${urlObj.hostname}`;
      
      const potentialSitemaps = [
        `${baseUrlClean}/sitemap.xml`,
        `${baseUrlClean}/sitemap_index.xml`,
        `${baseUrlClean}/sitemaps.xml`,
        `${baseUrlClean}/sitemap1.xml`,
        `${baseUrlClean}/wp-sitemap.xml`, // WordPress
        `${baseUrlClean}/sitemap-index.xml`
      ];
      
      console.log('🔍 Auto-discovering sitemaps...');
      const validSitemaps = [];
      
      for (const sitemapUrl of potentialSitemaps) {
        const isValid = await this.validateUrl(sitemapUrl);
        if (isValid) {
          console.log(`✅ Found sitemap: ${sitemapUrl}`);
          validSitemaps.push(sitemapUrl);
        }
      }
      
      // Also check robots.txt for sitemap declarations
      try {
        const robotsTxtUrl = `${baseUrlClean}/robots.txt`;
        const robotsTxtContent = await this.fetchXmlData(robotsTxtUrl);
        const sitemapMatches = robotsTxtContent.match(/Sitemap:\s*(https?:\/\/[^\s]+)/gi);
        
        if (sitemapMatches) {
          for (const match of sitemapMatches) {
            const sitemapUrl = match.replace(/^Sitemap:\s*/i, '').trim();
            if (!validSitemaps.includes(sitemapUrl)) {
              const isValid = await this.validateUrl(sitemapUrl);
              if (isValid) {
                console.log(`✅ Found sitemap in robots.txt: ${sitemapUrl}`);
                validSitemaps.push(sitemapUrl);
              }
            }
          }
        }
      } catch (error) {
        // robots.txt not found or not accessible, continue
      }
      
      return validSitemaps;
    } catch (error) {
      console.error('❌ Error discovering sitemaps:', error.message);
      return [];
    }
  }

  /**
   * Crawl multiple sitemaps and combine results
   * @param {Array<string>} sitemapUrls - Array of sitemap URLs
   * @returns {Promise<Array<string>>} Combined array of URLs from all sitemaps
   */
  static async crawlMultipleSitemaps(sitemapUrls) {
    const allUrls = [];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const urls = await this.crawlSitemap(sitemapUrl);
        allUrls.push(...urls);
      } catch (error) {
        console.error(`❌ Error crawling sitemap ${sitemapUrl}:`, error.message);
      }
    }
    
    // Remove duplicates
    return [...new Set(allUrls)];
  }

  /**
   * Enhanced sitemap crawling with better error handling and timeout
   * @param {string} sitemapUrl - URL to sitemap.xml
   * @returns {Promise<Array<string>>} Array of URLs from sitemap
   */
  static async crawlSitemap(sitemapUrl) {
    try {
      console.log(`🗺️  Crawling sitemap: ${sitemapUrl}`);
      
      const xmlData = await this.fetchXmlData(sitemapUrl);
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        ignoreAttrs: true,
        trim: true
      });
      const result = await parser.parseStringPromise(xmlData);
      
      const urls = [];
      
      // Handle regular sitemap
      if (result.urlset && result.urlset.url) {
        const urlEntries = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
        urlEntries.forEach(urlEntry => {
          if (urlEntry.loc) {
            urls.push(urlEntry.loc);
          }
        });
      }
      
      // Handle sitemap index
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        const sitemapEntries = Array.isArray(result.sitemapindex.sitemap) ? result.sitemapindex.sitemap : [result.sitemapindex.sitemap];
        for (const sitemap of sitemapEntries) {
          if (sitemap.loc) {
            try {
              const childUrls = await this.crawlSitemap(sitemap.loc);
              urls.push(...childUrls);
            } catch (error) {
              console.error(`❌ Error crawling child sitemap ${sitemap.loc}:`, error.message);
            }
          }
        }
      }
      
      console.log(`📋 Found ${urls.length} URLs in sitemap: ${sitemapUrl}`);
      return urls;
      
    } catch (error) {
      console.error(`❌ Error crawling sitemap ${sitemapUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch XML data from URL with timeout and better error handling
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} XML data as string
   */
  static async fetchXmlData(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const request = client.request(url, {
        timeout: 15000, // 15 second timeout
        headers: {
          'User-Agent': 'VREngine/1.0 (Visual Regression Engine)'
        }
      }, (response) => {
        let data = '';
        
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return this.fetchXmlData(response.headers.location).then(resolve).catch(reject);
        }
        
        if (response.statusCode < 200 || response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          resolve(data);
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
      
      request.end();
    });
  }

  /**
   * Filter URLs based on patterns (useful for excluding certain paths)
   * @param {Array<string>} urls - Array of URLs to filter
   * @param {Array<string>} excludePatterns - Patterns to exclude
   * @returns {Array<string>} Filtered URLs
   */
  static filterUrls(urls, excludePatterns = []) {
    return urls.filter(url => {
      return !excludePatterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(url);
      });
    });
  }

  /**
   * Group URLs by domain (useful for batch processing)
   * @param {Array<string>} urls - Array of URLs
   * @returns {Object} URLs grouped by domain
   */
  static groupUrlsByDomain(urls) {
    const groups = {};
    
    urls.forEach(url => {
      try {
        const domain = new URL(url).hostname;
        if (!groups[domain]) {
          groups[domain] = [];
        }
        groups[domain].push(url);
      } catch (error) {
        console.warn(`⚠️  Invalid URL: ${url}`);
      }
    });
    
    return groups;
  }
}

module.exports = UrlManager; 