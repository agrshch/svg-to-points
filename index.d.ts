/**
 * SVG Path Extractor TypeScript Definitions
 * @version 1.0.0
 */

export interface Point {
  x: number;
  y: number;
}

export interface SVGPathExtractorOptions {
  /**
   * Fixed point density (distance between points)
   * If null, will be calculated automatically based on SVG dimensions
   */
  pointDensity?: number | null;
  
  /**
   * Factor used for automatic density calculation
   * Density = max(width, height) * densityFactor
   * @default 0.0075
   */
  densityFactor?: number;
  
  /**
   * Maximum number of points to extract (safety limit)
   * @default 1000000
   */
  maxPoints?: number;
  
  /**
   * Only process specific element types
   */
  includeOnly?: string[] | null;
  
  /**
   * Exclude specific element types
   */
  excludeElements?: string[];
  
  /**
   * Normalize all paths to specific size
   */
  normalizeToSize?: { width: number; height: number } | null;
  
  /**
   * Close closed shapes by duplicating first point at end
   * Applies only to inherently closed shapes: polygon, circle, ellipse, rect, and closed paths (ending with Z/z)
   * @default true
   */
  closePaths?: boolean;
}

export interface SVGDimensions {
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PathMetadata {
  points: Point[];
  element: string;
  id?: string;
  className?: string;
  attributes: Record<string, string>;
}

export declare class SVGPathExtractor {
  public readonly options: Required<SVGPathExtractorOptions>;
  public warnings: string[];

  /**
   * Create a new SVG Path Extractor instance
   * @param options Configuration options
   */
  constructor(options?: SVGPathExtractorOptions);

  /**
   * Extract points from SVG content
   * @param svgContent SVG content as string
   * @param pointDensity Point density override (optional)
   * @returns Array of paths, each containing points in {x, y} format
   */
  extractPoints(svgContent: string, pointDensity?: number | null): Promise<Point[][]>;

  /**
   * Extract points with metadata about source elements
   * @param svgContent SVG content as string
   * @param pointDensity Point density override (optional)
   * @returns Array of path metadata objects
   */
  extractPointsWithMetadata(svgContent: string, pointDensity?: number | null): Promise<PathMetadata[]>;

  /**
   * Extract points from SVG file (Node.js only)
   * @param filePath Path to SVG file
   * @param pointDensity Point density override (optional)
   * @returns Array of paths, each containing points in {x, y} format
   */
  extractPointsFromFile(filePath: string, pointDensity?: number | null): Promise<Point[][]>;

  /**
   * Get bounding box of all paths
   * @param paths Array of paths
   * @returns Bounding box coordinates and dimensions
   */
  getBoundingBox(paths: Point[][]): BoundingBox;

  /**
   * Get total length of all paths
   * @param paths Array of paths
   * @returns Total length in SVG units
   */
  getTotalLength(paths: Point[][]): number;

  /**
   * Get center point (centroid) of all paths
   * @param paths Array of paths
   * @returns Center point coordinates
   */
  getCenter(paths: Point[][]): Point;
}

export default SVGPathExtractor; 