# SVG Path Extractor

A powerful, dependency-free JavaScript library for extracting points along SVG paths with configurable density. Perfect for converting SVG graphics into arrays of coordinate points for use in animations, data visualization, or drawing applications.

## ✨ Features

- 🎯 **Extract points from any SVG element**: paths, lines, circles, rectangles, ellipses, polygons, and polylines
- ⚙️ **Configurable point density**: Control the spacing between extracted points
- 🌐 **Universal compatibility**: Works in both Node.js and browser environments
- 🔧 **Zero dependencies**: No external libraries required for core functionality
- 📝 **TypeScript support**: Full type definitions included
- 🛡️ **Robust error handling**: Graceful handling of malformed SVG content
- 🎨 **Transform support**: Basic support for SVG transforms

## 📦 Installation

```bash
npm install svg-path-extractor
```

## 🚀 Quick Start

### Browser Usage

```html
<script src="svg-path-extractor.js"></script>
<script>
  const extractor = new SVGPathExtractor();
  
  const svgContent = `
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="30" />
    </svg>
  `;
  
  extractor.extractPoints(svgContent, 5).then(paths => {
    console.log('Extracted paths:', paths);
    // paths[0] = [{ x: 80, y: 50 }, { x: 79.3, y: 53.9 }, ...]
  });
</script>
```

### Node.js Usage

```javascript
const SVGPathExtractor = require('svg-path-extractor');

const extractor = new SVGPathExtractor({
  pointDensity: 5,  // 5 units between points
  densityFactor: 0.01
});

// From string
const svgContent = `...your SVG content...`;
const paths = await extractor.extractPoints(svgContent);

// From file
const paths = await extractor.extractPointsFromFile('./path/to/file.svg');

console.log(`Extracted ${paths.length} paths with ${paths[0]?.length} points each`);
```

### ES6 Modules

```javascript
import SVGPathExtractor from 'svg-path-extractor';

const extractor = new SVGPathExtractor();
const paths = await extractor.extractPoints(svgContent, 10);
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
| `maxPoints` | `number` | `10000` | Maximum points per path (safety limit) |

### Methods

#### `extractPoints(svgContent, pointDensity?)`

Extracts points from SVG content string.

- **Parameters:**
  - `svgContent` (string): SVG markup as string
  - `pointDensity` (number, optional): Override density for this extraction
- **Returns:** `Promise<Array<Array<{x: number, y: number}>>>`

#### `extractPointsFromFile(filePath, pointDensity?)` 

*Node.js only* - Extracts points from SVG file.

- **Parameters:**
  - `filePath` (string): Path to SVG file
  - `pointDensity` (number, optional): Override density for this extraction
- **Returns:** `Promise<Array<Array<{x: number, y: number}>>>`

## 🎨 Supported SVG Elements

| Element | Support | Notes |
|---------|---------|-------|
| `<path>` | ✅ Full | Uses browser's native `getPointAtLength()` when available |
| `<line>` | ✅ Full | Linear interpolation |
| `<circle>` | ✅ Full | Parametric circle generation |
| `<rect>` | ✅ Full | Perimeter tracing with transform support |
| `<ellipse>` | ✅ Full | Parametric ellipse with transform support |
| `<polygon>` | ✅ Full | Linear interpolation between vertices |
| `<polyline>` | ✅ Full | Linear interpolation between points |

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

### Complex Path Extraction

```javascript
const svg = `
  <svg viewBox="0 0 100 100">
    <path d="M 10 10 C 20 20, 40 20, 50 10 S 80 0, 90 10" />
  </svg>
`;

const paths = await extractor.extractPoints(svg, 3);
// Returns smooth curve points with 3 units spacing
```

### Drawing with Canvas

```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const paths = await extractor.extractPoints(svgContent, 5);

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

### Animation Points

```javascript
const paths = await extractor.extractPoints(svgContent, 2);
const allPoints = paths.flat();

// Animate through points
let currentIndex = 0;
function animate() {
  const point = allPoints[currentIndex];
  // Move your object to point.x, point.y
  currentIndex = (currentIndex + 1) % allPoints.length;
  requestAnimationFrame(animate);
}
animate();
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

## 🛠️ Node.js Setup

For Node.js usage, install the optional XML parser dependency:

```bash
npm install xmldom
```

The library will automatically detect and use it for XML parsing in Node.js environments.

## 🧪 Testing

Run the test suite:

```bash
# Node.js tests
npm test

# Browser tests
npm run test:browser
# Then open test.html in your browser
```

## 🔧 Development

```bash
# Clone repository
git clone https://github.com/yourusername/svg-path-extractor.git
cd svg-path-extractor

# Install dev dependencies (optional)
npm install xmldom

# Run tests
npm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Limitations

- Complex path commands (arcs, curves) fall back to basic parsing in Node.js
- Transform support is basic (matrix and simple rotations only)
- Very large SVGs may hit the `maxPoints` safety limit

## 🔗 Related Projects

- [svg-path-parser](https://www.npmjs.com/package/svg-path-parser) - SVG path parsing
- [paper.js](http://paperjs.org/) - Vector graphics scripting
- [fabric.js](http://fabricjs.com/) - Canvas library with SVG support

---

Made with ❤️ by [Your Name](https://github.com/yourusername) 