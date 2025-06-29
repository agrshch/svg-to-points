let POINT_DENSITY = 10;
let PATHS;
let isDrawingSVG = false;
let pathCounter = 0;
let ptCounter = 0;
let pathStartPoint;

//initial function, works when input gets file
async function loadSVG() {
  const fileInput = document.getElementById('svgInput');
  if (fileInput.files.length > 0) {
    PATHS = [];
    const file = fileInput.files[0];
    const text = await file.text();
    POINT_DENSITY = calcDensity(text);
    processSVG(text); //calls main function
    fitToCanvas(...getSvgDimensions(text)); //scales everything to fit into canvas
    isDrawingSVG = true;
    loop();
  }
}


//main function
function processSVG(svgContent) {
  pathStartPoint = createVector(0,0);
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(svgContent, 'text/xml');

  let allElements = xmlDoc.getElementsByTagName('*');
  for (let element of allElements) {
    switch(element.tagName) {
      case 'path':
        processPathElement(element);
        break;
      case 'line':
        processLineElement(element);
        break;
      case 'circle':
        processCircleElement(element);
        break;
      case 'rect':
        processRectElement(element);
        break;
      case 'ellipse':
        processEllipseElement(element);
        break;
      case 'polygon':
        processPolygonElement(element);
        break;
      case 'polyline':
        processPolylineElement(element);
        break;
    }
  }
}


function processPathElement(pathElement) {
  let pathData = pathElement.getAttribute('d');
  let subPaths = splitSubPaths(pathData);
  for (let subPath of subPaths) {
    let pathPoints = extractPointsFromPath(subPath);
    if(isPathClosed(subPath)) pathPoints.push(pathPoints[0].copy());
    PATHS.push(pathPoints);
  }
}

function processLineElement(lineElement) {
  let x1 = parseFloat(lineElement.getAttribute('x1'));
  let y1 = parseFloat(lineElement.getAttribute('y1'));
  let x2 = parseFloat(lineElement.getAttribute('x2'));
  let y2 = parseFloat(lineElement.getAttribute('y2'));

  let points = [];
  let lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  let numPoints = lineLength / POINT_DENSITY;

  for (let i = 0; i <= numPoints; i++) {
    let t = i / numPoints;
    let x = x1 + t * (x2 - x1);
    let y = y1 + t * (y2 - y1);
    points.push(createVector(x, y));
  }
  points.push(createVector(x2, y2));

  PATHS.push(points);
}

function processCircleElement(circleElement) {
  let cx = parseFloat(circleElement.getAttribute('cx'));
  let cy = parseFloat(circleElement.getAttribute('cy'));
  let r = parseFloat(circleElement.getAttribute('r'));

  let points = [];
  let circumference = 2 * Math.PI * r;
  let numPoints = circumference / POINT_DENSITY;

  for (let i = 0; i <= numPoints; i++) {
    let angle = (i / numPoints) * 2 * Math.PI;
    let x = cx + r * Math.cos(angle);
    let y = cy + r * Math.sin(angle);
    points.push(createVector(x, y));
  }
  points.push(points[0].copy()); //close the shape
  PATHS.push(points);
}

function processEllipseElement(ellipseElement) {
  let transform = ellipseElement.getAttribute('transform');

  let cx = parseFloat(ellipseElement.getAttribute('cx'));
  let cy = parseFloat(ellipseElement.getAttribute('cy'));
  let rx = parseFloat(ellipseElement.getAttribute('rx'));
  let ry = parseFloat(ellipseElement.getAttribute('ry'));

  let points = [];
  let circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  let numPoints = circumference / POINT_DENSITY;


  for (let i = 0; i <= numPoints; i++) {
    let angle = (i / numPoints) * 2 * Math.PI;
    let x = cx + rx * Math.cos(angle);
    let y = cy + ry * Math.sin(angle);
    if (!transform) points.push(createVector(x, y));
    else {
      let matrixValues = parseMatrix(transform);
      let beforeTransform = createVector(x, y);
      let transformed = applyMatrixToVector(beforeTransform,matrixValues);
      points.push(transformed);
    }
  }
  points.push(points[0].copy()); //close the shape
  PATHS.push(points);
}

function processRectElement(rectElement) {
  let transform = rectElement.getAttribute('transform');

  let x = parseFloat(rectElement.getAttribute('x'));
  let y = parseFloat(rectElement.getAttribute('y'));
  let w = parseFloat(rectElement.getAttribute('width'));
  let h = parseFloat(rectElement.getAttribute('height'));

  let points = [];
  let perimeter = 2 * (w + h);
  let numPoints = perimeter / POINT_DENSITY;

  // Loop around the perimeter of the rectangle
  for (let i = 0; i <= numPoints; i++) {
    let t = (i / numPoints) * perimeter;

    if(!transform){
      if (t <= w) {
        points.push(createVector(x + t, y));
      } else if (t <= w + h) {
        points.push(createVector(x + w, y + t - w));
      } else if (t <= 2 * w + h) {
        points.push(createVector(x + w - (t - w - h), y + h));
      } else {
        points.push(createVector(x, y + h - (t - 2 * w - h)));
      }
    } else {
      let matrixValues = parseMatrix(transform);
      if (t <= w) {
        let beforeTransform = createVector(x + t, y);
        let transformed = applyMatrixToVector(beforeTransform,matrixValues);
        points.push(transformed);
      } else if (t <= w + h) {
        let beforeTransform = createVector(x + w, y + t - w);
        let transformed = applyMatrixToVector(beforeTransform,matrixValues);
        points.push(transformed);
      } else if (t <= 2 * w + h) {
        let beforeTransform = createVector(x + w - (t - w - h), y + h);
        let transformed = applyMatrixToVector(beforeTransform,matrixValues);
        points.push(transformed);
      } else {
        let beforeTransform = createVector(x, y + h - (t - 2 * w - h));
        let transformed = applyMatrixToVector(beforeTransform,matrixValues);
        points.push(transformed);
      }
    }
    
  }
  points.push(points[0].copy()); //close the shape
  PATHS.push(points);
}

function processPolygonElement(polygonElement) {
  let rawPoints = polygonElement.getAttribute('points').trim().split(/\s+|,/);
  let points = [];

  for (let i = 0; i < rawPoints.length; i += 2) {
    let x1 = parseFloat(rawPoints[i]);
    let y1 = parseFloat(rawPoints[i + 1]);
    let x2, y2;
    
    if (i < rawPoints.length - 2) {
      x2 = parseFloat(rawPoints[i + 2]);
      y2 = parseFloat(rawPoints[i + 3]);
    } else { // Closing the polygon
      x2 = parseFloat(rawPoints[0]);
      y2 = parseFloat(rawPoints[1]);
    }

    points.push(...interpolatePoints(x1, y1, x2, y2, POINT_DENSITY));
  }
  points.push(points[0].copy()); //close the shape
  PATHS.push(points);
}


function processPolylineElement(polylineElement) {
  let rawPoints = polylineElement.getAttribute('points').trim().split(/\s+|,/);
  let points = [];

  for (let i = 0; i < rawPoints.length - 2; i += 2) {
    let x1 = parseFloat(rawPoints[i]);
    let y1 = parseFloat(rawPoints[i + 1]);
    let x2 = parseFloat(rawPoints[i + 2]);
    let y2 = parseFloat(rawPoints[i + 3]);

    points.push(...interpolatePoints(x1, y1, x2, y2, POINT_DENSITY));
  }
  
  PATHS.push(points);
}



function interpolatePoints(x1, y1, x2, y2, pointDensity) {
  if (x1 === x2 && y1 === y2) return [createVector(x1, y1)];
  let points = [];
  let lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  let numPoints = lineLength / pointDensity;

  for (let i = 0; i <= numPoints; i++) {
    let t = i / numPoints;
    let x = x1 + t * (x2 - x1);
    let y = y1 + t * (y2 - y1);
    points.push(createVector(x, y));
  }

  return points;
}











//split paths to subpaths
function splitSubPaths(pathData) {
  pathStartPoint = createVector(0,0);
  let parts = pathData.split(/(?=[Mm])/);
  return parts;
}

// split subpath to sequence of points 
function extractPointsFromPath(pathData) {
  let points = [];
  if(pathData.charAt(0) === 'M') pathStartPoint = createVector(0,0);
  
  let pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', pathData);

  let totalLength = pathElement.getTotalLength();
  let numPoints = totalLength / POINT_DENSITY; //POINT_DENSITY -- global variable

  for (let i = 0; i <= numPoints; i++) {
    let pointPosition = i * POINT_DENSITY;
    let point = pathElement.getPointAtLength(pointPosition);
    points.push(createVector(point.x + pathStartPoint.x, point.y + pathStartPoint.y));
  }
  pathStartPoint = points[0];
  return points;
}




function parseMatrix(transformStr) {
  if (transformStr.startsWith("matrix")) {
    return transformStr.match(/matrix\(([^)]+)\)/)[1].split(' ').map(Number);
  } else if (transformStr.startsWith("rotate")) {
    let [angle, cx = 0, cy = 0] = transformStr.match(/rotate\(([^)]+)\)/)[1].split(' ').map(Number);
    angle = angle * Math.PI / 180; 
    let cosAngle = Math.cos(angle);
    let sinAngle = Math.sin(angle);
    let tx = cx - cx * cosAngle + cy * sinAngle;
    let ty = cy - cx * sinAngle - cy * cosAngle;

    return [cosAngle, sinAngle, -sinAngle, cosAngle, tx, ty];
  }
  return null; 
}

function applyMatrixToVector(vector, matrixValues) {
  let [a, b, c, d, e, f] = matrixValues;
  let xNew = a * vector.x + c * vector.y + e;
  let yNew = b * vector.x + d * vector.y + f;
  return createVector(xNew, yNew);
}

function isPathClosed(pathData) {
  let commands = pathData.split(/(?=[LMCSTQAHVZlmcsqtahvz])/);
  let lastCommand = commands[commands.length - 1].trim();
  return (/Z|z/.test(lastCommand));
}


function getSvgDimensions(svgString) {
  let width,height;
  let viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  if (viewBoxMatch) {
    let viewBoxValues = viewBoxMatch[1].split(/\s+|,/).map(Number);
    if (viewBoxValues.length === 4) {
      width =  viewBoxMatch ? viewBoxMatch[1].split(/\s+|,/).map(Number)[2] : null;
      height = viewBoxMatch ? viewBoxMatch[1].split(/\s+|,/).map(Number)[3] : null;
    }
  }

  if (width === null || height === null) {
    let widthMatch = svgString.match(/width="([^"]+)"/);
    let heightMatch = svgString.match(/height="([^"]+)"/);
    if (widthMatch)  width  = width===null  ? parseFloat(widthMatch[1])  : width;
    if (heightMatch) height = height===null ? parseFloat(heightMatch[1]) : height;

  }
  
  return [width, height];
}


function fitToCanvas(w,h){
  const maxH = height;
  const maxW = width;
  const k1 = maxH/maxW;
  const k = h / w;
  let scalar;
  if(k1>k){ // svg wider than canvas
    scalar = maxW / w;
  } else { // svg taller than canvas
    scalar = maxH / h;
  }
  for(let subPath of PATHS){
    for(let pt of subPath){
      pt.mult(scalar);
    }
  }
}


function calcDensity(svgData){
  let [w,h] = getSvgDimensions(svgData);
  return max(w,h) * 0.0075;
}

