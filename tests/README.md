# 🧪 Tests Directory

This directory contains all test files, demo files, and debugging tools for the SVG Path Extractor library.

## 📁 Test Files

### **test-suite.js**
- **Purpose**: Main automated test suite
- **Usage**: `npm test` or `node tests/test-suite.js`
- **Coverage**: 14 comprehensive tests covering all library functionality
- **Features**: 
  - All SVG element types
  - Error handling
  - Performance validation
  - Edge cases

### **Test SVG Files**

#### **test.svg**
- **Purpose**: Basic test file with simple shapes
- **Content**: Circle, rectangle, and path elements
- **Size**: 692 bytes

#### **test-text.svg** 
- **Purpose**: Complex text path testing
- **Content**: Converted text as path elements ("FUTURE HUMAN")
- **Size**: 2.9KB
- **Use**: Testing complex path parsing and performance

#### **test-vertices-precision.svg**
- **Purpose**: Vertex preservation testing
- **Content**: Various polygons, rectangles, and paths
- **Features**: Tests corner/vertex accuracy
- **Size**: 1.9KB

#### **demo-shapes.svg**
- **Purpose**: Demo file showcasing all supported elements
- **Content**: Circle, rectangle, ellipse, path, polygon, polyline, line, and image
- **Features**: Visual demo for GitHub Pages
- **Size**: 1.3KB

## 🔧 Usage

### Run All Tests
```bash
# From project root
npm test

# Or directly
node tests/test-suite.js
```

### Manual Testing
```bash
# Test with specific SVG file
node tests/test-suite.js tests/test.svg

# In browser - open any SVG file in ../index.html
```

### Performance Testing
The test suite includes performance benchmarks:
- Simple shapes: < 1ms
- Complex multi-element SVGs: < 5ms
- Large files (1000+ points): < 10ms

## 📊 Test Coverage

✅ **Element Support** (7/7)
- Circle, Rectangle, Ellipse
- Path (all commands), Line
- Polygon, Polyline

✅ **Features** (8/8)
- Point density control
- Vertex preservation
- Path closing options
- Metadata extraction
- Error handling
- Auto-density calculation
- Transform support
- Utility methods

✅ **Environments** (2/2)
- Node.js compatibility
- Browser compatibility

## 🐛 Debugging

For debugging specific issues:
1. Use test SVG files to isolate problems
2. Check console output from test-suite.js
3. Visual debugging available in ../index.html
4. Modify test files to create minimal reproductions

## 📈 Adding New Tests

To add new test cases:
1. Add SVG test files to this directory
2. Update test-suite.js with new test functions
3. Follow existing test patterns
4. Ensure both Node.js and browser compatibility

---

**All tests passing = Library ready for production! 🚀** 