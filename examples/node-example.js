/**
 * Node.js Example for SVG Path Extractor
 * Run with: node examples/node-example.js
 */

const SVGPathExtractor = require('../svg-path-extractor.js');
const fs = require('fs').promises;

async function main() {
  console.log('🎨 SVG Path Extractor - Node.js Example\n');

  // Example 1: Extract from SVG string
  console.log('📍 Example 1: Extract from SVG string');
  const extractor = new SVGPathExtractor({ pointDensity: 10 });
  
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" fill="none" stroke="red"/>
  <rect x="50" y="50" width="100" height="100" fill="none" stroke="blue"/>
  <path d="M 20 20 L 180 20 L 180 180 L 20 180 Z" fill="none" stroke="green"/>
</svg>`;

  try {
    const paths = await extractor.extractPoints(svgContent);
    console.log(`✅ Extracted ${paths.length} paths:`);
    paths.forEach((path, index) => {
      console.log(`   Path ${index + 1}: ${path.length} points`);
      console.log(`   First point: (${path[0].x.toFixed(2)}, ${path[0].y.toFixed(2)})`);
      console.log(`   Last point: (${path[path.length - 1].x.toFixed(2)}, ${path[path.length - 1].y.toFixed(2)})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Example 2: Different point densities
  console.log('\n📍 Example 2: Different point densities');
  const circleSVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30"/></svg>`;
  
  const densities = [20, 10, 5, 2];
  for (const density of densities) {
    const result = await extractor.extractPoints(circleSVG, density);
    console.log(`   Density ${density}: ${result[0].length} points`);
  }

  // Example 3: Auto density
  console.log('\n📍 Example 3: Automatic density calculation');
  const autoExtractor = new SVGPathExtractor(); // No density specified
  const autoResult = await autoExtractor.extractPoints(circleSVG);
  console.log(`   Auto density: ${autoResult[0].length} points`);

  // Example 4: Save to file (CSV format)
  console.log('\n📍 Example 4: Save extracted points to CSV');
  const paths = await extractor.extractPoints(svgContent, 8);
  
  let csvContent = 'path_id,point_id,x,y\n';
  paths.forEach((path, pathIndex) => {
    path.forEach((point, pointIndex) => {
      csvContent += `${pathIndex},${pointIndex},${point.x.toFixed(3)},${point.y.toFixed(3)}\n`;
    });
  });
  
  await fs.writeFile('extracted_points.csv', csvContent);
  console.log('   ✅ Points saved to extracted_points.csv');

  // Example 5: Performance test
  console.log('\n📍 Example 5: Performance test');
  const complexSVG = `<svg viewBox="0 0 1000 1000">
    ${Array.from({ length: 20 }, (_, i) => 
      `<circle cx="${50 + i * 45}" cy="${50 + i * 45}" r="${20 + i * 2}"/>`
    ).join('')}
  </svg>`;
  
  const startTime = Date.now();
  const complexResult = await extractor.extractPoints(complexSVG, 5);
  const endTime = Date.now();
  
  const totalPoints = complexResult.reduce((sum, path) => sum + path.length, 0);
  console.log(`   ✅ Processed ${complexResult.length} paths with ${totalPoints} total points in ${endTime - startTime}ms`);

  console.log('\n🎉 All examples completed successfully!');
}

// Run the examples
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Example failed:', error);
    process.exit(1);
  });
}

module.exports = { main }; 