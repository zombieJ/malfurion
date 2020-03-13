import { Point } from '../interface';

/**
 *
 * @param list [x, y, z][]
 * @returns [a, b,c ]
 */
export function resolveTernary(list: [number, number, number][]) {
  const z0 = list[0][2];
  const z1 = list[1][2];
  const z2 = list[2][2];
  const x0 = list[0][0];
  const x1 = list[1][0];
  const x2 = list[2][0];
  const y0 = list[0][1];
  const y1 = list[1][1];
  const y2 = list[2][1];

  const aLeft = (z0 - z1) * (y1 - y2) - (z1 - z2) * (y0 - y1);
  const aRight = (x0 - x1) * (y1 - y2) - (x1 - x2) * (y0 - y1);
  const a = aLeft / aRight;

  let b: number;
  if (y0 !== y1) {
    b = (z0 - z1 - (x0 - x1) * a) / (y0 - y1);
  } else {
    b = (z1 - z2 - (x1 - x2) * a) / (y1 - y2);
  }

  const c = z0 - a * x0 - b * y0;

  return [a, b, c];
}

class Line {
  a: number | null;

  b: number | null;

  x: number | null;

  y: number | null;

  constructor(
    a: number | null,
    b: number | null,
    x: number | null = null,
    y: number | null = null,
  ) {
    this.a = a;
    this.b = b;
    this.x = x;
    this.y = y;
  }

  translate = (x: number = 0, y: number = 0) => {
    if (this.isVertical()) {
      return new Line(this.a, this.b, this.x! + x, this.y);
    }
    if (this.isHorizontal()) {
      return new Line(this.a, this.b, this.x, this.y! + y);
    }

    return new Line(this.a, this.b! + y - this.a! * x, this.x, this.y);
  };

  isVertical = () => this.x !== null;

  isHorizontal = () => this.y !== null;

  crossPoint = (line: Line): Point => {
    if (this.isVertical()) {
      return {
        x: this.x!,
        y: line.isHorizontal() ? line.y! : line.a! * this.x! + line.b!,
      };
    }

    if (this.isHorizontal()) {
      return {
        x: line.isVertical() ? line.x! : (this.y! - line.b!) / line.a!,
        y: this.y!,
      };
    }

    const crossX = (line.b! - this.b!) / (this.a! - line.a!);
    return {
      x: crossX,
      y: this.a! * crossX + this.b!,
    };
  };

  toUnits = () => [this.a, this.b, this.x, this.y];
}

/**
 *
 * @param p1 Point
 * @param p2 Point
 * @returns [a, b]
 */
export function pointsToLine(p0: Point, p1: Point): Line {
  // Vertical
  if (p0.x === p1.x) {
    return new Line(null, null, p0.x, null);
  }

  // Horizontal
  if (p0.y === p1.y) {
    return new Line(null, null, null, p0.y);
  }

  const a = (p0.y - p1.y) / (p0.x - p1.x);
  const b = p0.y - a * p0.x;

  return new Line(a, b);
}
