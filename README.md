# Visual Regression Engine

A simple and powerful visual regression testing tool built with BackstopJS that compares websites visually to detect changes. Perfect for quick sanity checks and ensuring visual consistency across deployments.

## Features

- ✅ **Quick Setup**: Simple command-line interface
- 🎯 **Configurable Threshold**: Set similarity threshold (default: 0.4 for balanced comparison)
- 🚫 **Smart Filtering**: Automatically ignores .gif images and loading indicators
- 📱 **Desktop Testing**: Optimized for 1980x1080 desktop viewport
- 🔄 **Lazy Loading Support**: Handles lazy-loaded content with intelligent scrolling
- 🗺️ **Sitemap Ready**: Extensible architecture for future sitemap crawling
- 📊 **Detailed Reports**: Visual HTML reports with side-by-side comparisons
- 🍪 **Custom Cookies**: Pass custom cookies to handle authentication
- 💾 **LocalStorage Support**: Set localStorage values for consent bypassing

## Usage

### Quick Start with npx

Run directly without installation:

```bash
npx vrengine -r "https://example.com" -t "https://staging.example.com"
```

### Basic Usage

Compare a single test URL against a reference URL:

```bash
npx vrengine -r "https://example.com" -t "https://staging.example.com"
```

### Multiple Test URLs

Compare multiple test URLs against a reference URL:

```bash
npx vrengine -r "https://example.com" -t "https://staging.example.com,https://dev.example.com"
```

### With Sitemap Crawling

Crawl a sitemap to automatically discover URLs for testing. The sitemap can be from either the reference or test domain:

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --sitemap "https://staging.example.com/sitemap.xml"
```

### With Reference Domain Sitemap

Use a sitemap from the reference domain:

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --sitemap "https://example.com/sitemap.xml"
```

### With URL Filtering

Filter URLs from sitemaps using patterns:

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --sitemap "https://staging.example.com/sitemap.xml" \
  --sitemap-filter "/admin,/api,/private"
```

### With Custom URL Mapping

Map specific reference URLs to test URLs:

```bash
npx vrengine \
  --url-mapping "https://example.com/home:https://staging.example.com/home,https://example.com/about:https://staging.example.com/about"
```

### With Sitemap Limits

Limit the number of URLs crawled from sitemaps:

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --sitemap "https://staging.example.com/sitemap.xml" \
  --sitemap-limit 20
```

### With Custom Cookies

Pass custom cookies to handle authentication or consent:

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --cookies "session_token=abc123;user_preference=accepted"
```

### With Custom LocalStorage

Set localStorage values for consent management:

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --localStorage "consent_given=true;user_id=12345"
```

### Complete Example with All Options

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --sitemap "https://staging.example.com/sitemap.xml" \
  --sitemap-filter "/admin,/api" \
  --sitemap-limit 30 \
  --threshold 0.3 \
  --label "Full Site Test" \
  --delay 5000 \
  --cookies "session=abc123;consent=accepted" \
  --localStorage "feature_flag=enabled;theme=dark" \
  --debug
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-r, --reference <url>` | Reference URL (required) | - |
| `-t, --test <urls>` | Test URL(s) - comma separated | - |
| `-s, --sitemap <url>` | Sitemap URL for crawling URLs (from either reference or test domain) | - |
| `--url-mapping <mapping>` | Custom URL mapping (ref1:test1,ref2:test2) | - |
| `--sitemap-filter <patterns>` | Patterns to exclude from sitemap URLs | - |
| `--sitemap-limit <number>` | Maximum URLs to crawl from sitemaps | 50 |
| `--threshold <number>` | Similarity threshold (0-1) | 0.4 |
| `--label <string>` | Test label/name | "Visual Regression Test" |
| `--delay <number>` | Delay before screenshot (ms) | 3000 |
| `--cookies <string>` | Custom cookies (name1=value1;name2=value2) | - |
| `--localStorage <string>` | Custom localStorage (key1=value1;key2=value2) | - |
| `--debug` | Enable debug mode | false |

## Available Scripts

```bash
# Run visual regression test
npx vrengine -r <reference-url> -t <test-url>

# Take reference screenshots only
npm run reference

# Run test against existing references
npm run test

# Approve changes (if differences are expected)
npm run approve

# Open test report in browser
npm run openReport
```

## How It Works

1. **Setup**: Configures BackstopJS with your URLs and settings
2. **Authentication**: Applies custom cookies and localStorage values
3. **Reference**: Takes screenshots of the reference URL
4. **Test**: Takes screenshots of test URL(s) and compares them
5. **Report**: Generates detailed HTML reports showing differences

### Custom Authentication

The tool supports multiple authentication methods:

#### HTTP Authentication
```bash
npx vrengine -r "https://example.com" -t "https://user:pass@staging.example.com"
```

#### Cookie-based Authentication
```bash
npx vrengine --cookies "auth_token=abc123;session_id=xyz789"
```

#### LocalStorage-based Consent
```bash
npx vrengine --localStorage "consent_accepted=true;gdpr_consent=1"
```

### Lazy Loading Handling

The tool automatically handles lazy-loaded content by:

- Slowly scrolling through the entire page
- Waiting for new content to load during scrolling
- Ensuring all images and components are loaded before taking screenshots
- Scrolling back to the top for consistent screenshot positioning

### Smart Filtering

The tool automatically:

- 🚫 Ignores `.gif` images and OneTrust consent banners
- 🎭 Hides loading indicators, spinners, and notifications
- 🎨 Disables animations for consistent screenshots
- 🍪 Handles cookie banners and consent notices

## Configuration

The tool generates a BackstopJS configuration automatically, but you can customize:

### Threshold Settings

- `0.1` - Very strict (catches small changes)
- `0.4` - Balanced (default, good for most use cases)
- `0.7` - Relaxed (only major changes)

### Viewport

Currently optimized for desktop (1980x1080), but can be extended for mobile testing.

## Directory Structure

```
visual-regression/
├── backstop_data/
│   ├── bitmaps_reference/     # Reference screenshots
│   ├── bitmaps_test/          # Test screenshots
│   ├── html_report/           # HTML reports
│   └── engine_scripts/
│       └── puppet/
│           ├── onBefore.js    # Pre-test setup
│           └── onReady.js     # Lazy loading handler
├── src/
│   ├── test-runner.js         # Test execution logic
│   └── url-manager.js         # URL parsing and sitemap handling
├── index.js                   # Main application
└── package.json
```

## Real-World Examples

### Full Site Testing with Sitemaps

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --sitemap "https://staging.example.com/sitemap.xml" \
  --sitemap-filter "/admin,/api,/private,/temp" \
  --sitemap-limit 100 \
  --threshold 0.3
```

### E-commerce with Authentication

```bash
npx vrengine \
  -r "https://shop.example.com" \
  -t "https://staging.shop.example.com" \
  --sitemap "https://staging.shop.example.com/sitemap.xml" \
  --cookies "user_session=abc123;cart_id=xyz789" \
  --localStorage "user_preferences=dark_mode;currency=USD" \
  --threshold 0.3
```

### Blog Testing with Custom Mapping

```bash
npx vrengine \
  --url-mapping "https://blog.example.com/home:https://staging.blog.example.com/home,https://blog.example.com/about:https://staging.blog.example.com/about,https://blog.example.com/contact:https://staging.blog.example.com/contact" \
  --cookies "user_preference=accepted" \
  --threshold 0.4
```

### GDPR Compliance Testing

```bash
npx vrengine \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --sitemap "https://staging.example.com/sitemap.xml" \
  --cookies "gdpr_consent=accepted;analytics_consent=true" \
  --localStorage "consent_timestamp=2024-01-01T00:00:00Z"
```

### Multi-page with Different Auth

```bash
npx vrengine \
  -r "https://app.example.com/dashboard" \
  -t "https://staging.app.example.com/dashboard" \
  --cookies "jwt_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  --localStorage "feature_flags=newUI,betaFeatures"
```

## Sitemap Crawling Features

The tool now supports advanced sitemap crawling capabilities:

### Smart Domain Detection
- Automatically detects whether sitemap URLs are from reference or test domain
- Creates corresponding URL pairs by replacing domains appropriately
- Supports sitemaps from either reference or test domains
- **Preserves HTTP authentication credentials** when creating URL pairs

### Auto-Discovery
- Automatically finds sitemaps at common locations (`/sitemap.xml`, `/sitemap_index.xml`, etc.)
- Checks `robots.txt` for sitemap declarations
- Supports WordPress sitemaps (`/wp-sitemap.xml`)

### URL Filtering
- Exclude URLs matching specific patterns (e.g., `/admin`, `/api`, `/private`)
- Limit the number of URLs crawled to control test execution time
- Remove duplicate URLs automatically

### Multiple Sitemap Support
- Handle sitemap index files that reference multiple sitemaps
- Support for nested sitemap structures
- Crawl sitemaps from any domain and create proper URL pairs

### Custom URL Mapping
- Map specific reference URLs to test URLs
- Useful for testing different environments with different URL structures
- Bypass automatic URL discovery for precise control

### HTTP Authentication Support
- Automatically preserves authentication credentials from test URLs
- Supports both username:password@domain and cookie-based authentication
- Works seamlessly with sitemap crawling

## Future Enhancements

The codebase is designed to be extensible:

### Enhanced Sitemap Features
- Auto-discovery of sitemaps from domain root
- Support for RSS feeds as URL sources
- Integration with Google Search Console API
- Custom sitemap format support

### Mobile Testing

Easy to extend for mobile viewports:

```javascript
// In backstop config
viewports: [
  { label: 'desktop', width: 1980, height: 1080 },
  { label: 'mobile', width: 375, height: 667 }
]
```

## Troubleshooting

### Common Issues

1. **Network Timeout**: Increase `--delay` for slow-loading sites
2. **Too Many Differences**: Adjust `--threshold` to be more lenient
3. **Missing Content**: Check console for blocked resources or increase delay
4. **Authentication Issues**: Verify cookie/localStorage format and values

### Debug Mode

Use `--debug` flag to see:
- Generated BackstopJS configuration
- Cookie and localStorage values being set
- Detailed error messages
- Console logs from page interactions

### Cookie/LocalStorage Format

Both cookies and localStorage use the same format:
```
key1=value1;key2=value2;key3=value3
```

**Important**: Values containing semicolons or equals signs need to be URL-encoded.

### Viewing Reports

After running tests, open the HTML report:

```bash
npm run openReport
```

The report shows:
- Side-by-side comparisons
- Highlighted differences
- Similarity percentages
- Option to approve changes

## Contributing

Feel free to extend the tool with additional features:

- Mobile viewport support
- Custom selector testing
- Performance metrics
- Integration with CI/CD pipelines

## License

ISC License - See package.json for details. 