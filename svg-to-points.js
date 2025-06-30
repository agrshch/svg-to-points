/**
 * SVG Path Extractor
 * A library for extracting points along SVG paths with configurable density
 * 
 * @author agrshch
 * @version 1.0.0
 * @license MIT
 */

class SVGPathExtractor {
  constructor(options = {}) {
    this.options = {
      pointDensity: options.pointDensity || null, // Auto-calculate if null
      densityFactor: options.densityFactor || 0.0075, // Factor for auto-calculation
      maxPoints: options.maxPoints || 1000000, // Safety limit
      includeOnly: options.includeOnly || null, // Only process specific elements
      excludeElements: options.excludeElements || [], // Exclude specific elements
      normalizeToSize: options.normalizeToSize || null, // Normalize to specific size {width, height}
      closePaths: options.closePaths || true, // Close closed shapes by duplicating first point at end
      ...options
    };
    
    this.warnings = []; // Store warnings for user
  }

  /**
   * Extract points from SVG content
   * @param {string} svgContent - SVG content as string
   * @param {number|null} pointDensity - Point density override
   * @returns {Array<Array<{x: number, y: number}>>} Array of paths, each containing points
   */
  async extractPoints(svgContent, pointDensity = null) {
    try {
      // Parse SVG
      const parser = this._createParser();
      const xmlDoc = parser.parseFromString(svgContent, 'text/xml');
      
      // Check for parsing errors (browser only)
      if (typeof window !== 'undefined' && xmlDoc.querySelector) {
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          throw new Error(`SVG parsing error: ${parserError.textContent}`);
        }
      }
      
      // Basic error check for xmldom (Node.js)
      if (xmlDoc.documentElement && xmlDoc.documentElement.tagName === 'parsererror') {
        throw new Error('SVG parsing error: Invalid XML');
      }

      // Calculate point density if not provided
      const density = pointDensity || this.options.pointDensity || this._calculateDensity(svgContent);
      
      const paths = [];
      const allElements = xmlDoc.getElementsByTagName('*');

      // Convert NodeList to Array for compatibility with xmldom
      const elementsArray = Array.from ? Array.from(allElements) : Array.prototype.slice.call(allElements);
      
      for (let element of elementsArray) {
        const elementPaths = this._processElement(element, density);
        paths.push(...elementPaths);
      }

      let result = paths.filter(path => path.length > 0);
      
      // Apply normalization if requested
      if (this.options.normalizeToSize) {
        result = this._normalizePaths(result, svgContent);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to extract points from SVG: ${error.message}`);
    }
  }

  /**
   * Extract points with metadata about source elements
   * @param {string} svgContent - SVG content as string
   * @param {number|null} pointDensity - Point density override
   * @returns {Array<{points: Array<{x: number, y: number}>, element: string, id?: string, className?: string, attributes: object}>}
   */
  async extractPointsWithMetadata(svgContent, pointDensity = null) {
    try {
      this.warnings = []; // Reset warnings
      
      // Parse SVG
      const parser = this._createParser();
      const xmlDoc = parser.parseFromString(svgContent, 'text/xml');
      
      // Check for parsing errors
      if (typeof window !== 'undefined' && xmlDoc.querySelector) {
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          throw new Error(`SVG parsing error: ${parserError.textContent}`);
        }
      }
      
      if (xmlDoc.documentElement && xmlDoc.documentElement.tagName === 'parsererror') {
        throw new Error('SVG parsing error: Invalid XML');
      }

      // Calculate point density if not provided
      const density = pointDensity || this.options.pointDensity || this._calculateDensity(svgContent);
      
      const result = [];
      const allElements = xmlDoc.getElementsByTagName('*');
      const elementsArray = Array.from ? Array.from(allElements) : Array.prototype.slice.call(allElements);
      
      for (let element of elementsArray) {
        const tagName = element.tagName?.toLowerCase();
        
        // Apply filtering
        if (this.options.includeOnly && !this.options.includeOnly.includes(tagName)) {
          continue;
        }
        if (this.options.excludeElements.includes(tagName)) {
          continue;
        }
        
        const elementPaths = this._processElement(element, density);
        
        // Create metadata for each path from this element
        elementPaths.forEach(points => {
          if (points.length > 0) {
            const metadata = {
              points: points,
              element: tagName,
              attributes: this._extractAttributes(element)
            };
            
            // Add common attributes if present
            if (element.getAttribute('id')) {
              metadata.id = element.getAttribute('id');
            }
            if (element.getAttribute('class')) {
              metadata.className = element.getAttribute('class');
            }
            
            result.push(metadata);
          }
        });
      }

      // Apply normalization if requested
      if (this.options.normalizeToSize) {
        return this._normalizePathsWithMetadata(result, svgContent);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to extract points with metadata from SVG: ${error.message}`);
    }
  }

  /**
   * Extract points from SVG file (Node.js)
   * @param {string} filePath - Path to SVG file
   * @param {number|null} pointDensity - Point density override
   * @returns {Promise<Array<Array<{x: number, y: number}>>>}
   */
  async extractPointsFromFile(filePath, pointDensity = null) {
    if (typeof window !== 'undefined') {
      throw new Error('extractPointsFromFile is only available in Node.js environment');
    }
    
    const fs = require('fs').promises;
    const svgContent = await fs.readFile(filePath, 'utf8');
    return this.extractPoints(svgContent, pointDensity);
  }

  /**
   * Get bounding box of all paths
   * @param {Array<Array<{x: number, y: number}>>} paths - Array of paths
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getBoundingBox(paths) {
    if (!paths || paths.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    paths.forEach(path => {
      path.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get total length of all paths
   * @param {Array<Array<{x: number, y: number}>>} paths - Array of paths
   * @returns {number} Total length
   */
  getTotalLength(paths) {
    if (!paths || paths.length === 0) {
      return 0;
    }

    let totalLength = 0;
    
    paths.forEach(path => {
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i-1].x;
        const dy = path[i].y - path[i-1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
    });

    return totalLength;
  }

  /**
   * Get center point (centroid) of all paths
   * @param {Array<Array<{x: number, y: number}>>} paths - Array of paths
   * @returns {{x: number, y: number}}
   */
  getCenter(paths) {
    if (!paths || paths.length === 0) {
      return { x: 0, y: 0 };
    }

    let totalX = 0, totalY = 0, totalPoints = 0;
    
    paths.forEach(path => {
      path.forEach(point => {
        totalX += point.x;
        totalY += point.y;
        totalPoints++;
      });
    });

    return {
      x: totalPoints > 0 ? totalX / totalPoints : 0,
      y: totalPoints > 0 ? totalY / totalPoints : 0
    };
  }

  /**
   * Create XML parser (browser or Node.js compatible)
   * @private
   */
  _createParser() {
    if (typeof DOMParser !== 'undefined') {
      // Browser environment
      return new DOMParser();
    } else if (typeof require !== 'undefined') {
      // Node.js environment
      try {
        const { DOMParser } = require('xmldom');
        return new DOMParser();
      } catch (e) {
        throw new Error('xmldom package required for Node.js. Install with: npm install xmldom');
      }
    } else {
      throw new Error('No XML parser available');
    }
  }

  /**
   * Process individual SVG element
   * @private
   */
  _processElement(element, density) {
    const tagName = element.tagName?.toLowerCase();
    
    switch (tagName) {
      case 'path':
        return this._processPath(element, density);
      case 'line':
        return [this._processLine(element, density)];
      case 'circle':
        return [this._processCircle(element, density)];
      case 'ellipse':
        return [this._processEllipse(element, density)];
      case 'rect':
        return [this._processRect(element, density)];
      case 'polygon':
        return [this._processPolygon(element, density)];
      case 'polyline':
        return [this._processPolyline(element, density)];
      default:
        return [];
    }
  }

  /**
   * Process path element
   * @private
   */
  _processPath(pathElement, density) {
    const pathData = pathElement.getAttribute('d');
    if (!pathData) return [];

    const subPaths = this._splitSubPaths(pathData);
    const paths = [];

    for (let subPath of subPaths) {
      const points = this._extractPointsFromPathData(subPath, density);
      
      // Close the path only if it's explicitly closed (ends with Z/z) and closePaths option is enabled
      if (this.options.closePaths && this._isPathClosed(subPath) && points.length > 0) {
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        
        // Only add closing point if not already there
        if (Math.abs(lastPoint.x - firstPoint.x) > 0.001 || Math.abs(lastPoint.y - firstPoint.y) > 0.001) {
          points.push({ x: firstPoint.x, y: firstPoint.y });
        }
      }
      
      if (points.length > 0) {
        paths.push(points);
      }
    }

    return paths;
  }

  /**
   * Process line element
   * @private
   */
  _processLine(lineElement, density) {
    const x1 = parseFloat(lineElement.getAttribute('x1') || 0);
    const y1 = parseFloat(lineElement.getAttribute('y1') || 0);
    const x2 = parseFloat(lineElement.getAttribute('x2') || 0);
    const y2 = parseFloat(lineElement.getAttribute('y2') || 0);

    return this._interpolatePoints(x1, y1, x2, y2, density);
  }

  /**
   * Process circle element
   * @private
   */
  _processCircle(circleElement, density) {
    const cx = parseFloat(circleElement.getAttribute('cx') || 0);
    const cy = parseFloat(circleElement.getAttribute('cy') || 0);
    const r = parseFloat(circleElement.getAttribute('r') || 0);

    if (r <= 0) return [];

    const points = [];
    const circumference = 2 * Math.PI * r;
    const numPoints = Math.max(3, Math.floor(circumference / density));

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push({ x, y });
    }

    // Close the circle if closePaths option is enabled
    // Circle is inherently a closed shape in SVG
    if (this.options.closePaths && points.length > 0) {
      const firstPoint = points[0];
      points.push({ x: firstPoint.x, y: firstPoint.y });
    }

    return points;
  }

  /**
   * Process ellipse element
   * @private
   */
  _processEllipse(ellipseElement, density) {
    const cx = parseFloat(ellipseElement.getAttribute('cx') || 0);
    const cy = parseFloat(ellipseElement.getAttribute('cy') || 0);
    const rx = parseFloat(ellipseElement.getAttribute('rx') || 0);
    const ry = parseFloat(ellipseElement.getAttribute('ry') || 0);

    if (rx <= 0 || ry <= 0) return [];

    const points = [];
    // Approximate ellipse circumference
    const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const numPoints = Math.max(3, Math.floor(circumference / density));

    // Generate points around ellipse (excluding duplicate end point)
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      points.push({ x, y });
    }

    // Close the ellipse if closePaths option is enabled
    // Ellipse is inherently a closed shape in SVG
    if (this.options.closePaths && points.length > 0) {
      const firstPoint = points[0];
      points.push({ x: firstPoint.x, y: firstPoint.y });
    }

    // Apply transform if present
    const transform = ellipseElement.getAttribute('transform');
    if (transform) {
      return this._applyTransform(points, transform);
    }

    return points;
  }

  /**
   * Process rectangle element
   * @private
   */
  _processRect(rectElement, density) {
    const x = parseFloat(rectElement.getAttribute('x') || 0);
    const y = parseFloat(rectElement.getAttribute('y') || 0);
    const width = parseFloat(rectElement.getAttribute('width') || 0);
    const height = parseFloat(rectElement.getAttribute('height') || 0);

    if (width <= 0 && height <= 0) return [];

    const points = [];
    const perimeter = 2 * (width + height);
    const numPoints = Math.max(4, Math.floor(perimeter / density));

    // Key vertices that MUST be included (guaranteed precision)
    const vertices = [
      { x: x, y: y },                      // top-left
      { x: x + width, y: y },              // top-right  
      { x: x + width, y: y + height },     // bottom-right
      { x: x, y: y + height }              // bottom-left
    ];

    // Loop around the perimeter of the rectangle
    for (let i = 0; i <= numPoints; i++) {
      let t = (i / numPoints) * perimeter;
      
      if (t <= width) {
        // Top edge
        points.push({ x: x + t, y: y });
      } else if (t <= width + height) {
        // Right edge
        points.push({ x: x + width, y: y + t - width });
      } else if (t <= 2 * width + height) {
        // Bottom edge
        points.push({ x: x + width - (t - width - height), y: y + height });
      } else {
        // Left edge
        points.push({ x: x, y: y + height - (t - 2 * width - height) });
      }
    }

    // Ensure all vertices are exactly included (vertex precision guarantee)
    vertices.forEach(vertex => {
      let hasVertex = points.some(p => 
        Math.abs(p.x - vertex.x) < 0.001 && Math.abs(p.y - vertex.y) < 0.001
      );
      
      if (!hasVertex) {
        // Find closest point and replace it with exact vertex
        let closestIndex = 0;
        let minDistance = Infinity;
        
        points.forEach((point, index) => {
          const distance = Math.abs(point.x - vertex.x) + Math.abs(point.y - vertex.y);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });
        
        points[closestIndex] = { x: vertex.x, y: vertex.y };
      }
    });

    // Close the rectangle if closePaths option is enabled
    if (this.options.closePaths && points.length > 0) {
      const firstPoint = points[0];
      points.push({ x: firstPoint.x, y: firstPoint.y });
    }

    // Apply transform if present
    const transform = rectElement.getAttribute('transform');
    if (transform) {
      return this._applyTransform(points, transform);
    }

    return points;
  }

  /**
   * Process polygon element
   * @private
   */
  _processPolygon(polygonElement, density) {
    const pointsAttr = polygonElement.getAttribute('points');
    if (!pointsAttr) return [];

    const rawPoints = pointsAttr.trim().split(/[\s,]+/).filter(p => p.length > 0);
    if (rawPoints.length < 4) return []; // Need at least 2 points

    // Parse vertices
    const vertices = [];
    for (let i = 0; i < rawPoints.length; i += 2) {
      if (i + 1 < rawPoints.length) {
        vertices.push({
          x: parseFloat(rawPoints[i]),
          y: parseFloat(rawPoints[i + 1])
        });
      }
    }

    if (vertices.length < 3) return [];

    const points = [];
    
    // Process each edge - ALWAYS include all vertices for precision
    for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i];
      const end = vertices[(i + 1) % vertices.length]; // Loop back to first vertex
      
      // Always add the starting vertex
      points.push({ x: start.x, y: start.y });
      
      // Add interpolated points between vertices (excluding endpoints to avoid duplicates)
      const segmentPoints = this._interpolatePoints(start.x, start.y, end.x, end.y, density);
      if (segmentPoints.length > 2) {
        // Skip first point (vertex already added) and last point (next vertex will add it)
        const intermediatePoints = segmentPoints.slice(1, -1);
        points.push(...intermediatePoints);
      }
    }

    // Close the polygon if closePaths option is enabled
    // Polygon is inherently a closed shape in SVG
    if (this.options.closePaths && points.length > 0 && vertices.length > 0) {
      const firstVertex = vertices[0];
      points.push({ x: firstVertex.x, y: firstVertex.y });
    }

    return points;
  }

  /**
   * Process polyline element
   * @private
   */
  _processPolyline(polylineElement, density) {
    const pointsAttr = polylineElement.getAttribute('points');
    if (!pointsAttr) return [];

    const rawPoints = pointsAttr.trim().split(/[\s,]+/).filter(p => p.length > 0);
    if (rawPoints.length < 4) return []; // Need at least 2 points

    // Parse vertices
    const vertices = [];
    for (let i = 0; i < rawPoints.length; i += 2) {
      if (i + 1 < rawPoints.length) {
        vertices.push({
          x: parseFloat(rawPoints[i]),
          y: parseFloat(rawPoints[i + 1])
        });
      }
    }

    if (vertices.length < 2) return [];

    const points = [];
    
    // Process each segment, ensuring all original vertices are included
    for (let i = 0; i < vertices.length - 1; i++) {
      const start = vertices[i];
      const end = vertices[i + 1];
      
      // Always add the starting vertex
      points.push({ x: start.x, y: start.y });
      
      // Add interpolated points between vertices (excluding endpoints to avoid duplicates)
      const segmentPoints = this._interpolatePoints(start.x, start.y, end.x, end.y, density);
      if (segmentPoints.length > 2) {
        // Skip first point (vertex already added) and last point (next vertex will add it)
        const intermediatePoints = segmentPoints.slice(1, -1);
        points.push(...intermediatePoints);
      }
    }

    // Add the final vertex
    if (vertices.length > 0) {
      const lastVertex = vertices[vertices.length - 1];
      points.push({ x: lastVertex.x, y: lastVertex.y });
    }

    return points;
  }

  /**
   * Interpolate points between two coordinates
   * @private
   */
  _interpolatePoints(x1, y1, x2, y2, density) {
    if (x1 === x2 && y1 === y2) return [{ x: x1, y: y1 }];

    const points = [];
    const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const numPoints = Math.max(1, Math.floor(lineLength / density));

    for (let i = 0; i <= numPoints; i++) {
      const t = numPoints === 0 ? 0 : i / numPoints;
      const x = x1 + t * (x2 - x1);
      const y = y1 + t * (y2 - y1);
      points.push({ x, y });
    }

    return points;
  }

  /**
   * Extract points from path data using browser SVG API (fallback to approximation)
   * @private
   */
  _extractPointsFromPathData(pathData, density) {
    // Always use vertex-preserving parsing for better precision
    // This ensures all corners and critical points are included
    return this._parsePathDataWithVertexPreservation(pathData, density);
  }

  /**
   * Basic path data parsing (simplified fallback)
   * @private
   */
  _parsePathDataBasic(pathData, density) {
    const points = [];
    const commands = pathData.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];
    let currentX = 0, currentY = 0;

    for (let command of commands) {
      const type = command[0].toUpperCase();
      const args = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

      switch (type) {
        case 'M':
          if (args.length >= 2) {
            currentX = args[0];
            currentY = args[1];
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'L':
          if (args.length >= 2) {
            const interpolated = this._interpolatePoints(currentX, currentY, args[0], args[1], density);
            points.push(...interpolated.slice(1)); // Skip first point to avoid duplicates
            currentX = args[0];
            currentY = args[1];
          }
          break;
        // Add more command types as needed
      }
    }

    return points;
  }

  /**
   * Parse path data with vertex preservation
   * Ensures all critical points (corners, vertices) are included
   * @private
   */
  _parsePathDataWithVertexPreservation(pathData, density) {
    const points = [];
    const commands = pathData.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];
    let currentX = 0, currentY = 0;
    let startX = 0, startY = 0;  // For Z command
    let lastControlX = 0, lastControlY = 0;  // For T command

    for (let command of commands) {
      const type = command[0].toUpperCase();
      const isRelative = command[0] !== command[0].toUpperCase(); 
      const args = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

      switch (type) {
        case 'M': // Move to
          if (args.length >= 2) {
            const x = isRelative ? currentX + args[0] : args[0];
            const y = isRelative ? currentY + args[1] : args[1];
            
            // ALWAYS include MoveTo points (critical vertices)
            points.push({ x, y });
            
            currentX = x;
            currentY = y;
            startX = x;  // Remember subpath start
            startY = y;
            
            // Reset control point for T command
            lastControlX = currentX;
            lastControlY = currentY;
          }
          break;

        case 'L': // Line to
          if (args.length >= 2) {
            const x = isRelative ? currentX + args[0] : args[0];
            const y = isRelative ? currentY + args[1] : args[1];
            
            // Add interpolated points INCLUDING the endpoint (vertex)
            const interpolated = this._interpolatePoints(currentX, currentY, x, y, density);
            points.push(...interpolated.slice(1)); // Skip first point to avoid duplicates
            
            currentX = x;
            currentY = y;
          }
          break;

        case 'H': // Horizontal line
          if (args.length >= 1) {
            const x = isRelative ? currentX + args[0] : args[0];
            const y = currentY;
            
            // Add interpolated points INCLUDING the endpoint (vertex)
            const interpolated = this._interpolatePoints(currentX, currentY, x, y, density);
            points.push(...interpolated.slice(1)); // Skip first point to avoid duplicates
            
            currentX = x;
          }
          break;

        case 'V': // Vertical line
          if (args.length >= 1) {
            const x = currentX;
            const y = isRelative ? currentY + args[0] : args[0];
            
            // Add interpolated points INCLUDING the endpoint (vertex)
            const interpolated = this._interpolatePoints(currentX, currentY, x, y, density);
            points.push(...interpolated.slice(1)); // Skip first point to avoid duplicates
            
            currentY = y;
          }
          break;

        case 'C': // Cubic Bezier curve
          if (args.length >= 6) {
            const cp1x = isRelative ? currentX + args[0] : args[0];
            const cp1y = isRelative ? currentY + args[1] : args[1];
            const cp2x = isRelative ? currentX + args[2] : args[2];
            const cp2y = isRelative ? currentY + args[3] : args[3];
            const x = isRelative ? currentX + args[4] : args[4];
            const y = isRelative ? currentY + args[5] : args[5];
            
            // Approximate cubic Bezier curve
            const curvePoints = this._approximateCubicBezier(currentX, currentY, cp1x, cp1y, cp2x, cp2y, x, y, density);
            points.push(...curvePoints.slice(1)); // Skip first point to avoid duplicates
            
            currentX = x;
            currentY = y;
          }
          break;

        case 'Q': // Quadratic Bezier curve
          if (args.length >= 4) {
            const cpx = isRelative ? currentX + args[0] : args[0];
            const cpy = isRelative ? currentY + args[1] : args[1];
            const x = isRelative ? currentX + args[2] : args[2];
            const y = isRelative ? currentY + args[3] : args[3];
            
            // Approximate quadratic Bezier curve
            const curvePoints = this._approximateQuadraticBezier(currentX, currentY, cpx, cpy, x, y, density);
            points.push(...curvePoints.slice(1)); // Skip first point to avoid duplicates
            
            // Remember control point for potential T command
            lastControlX = cpx;
            lastControlY = cpy;
            
            currentX = x;
            currentY = y;
          }
          break;

        case 'T': // Smooth quadratic Bezier curve
          if (args.length >= 2) {
            const x = isRelative ? currentX + args[0] : args[0];
            const y = isRelative ? currentY + args[1] : args[1];
            
            // Calculate reflected control point
            const cpx = 2 * currentX - lastControlX;
            const cpy = 2 * currentY - lastControlY;
            
            // Approximate quadratic Bezier curve
            const curvePoints = this._approximateQuadraticBezier(currentX, currentY, cpx, cpy, x, y, density);
            points.push(...curvePoints.slice(1)); // Skip first point to avoid duplicates
            
            // Update control point for potential next T command
            lastControlX = cpx;
            lastControlY = cpy;
            
            currentX = x;
            currentY = y;
          }
          break;

        case 'Z': // Close path
          // Always connect back to start point with interpolation
          if (Math.abs(currentX - startX) > 0.001 || Math.abs(currentY - startY) > 0.001) {
            const interpolated = this._interpolatePoints(currentX, currentY, startX, startY, density);
            points.push(...interpolated.slice(1)); // Skip first point to avoid duplicates
          }
          currentX = startX;
          currentY = startY;
          break;

        // Add more command types as needed
        default:
          console.warn(`Unsupported path command: ${type}`);
          break;
      }
    }

    return points;
  }

  /**
   * Approximate cubic Bezier curve with points
   * @private
   */
  _approximateCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, density) {
    const points = [];
    
    // Calculate approximate curve length for number of segments
    const chordLength = Math.sqrt(Math.pow(x3 - x0, 2) + Math.pow(y3 - y0, 2));
    const numSegments = Math.max(2, Math.floor(chordLength / density));
    
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const x = Math.pow(1-t, 3) * x0 + 3 * Math.pow(1-t, 2) * t * x1 + 3 * (1-t) * Math.pow(t, 2) * x2 + Math.pow(t, 3) * x3;
      const y = Math.pow(1-t, 3) * y0 + 3 * Math.pow(1-t, 2) * t * y1 + 3 * (1-t) * Math.pow(t, 2) * y2 + Math.pow(t, 3) * y3;
      points.push({ x, y });
    }
    
    return points;
  }

  /**
   * Approximate quadratic Bezier curve with points
   * @private
   */
  _approximateQuadraticBezier(x0, y0, x1, y1, x2, y2, density) {
    const points = [];
    
    // Calculate approximate curve length for number of segments
    const chordLength = Math.sqrt(Math.pow(x2 - x0, 2) + Math.pow(y2 - y0, 2));
    const numSegments = Math.max(2, Math.floor(chordLength / density));
    
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const x = Math.pow(1-t, 2) * x0 + 2 * (1-t) * t * x1 + Math.pow(t, 2) * x2;
      const y = Math.pow(1-t, 2) * y0 + 2 * (1-t) * t * y1 + Math.pow(t, 2) * y2;
      points.push({ x, y });
    }
    
    return points;
  }

  /**
   * Split path data into sub-paths
   * @private
   */
  _splitSubPaths(pathData) {
    return pathData.split(/(?=[Mm])/).filter(p => p.trim().length > 0);
  }

  /**
   * Check if path is closed
   * @private
   */
  _isPathClosed(pathData) {
    return /[Zz]\s*$/.test(pathData.trim());
  }

  /**
   * Calculate automatic point density based on SVG dimensions
   * @private
   */
  _calculateDensity(svgContent) {
    const dimensions = this._getSvgDimensions(svgContent);
    const maxDimension = Math.max(dimensions.width || 100, dimensions.height || 100);
    return maxDimension * this.options.densityFactor;
  }

  /**
   * Extract SVG dimensions
   * @private
   */
  _getSvgDimensions(svgContent) {
    let width = null, height = null;

    // Try viewBox first
    const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']+)["']/i);
    if (viewBoxMatch) {
      const viewBoxValues = viewBoxMatch[1].split(/[\s,]+/).map(Number);
      if (viewBoxValues.length >= 4) {
        width = viewBoxValues[2];
        height = viewBoxValues[3];
      }
    }

    // Fallback to width/height attributes
    if (width === null || height === null) {
      const widthMatch = svgContent.match(/width\s*=\s*["']([^"']+)["']/i);
      const heightMatch = svgContent.match(/height\s*=\s*["']([^"']+)["']/i);
      
      if (widthMatch) width = parseFloat(widthMatch[1]) || width;
      if (heightMatch) height = parseFloat(heightMatch[1]) || height;
    }

    return {
      width: width || 100,
      height: height || 100
    };
  }

  /**
   * Apply transform to points (basic support)
   * @private
   */
  _applyTransform(points, transformString) {
    // This is a simplified transform parser
    // For production, consider using a proper SVG transform library
    
    const matrixMatch = transformString.match(/matrix\s*\(\s*([^)]+)\s*\)/);
    if (matrixMatch) {
      const values = matrixMatch[1].split(/[\s,]+/).map(Number);
      if (values.length === 6) {
        const [a, b, c, d, e, f] = values;
        return points.map(point => ({
          x: a * point.x + c * point.y + e,
          y: b * point.x + d * point.y + f
        }));
      }
    }

    // Add support for other transforms as needed
    return points;
  }

  /**
   * Extract element attributes for metadata
   * @private
   */
  _extractAttributes(element) {
    const attributes = {};
    
    if (element.attributes) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
      }
    }
    
    return attributes;
  }

  /**
   * Normalize paths to specific size
   * @private
   */
  _normalizePaths(paths, svgContent) {
    if (!this.options.normalizeToSize || paths.length === 0) {
      return paths;
    }

    // Get current bounding box
    const bbox = this.getBoundingBox(paths);
    if (bbox.width === 0 || bbox.height === 0) {
      return paths;
    }

    const targetSize = this.options.normalizeToSize;
    const scaleX = targetSize.width / bbox.width;
    const scaleY = targetSize.height / bbox.height;
    
    // Use uniform scaling to maintain aspect ratio
    const scale = Math.min(scaleX, scaleY);

    return paths.map(path => 
      path.map(point => ({
        x: (point.x - bbox.x) * scale,
        y: (point.y - bbox.y) * scale
      }))
    );
  }

  /**
   * Normalize paths with metadata to specific size
   * @private
   */
  _normalizePathsWithMetadata(pathsWithMetadata, svgContent) {
    if (!this.options.normalizeToSize || pathsWithMetadata.length === 0) {
      return pathsWithMetadata;
    }

    // Extract just the points for bounding box calculation
    const allPaths = pathsWithMetadata.map(item => item.points);
    const bbox = this.getBoundingBox(allPaths);
    
    if (bbox.width === 0 || bbox.height === 0) {
      return pathsWithMetadata;
    }

    const targetSize = this.options.normalizeToSize;
    const scaleX = targetSize.width / bbox.width;
    const scaleY = targetSize.height / bbox.height;
    
    // Use uniform scaling to maintain aspect ratio
    const scale = Math.min(scaleX, scaleY);

    return pathsWithMetadata.map(item => ({
      ...item,
      points: item.points.map(point => ({
        x: (point.x - bbox.x) * scale,
        y: (point.y - bbox.y) * scale
      }))
    }));
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = SVGPathExtractor;
} else if (typeof window !== 'undefined') {
  // Browser
  window.SVGPathExtractor = SVGPathExtractor;
}

// Also support ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports.default = SVGPathExtractor;
} 