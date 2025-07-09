# Visual Regression Testing Tool

A simple and powerful visual regression testing tool built with BackstopJS that compares websites visually to detect changes. Perfect for quick sanity checks and ensuring visual consistency across deployments.

## Features

- ✅ **Quick Setup**: Simple command-line interface
- 🎯 **Configurable Threshold**: Set similarity threshold (default: 0.4 for balanced comparison)
- 🚫 **Smart Filtering**: Automatically ignores .gif images and loading indicators
- 📱 **Desktop Testing**: Optimized for 1980x1080 desktop viewport
- 🔄 **Lazy Loading Support**: Handles lazy-loaded content with intelligent scrolling
- 🗺️ **Sitemap Ready**: Extensible architecture for future sitemap crawling
- 📊 **Detailed Reports**: Visual HTML reports with side-by-side comparisons

## Installation

```bash
# Install dependencies
npm install

# Make the script executable (optional)
chmod +x index.js
```

## Usage

### Basic Usage

Compare a single test URL against a reference URL:

```bash
npm start -- -r "https://example.com" -t "https://staging.example.com"
```

### Multiple Test URLs

Compare multiple test URLs against a reference URL:

```bash
npm start -- -r "https://example.com" -t "https://staging.example.com,https://dev.example.com"
```

### Advanced Options

```bash
npm start -- \
  -r "https://example.com" \
  -t "https://staging.example.com" \
  --threshold 0.3 \
  --label "Homepage Test" \
  --delay 5000 \
  --debug
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-r, --reference <url>` | Reference URL (required) | - |
| `-t, --test <urls>` | Test URL(s) - comma separated | - |
| `-s, --sitemap <url>` | Sitemap URL (future feature) | - |
| `--threshold <number>` | Similarity threshold (0-1) | 0.4 |
| `--label <string>` | Test label/name | "Visual Regression Test" |
| `--delay <number>` | Delay before screenshot (ms) | 3000 |
| `--debug` | Enable debug mode | false |

## Available Scripts

```bash
# Run visual regression test
npm start -- -r <reference-url> -t <test-url>

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
2. **Reference**: Takes screenshots of the reference URL
3. **Test**: Takes screenshots of test URL(s) and compares them
4. **Report**: Generates detailed HTML reports showing differences

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

## Future Enhancements

The codebase is designed to be extensible:

### Sitemap Crawling

```javascript
// Future feature - already partially implemented
npm start -- -r "https://example.com" -s "https://example.com/sitemap.xml"
```

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

### Debug Mode

Use `--debug` flag to see:
- Generated BackstopJS configuration
- Detailed error messages
- Console logs from page interactions

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

## Examples

### E-commerce Site Testing

```bash
# Test product pages
npm start -- \
  -r "https://shop.example.com/product/123" \
  -t "https://staging.shop.example.com/product/123" \
  --threshold 0.3 \
  --label "Product Page"
```

### Multi-page Testing

```bash
# Test multiple pages at once
npm start -- \
  -r "https://example.com" \
  -t "https://staging.example.com,https://staging.example.com/about,https://staging.example.com/contact" \
  --threshold 0.4 \
  --label "Multi-page Test"
```

### High-precision Testing

```bash
# Strict comparison for critical pages
npm start -- \
  -r "https://example.com/checkout" \
  -t "https://staging.example.com/checkout" \
  --threshold 0.1 \
  --label "Checkout Critical Test"
```

## Contributing

Feel free to extend the tool with additional features:

- Mobile viewport support
- Custom selector testing
- Performance metrics
- Integration with CI/CD pipelines

## License

ISC License - See package.json for details. 