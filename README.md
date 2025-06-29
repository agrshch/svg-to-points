# SVG Path Extractor

A powerful, dependency-free JavaScript library for extracting points along SVG paths with configurable density and vertex preservation. Perfect for converting SVG graphics into arrays of coordinate points for use in animations, data visualization, or drawing applications.

## ✨ Features

- 🎯 **Extract points from any SVG element**: paths, lines, circles, rectangles, ellipses, polygons, and polylines
- ⚙️ **Configurable point density**: Control the spacing between extracted points
- 🔒 **Vertex preservation**: Guarantees that all corners and vertices are included in results
- 📊 **Element metadata**: Extract points with information about source elements
- 🧮 **Utility methods**: Built-in bounding box, length, and center calculations
- 📏 **Coordinate normalization**: Scale results to specific dimensions
- 🌐 **Universal compatibility**: Works in both Node.js and browser environments
- 🔧 **Zero dependencies**: No external libraries required for core functionality
- 📝 **TypeScript support**: Full type definitions included
- 🛡️ **Robust error handling**: Graceful handling of malformed SVG content
- 🎨 **Transform support**: Basic support for SVG transforms

## 📥 Installation

Currently available as a standalone file. Download `svg-path-extractor.js` from this repository.

**Future releases will be available on:**
- NPM: `npm install svg-path-extractor` *(coming soon)*
- CDN: `<script src="https://cdn.example.com/svg-path-extractor.js"></script>` *(coming soon)*

## 🚀 Quick Start

### Browser Usage

```html
<script src="svg-path-extractor.js"></script>
<script>
  const extractor = new SVGPathExtractor({ pointDensity: 8 });
  
  const svgContent = `
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="30" />
    </svg>
  `;
  
  extractor.extractPoints(svgContent).then(paths => {
    console.log('Extracted paths:', paths);
    // paths[0] = [{ x: 80, y: 50 }, { x: 79.3, y: 53.9 }, ...]
  });
</script>
```

### Node.js Usage

```javascript
const SVGPathExtractor = require('./svg-path-extractor.js');

const extractor = new SVGPathExtractor({
  pointDensity: 5,        // 5 units between points
  densityFactor: 0.0075,  // Auto-density factor
  closePaths: false       // Don't close paths by default
});

// From string
const svgContent = `...your SVG content...`;
const paths = await extractor.extractPoints(svgContent);

// From file (Node.js only)
const paths = await extractor.extractPointsFromFile('./path/to/file.svg');

console.log(`Extracted ${paths.length} paths with ${paths[0]?.length} points each`);
```

### ES6 Modules (when available)

```javascript
import SVGPathExtractor from './svg-path-extractor.js';

const extractor = new SVGPathExtractor();
const paths = await extractor.extractPoints(svgContent);
```

## 📖 API Reference

### Constructor

```javascript
new SVGPathExtractor(options?)
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pointDensity` | `number \| null` | `null` | Fixed distance between points. If `null`, automatically calculated |
| `densityFactor` | `number` | `0.0075` | Factor for automatic density calculation |
| `maxPoints` | `number` | `1000000` | Maximum points per path (safety limit) |
| `includeOnly` | `string[] \| null` | `null` | Only process specific element types |
| `excludeElements` | `string[]` | `[]` | Exclude specific element types |
| `normalizeToSize` | `{width: number, height: number} \| null` | `null` | Normalize all paths to specific dimensions |
| `closePaths` | `boolean` | `false` | Close closed shapes by duplicating first point at end |

### Core Methods

#### `extractPoints(svgContent, pointDensity?)`

Extracts points from SVG content string.

- **Parameters:**
  - `svgContent` (string): SVG markup as string
  - `pointDensity` (number, optional): Override density for this extraction
- **Returns:** `Promise<Array<Array<{x: number, y: number}>>>`

#### `extractPointsWithMetadata(svgContent, pointDensity?)`

Extracts points with metadata about source elements.

- **Parameters:**
  - `svgContent` (string): SVG markup as string  
  - `pointDensity` (number, optional): Override density for this extraction
- **Returns:** `Promise<Array<{points: Point[], element: string, id?: string, className?: string, attributes: object}>>`

#### `extractPointsFromFile(filePath, pointDensity?)` 

*Node.js only* - Extracts points from SVG file.

- **Parameters:**
  - `filePath` (string): Path to SVG file
  - `pointDensity` (number, optional): Override density for this extraction
- **Returns:** `Promise<Array<Array<{x: number, y: number}>>>`

### Utility Methods

#### `getBoundingBox(paths)`

Calculate bounding box of all paths.

- **Parameters:** `paths` (Array<Array<{x: number, y: number}>>)
- **Returns:** `{x: number, y: number, width: number, height: number}`

#### `getTotalLength(paths)`

Calculate total length of all paths.

- **Parameters:** `paths` (Array<Array<{x: number, y: number}>>)  
- **Returns:** `number`

#### `getCenter(paths)`

Calculate center point (centroid) of all paths.

- **Parameters:** `paths` (Array<Array<{x: number, y: number}>>)
- **Returns:** `{x: number, y: number}`

## 🎨 Supported SVG Elements

| Element | Support | Vertex Preservation | Notes |
|---------|---------|-------|-------|
| `<path>` | ✅ Full | ✅ Yes | Custom parser with Bézier curve support |
| `<line>` | ✅ Full | ✅ Yes | Linear interpolation with endpoints |
| `<circle>` | ✅ Full | N/A | Parametric circle generation |
| `<rect>` | ✅ Full | ✅ Yes | Perimeter tracing with exact corners |
| `<ellipse>` | ✅ Full | N/A | Parametric ellipse generation |
| `<polygon>` | ✅ Full | ✅ Yes | All vertices guaranteed in output |
| `<polyline>` | ✅ Full | ✅ Yes | All vertices guaranteed in output |
| `<image>` | ⏭️ Ignored | N/A | Raster images are skipped |
| `<text>` | ⏭️ Ignored | N/A | Text elements are skipped |

## 💡 Examples

### Basic Shape Extraction

```javascript
const extractor = new SVGPathExtractor({ pointDensity: 8 });

const svg = `
  <svg viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="50" />
    <rect x="25" y="25" width="150" height="150" />
  </svg>
`;

const paths = await extractor.extractPoints(svg);
console.log(`Circle: ${paths[0].length} points`);
console.log(`Rectangle: ${paths[1].length} points`);
```

### Extract with Metadata

```javascript
const pathsWithMetadata = await extractor.extractPointsWithMetadata(svg);

pathsWithMetadata.forEach(pathData => {
  console.log(`Element: ${pathData.element}`);
  console.log(`ID: ${pathData.id || 'none'}`);
  console.log(`Points: ${pathData.points.length}`);
  console.log(`Attributes:`, pathData.attributes);
});
```

### Utility Functions

```javascript
const paths = await extractor.extractPoints(svg);

// Get bounding box
const bbox = extractor.getBoundingBox(paths);
console.log(`Size: ${bbox.width} x ${bbox.height}`);

// Get total length
const totalLength = extractor.getTotalLength(paths);
console.log(`Total length: ${totalLength.toFixed(2)} units`);

// Get center point
const center = extractor.getCenter(paths);
console.log(`Center: (${center.x}, ${center.y})`);
```

### Advanced Configuration

```javascript
const extractor = new SVGPathExtractor({
  pointDensity: 5,
  includeOnly: ['rect', 'circle'],           // Only process rectangles and circles
  normalizeToSize: { width: 100, height: 100 }, // Scale to 100x100
  closePaths: true                            // Close closed shapes
});

const paths = await extractor.extractPoints(svg);
```

### Filter Elements

```javascript
// Only process specific elements
const extractor = new SVGPathExtractor({
  includeOnly: ['path', 'polygon']
});

// Or exclude specific elements  
const extractor2 = new SVGPathExtractor({
  excludeElements: ['text', 'image']
});
```

### Drawing with Canvas

```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const paths = await extractor.extractPoints(svgContent);

paths.forEach(path => {
  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
});
```

## 🎛️ Point Density Guide

Point density determines the spacing between extracted points:

- **Low density (20-50)**: Fewer points, good for simple shapes or performance
- **Medium density (5-15)**: Balanced detail and performance  
- **High density (1-3)**: Maximum detail, good for complex curves
- **Auto density**: Automatically calculated based on SVG size

```javascript
// Different density examples
const lowDetail = await extractor.extractPoints(svg, 20);    // ~10 points
const mediumDetail = await extractor.extractPoints(svg, 8);  // ~25 points  
const highDetail = await extractor.extractPoints(svg, 2);   // ~100 points
const autoDetail = await extractor.extractPoints(svg);      // Auto-calculated
```

## 🔒 Vertex Preservation

The library guarantees that all critical vertices (corners, intersections) are included in the output:

- **Rectangle corners**: All 4 corners are exactly preserved
- **Polygon vertices**: All original vertices included regardless of density
- **Path endpoints**: Start and end points of path segments
- **Line endpoints**: Both ends of line elements

```javascript
// Even with low density, vertices are preserved
const paths = await extractor.extractPoints(`
  <polygon points="0,0 100,0 50,50" />
`, 50); // Very low density

// All 3 vertices (0,0), (100,0), (50,50) will be in the result
```

## 🛠️ Node.js Setup

For Node.js usage, optionally install XML parser dependency for better performance:

```bash
npm install xmldom
```

The library will automatically detect and use it. If not available, it falls back to basic parsing.

## 🧪 Testing

The library includes comprehensive test files:

- **`test-suite.js`**: Automated test suite (22 tests)
- **`debug-text.html`**: Interactive visual testing
- **`standalone-demo.html`**: Feature demonstration

Run tests by opening HTML files in a browser or running Node.js tests:

```bash
node test-suite.js
```

## 🔧 Development Status

**Current Version:** 1.0.0 (Beta)  
**Status:** Ready for production use, pending publication

### Planned Features
- NPM package publication
- CDN distribution
- Additional transform support
- Arc path support improvements
- Performance optimizations

## 🤝 Contributing

This is currently a standalone project. Contributions and feedback are welcome! 

For bug reports or feature requests, please create an issue or contact the maintainer.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔍 What's New

### Recent Updates
- **Vertex Preservation**: All corners and vertices are guaranteed in output
- **Element Metadata**: Extract points with source element information  
- **Utility Methods**: Built-in bounding box, length, and center calculations
- **Coordinate Normalization**: Scale results to specific dimensions
- **Path Closing**: Option to close closed shapes
- **Enhanced Path Parser**: Support for cubic and quadratic Bézier curves
- **Element Filtering**: Include/exclude specific element types

## 🐛 Known Limitations

- Complex path arcs may have reduced precision in Node.js fallback mode
- Transform support is basic (matrix and simple transforms only)
- Very large SVGs may hit the `maxPoints` safety limit (configurable)
- Some edge cases in complex nested transforms

## 🔗 Files in This Repository

- **`svg-path-extractor.js`**: Main library file
- **`index.d.ts`**: TypeScript definitions
- **`test-suite.js`**: Automated tests
- **`debug-text.html`**: Interactive testing page
- **`standalone-demo.html`**: Feature demonstration
- **`examples/`**: Usage examples
- **`test-*.svg`**: Test SVG files

---

**Ready for production use** • **Vertex-preserving algorithm** • **Zero dependencies** • **Universal compatibility** 