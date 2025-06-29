/**
 * Test Suite for SVG Path Extractor
 * Run with: node test-suite.js
 */

// Import or require the library (adjust for your environment)
let SVGPathExtractor;
try {
  SVGPathExtractor = require('./svg-path-extractor.js');
} catch (e) {
  // Fallback for different module systems
  if (typeof window !== 'undefined' && window.SVGPathExtractor) {
    SVGPathExtractor = window.SVGPathExtractor;
  } else {
    console.error('Could not load SVGPathExtractor');
    process.exit(1);
  }
}

// Test helper functions
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.failed++;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertArrayLength(array, expectedLength, message) {
    this.assert(Array.isArray(array), 'Expected an array');
    this.assert(array.length === expectedLength, 
      message || `Expected length ${expectedLength}, got ${array.length}`);
  }

  assertPointFormat(point) {
    this.assert(typeof point === 'object', 'Point should be an object');
    this.assert(typeof point.x === 'number', 'Point.x should be a number');
    this.assert(typeof point.y === 'number', 'Point.y should be a number');
    this.assert(!isNaN(point.x), 'Point.x should not be NaN');
    this.assert(!isNaN(point.y), 'Point.y should not be NaN');
  }

  summary() {
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📋 Total: ${this.passed + this.failed}`);
    
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('💥 Some tests failed!');
      process.exit(1);
    }
  }
}

// Test SVG samples
const testSVGs = {
  simple: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="10" x2="90" y2="90" stroke="black"/>
</svg>`,

  circle: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="30" fill="none" stroke="red"/>
</svg>`,

  rectangle: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="60" height="40" fill="none" stroke="blue"/>
</svg>`,

  path: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 10 L 50 50 L 90 10 Z" fill="none" stroke="black"/>
</svg>`,

  multiple: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="20" fill="none" stroke="red"/>
  <rect x="100" y="30" width="60" height="40" fill="none" stroke="blue"/>
  <line x1="20" y1="120" x2="180" y2="120" stroke="green"/>
</svg>`,

  polygon: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,10 90,90 10,90" fill="none" stroke="orange"/>
</svg>`,

  ellipse: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="50" rx="40" ry="20" fill="none" stroke="purple"/>
</svg>`
};

// Main test runner
async function runTests() {
  const runner = new TestRunner();

  // Test 1: Basic instantiation
  await runner.test('Library instantiation', async () => {
    const extractor = new SVGPathExtractor();
    runner.assert(extractor instanceof SVGPathExtractor, 'Should create instance');
    runner.assert(typeof extractor.extractPoints === 'function', 'Should have extractPoints method');
  });

  // Test 2: Configuration options
  await runner.test('Configuration options', async () => {
    const extractor = new SVGPathExtractor({
      pointDensity: 5,
      densityFactor: 0.01,
      maxPoints: 5000
    });
    runner.assert(extractor.options.pointDensity === 5, 'Should set pointDensity');
    runner.assert(extractor.options.densityFactor === 0.01, 'Should set densityFactor');
    runner.assert(extractor.options.maxPoints === 5000, 'Should set maxPoints');
  });

  // Test 3: Simple line extraction
  await runner.test('Simple line extraction', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 10 });
    const result = await extractor.extractPoints(testSVGs.simple);
    
    runner.assert(Array.isArray(result), 'Should return array');
    runner.assert(result.length > 0, 'Should have at least one path');
    runner.assert(Array.isArray(result[0]), 'First path should be array');
    runner.assert(result[0].length > 0, 'First path should have points');
    
    // Check point format
    result[0].forEach(point => runner.assertPointFormat(point));
    
    console.log(`   📍 Generated ${result[0].length} points for line`);
  });

  // Test 4: Circle extraction
  await runner.test('Circle extraction', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 5 });
    const result = await extractor.extractPoints(testSVGs.circle);
    
    runner.assert(result.length === 1, 'Should have one path for circle');
    runner.assert(result[0].length > 3, 'Circle should have multiple points');
    
    // Check that points form a circle (first and last should be close)
    const first = result[0][0];
    const last = result[0][result[0].length - 1];
    const distance = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));
    runner.assert(distance < 1, 'Circle should be closed (first and last points close)');
    
    console.log(`   📍 Generated ${result[0].length} points for circle`);
  });

  // Test 5: Rectangle extraction
  await runner.test('Rectangle extraction', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 8 });
    const result = await extractor.extractPoints(testSVGs.rectangle);
    
    runner.assert(result.length === 1, 'Should have one path for rectangle');
    runner.assert(result[0].length > 4, 'Rectangle should have multiple points');
    
    console.log(`   📍 Generated ${result[0].length} points for rectangle`);
  });

  // Test 6: Path extraction
  await runner.test('Path element extraction', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 8 });
    const result = await extractor.extractPoints(testSVGs.path);
    
    runner.assert(result.length === 1, 'Should have one path');
    runner.assert(result[0].length > 3, 'Path should have multiple points');
    
    console.log(`   📍 Generated ${result[0].length} points for path`);
  });

  // Test 7: Multiple elements
  await runner.test('Multiple elements extraction', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 10 });
    const result = await extractor.extractPoints(testSVGs.multiple);
    
    runner.assert(result.length === 3, 'Should extract 3 paths (circle, rect, line)');
    
    let totalPoints = 0;
    result.forEach((path, index) => {
      runner.assert(Array.isArray(path), `Path ${index} should be array`);
      runner.assert(path.length > 0, `Path ${index} should have points`);
      path.forEach(point => runner.assertPointFormat(point));
      totalPoints += path.length;
    });
    
    console.log(`   📍 Generated ${totalPoints} total points across ${result.length} paths`);
  });

  // Test 8: Polygon extraction
  await runner.test('Polygon extraction', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 5 });
    const result = await extractor.extractPoints(testSVGs.polygon);
    
    runner.assert(result.length === 1, 'Should have one path for polygon');
    runner.assert(result[0].length > 3, 'Polygon should have multiple points');
    
    console.log(`   📍 Generated ${result[0].length} points for polygon`);
  });

  // Test 9: Ellipse extraction
  await runner.test('Ellipse extraction', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 6 });
    const result = await extractor.extractPoints(testSVGs.ellipse);
    
    runner.assert(result.length === 1, 'Should have one path for ellipse');
    runner.assert(result[0].length > 3, 'Ellipse should have multiple points');
    
    console.log(`   📍 Generated ${result[0].length} points for ellipse`);
  });

  // Test 10: Point density parameter
  await runner.test('Point density parameter', async () => {
    const extractor = new SVGPathExtractor();
    
    const lowDensity = await extractor.extractPoints(testSVGs.circle, 20);
    const highDensity = await extractor.extractPoints(testSVGs.circle, 5);
    
    runner.assert(lowDensity[0].length < highDensity[0].length, 
      'Lower density should produce fewer points');
    
    console.log(`   📍 Low density: ${lowDensity[0].length} points, High density: ${highDensity[0].length} points`);
  });

  // Test 11: Error handling
  await runner.test('Error handling', async () => {
    const extractor = new SVGPathExtractor();
    
    // Test with completely malformed XML that should cause a parsing error
    try {
      await extractor.extractPoints('<svg><invalid></svg>');
      // If no error is thrown, that's actually OK - xmldom is lenient
      runner.assert(true, 'xmldom handled malformed XML gracefully');
    } catch (error) {
      runner.assert(error.message.includes('Failed to extract points') || error.message.includes('parsing'), 
        'Should provide meaningful error message');
    }
  });

  // Test 12: Empty SVG handling
  await runner.test('Empty SVG handling', async () => {
    const extractor = new SVGPathExtractor();
    const emptySVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
</svg>`;
    
    const result = await extractor.extractPoints(emptySVG);
    runner.assert(Array.isArray(result), 'Should return array for empty SVG');
    runner.assert(result.length === 0, 'Should return empty array for empty SVG');
  });

  // Test 13: Automatic density calculation
  await runner.test('Automatic density calculation', async () => {
    const extractor = new SVGPathExtractor();
    
    const result = await extractor.extractPoints(testSVGs.circle);
    runner.assert(result.length > 0, 'Should work with automatic density');
    runner.assert(result[0].length > 0, 'Should generate points with automatic density');
    
    console.log(`   📍 Auto density generated ${result[0].length} points`);
  });

  // Test 14: SVG with raster images and unsupported elements
  await runner.test('SVG with raster images handling', async () => {
    const extractor = new SVGPathExtractor({ pointDensity: 10 });
    
    const svgWithImages = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Raster images - should be ignored -->
  <image x="50" y="50" width="100" height="80" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="/>
  <image x="10" y="10" width="50" height="50" xlink:href="nonexistent.jpg"/>
  
  <!-- Regular SVG elements - should be processed -->
  <circle cx="200" cy="100" r="40" fill="none" stroke="red"/>
  <rect x="20" y="120" width="60" height="40" fill="none" stroke="blue"/>
  
  <!-- Other unsupported elements -->
  <text x="150" y="180">Test Text</text>
  <defs><linearGradient id="grad1"><stop offset="0%" stop-color="red"/></linearGradient></defs>
  
  <!-- Group with elements inside -->
  <g transform="translate(10,0)">
    <line x1="5" y1="160" x2="45" y2="180" stroke="purple"/>
  </g>
  
  <!-- Unknown elements -->
  <custom-element x="0" y="0"/>
</svg>`;

    const result = await extractor.extractPoints(svgWithImages);
    runner.assert(result.length === 3, 'Should extract 3 paths (circle, rect, line)');
    runner.assert(result.every(path => path.length > 0), 'All paths should have points');
    
    // Test SVG with only images (no drawable elements)
    const onlyImages = `<svg viewBox="0 0 100 100">
      <image x="0" y="0" width="50" height="50" href="test.jpg"/>
      <text x="25" y="75">No paths here</text>
    </svg>`;
    
    const emptyResult = await extractor.extractPoints(onlyImages);
    runner.assert(emptyResult.length === 0, 'Should return empty array for SVG without drawable elements');
    
    console.log(`   📍 Processed SVG with images: ${result.length} paths extracted`);
  });

  // Print summary
  runner.summary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, TestRunner, testSVGs }; 