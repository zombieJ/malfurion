import { parseTransformMatrix } from './svgUtil';
import { resolveTernary } from './mathUitl';

interface Position {
  x: number;
  y: number;
}

export default class Matrix {
  protected matrix: number[][];

  public static fromTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) {
    const instance = new Matrix(3, 3);

    instance.set(0, 0, a);
    instance.set(0, 1, b);
    instance.set(1, 0, c);
    instance.set(1, 1, d);
    instance.set(2, 0, e);
    instance.set(2, 1, f);
    instance.set(2, 2, 1);

    return instance;
  }

  public static fromTranslate(x: number = 0, y: number = 0) {
    return Matrix.fromTransform(1, 0, 0, 1, x, y);
  }

  public static fromTransformText(str: string) {
    const matrix = parseTransformMatrix(str);

    if (matrix) {
      const { a, b, c, d, e, f } = matrix;
      return Matrix.fromTransform(a, b, c, d, e, f);
    }

    return Matrix.fromTranslate();
  }

  public static backFromPosition(
    list: {
      source: Position;
      target: Position;
    }[],
  ) {
    const [a, c, e] = resolveTernary([
      [list[0].source.x, list[0].source.y, list[0].target.x],
      [list[1].source.x, list[1].source.y, list[1].target.x],
      [list[2].source.x, list[2].source.y, list[2].target.x],
    ]);

    const [b, d, f] = resolveTernary([
      [list[0].source.x, list[0].source.y, list[0].target.y],
      [list[1].source.x, list[1].source.y, list[1].target.y],
      [list[2].source.x, list[2].source.y, list[2].target.y],
    ]);

    return Matrix.fromTransform(a, b, c, d, e, f);
  }

  constructor(x: number, y: number, values?: number[]) {
    this.matrix = [];

    for (let i = 0; i < y; i += 1) {
      this.matrix[i] = [];

      for (let j = 0; j < x; j += 1) {
        this.matrix[i][j] = 0;
      }
    }

    if (values) {
      this.fill(values);
    }
  }

  public fill = (values: number[]) => {
    let i = 0;
    const targetX = this.getX();
    const targetY = this.getY();

    for (let y = 0; y < targetY; y += 1) {
      for (let x = 0; x < targetX; x += 1) {
        this.set(x, y, values[i] || 0);
        i += 1;
      }
    }
  };

  set = (x: number, y: number, value: number) => {
    this.matrix[y][x] = value;
  };

  get = (x: number, y: number): number => this.matrix[y][x];

  getX = () => this.matrix[0].length;

  getY = () => this.matrix.length;

  getMatrix = () => this.matrix;

  multiple = (instance: Matrix) => {
    const targetY = this.getY();
    const targetX = instance.getX();
    const calLen = this.getX();

    const result = new Matrix(targetX, targetY);

    for (let x = 0; x < targetX; x += 1) {
      for (let y = 0; y < targetY; y += 1) {
        let val = 0;

        for (let i = 0; i < calLen; i += 1) {
          val += this.get(i, y) * instance.get(x, i);
        }
        result.set(x, y, val);
      }
    }

    return result;
  };

  transformPosition = (x: number, y: number) => {
    const matrix = new Matrix(1, 3, [x, y, 1]);
    const ret = this.multiple(matrix);
    return {
      x: ret.get(0, 0),
      y: ret.get(0, 1),
    };
  };

  toTransform = (): [number, number, number, number, number, number] => [
    this.get(0, 0),
    this.get(0, 1),
    this.get(1, 0),
    this.get(1, 1),
    this.get(2, 0),
    this.get(2, 1),
  ];

  toString = () => {
    const transform = this.toTransform();
    return `matrix(${transform.join(',')})`;
  };
}
