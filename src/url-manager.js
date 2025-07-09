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
   * Future enhancement: Crawl sitemap for URLs
   * @param {string} sitemapUrl - URL to sitemap.xml
   * @returns {Promise<Array<string>>} Array of URLs from sitemap
   */
  static async crawlSitemap(sitemapUrl) {
    try {
      console.log(`🗺️  Crawling sitemap: ${sitemapUrl}`);
      
      const xmlData = await this.fetchXmlData(sitemapUrl);
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const urls = [];
      
      // Handle regular sitemap
      if (result.urlset && result.urlset.url) {
        result.urlset.url.forEach(urlEntry => {
          if (urlEntry.loc && urlEntry.loc[0]) {
            urls.push(urlEntry.loc[0]);
          }
        });
      }
      
      // Handle sitemap index
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        for (const sitemap of result.sitemapindex.sitemap) {
          if (sitemap.loc && sitemap.loc[0]) {
            const childUrls = await this.crawlSitemap(sitemap.loc[0]);
            urls.push(...childUrls);
          }
        }
      }
      
      console.log(`📋 Found ${urls.length} URLs in sitemap`);
      return urls;
      
    } catch (error) {
      console.error('❌ Error crawling sitemap:', error.message);
      return [];
    }
  }

  /**
   * Fetch XML data from URL
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} XML data as string
   */
  static async fetchXmlData(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const request = client.request(url, (response) => {
        let data = '';
        
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