import { multiply, inv } from 'mathjs';
import { Point, ShapeInfo } from '../interface';
import { parseTransformMatrix } from './svgUtil';
import { resolveTernary } from './mathUtil';

export default class Matrix {
  protected matrix: number[][];

  public static fromArray(matrixArr: number[][]) {
    const instance = new Matrix(1, 1);
    instance.matrix = matrixArr;
    return instance;
  }

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
      source: Point;
      target: Point;
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

  public static fromRotate(
    rotate: number,
    { x, y, width, height, originX, originY }: Required<ShapeInfo>,
  ) {
    const deg = (rotate / 180) * Math.PI;
    const transX = x + width * originX;
    const transY = y + height * originY;
    const transToMatrix = Matrix.fromTranslate(transX, transY);
    const transBackMatrix = Matrix.fromTranslate(-transX, -transY);
    const rotateMatrix = Matrix.fromTransform(
      Math.cos(deg),
      Math.sin(deg),
      -Math.sin(deg),
      Math.cos(deg),
      0,
      0,
    );

    return transToMatrix.multiple(rotateMatrix).multiple(transBackMatrix);
  }

  public static fromScale(
    scaleX: number,
    scaleY: number,
    { x, y, width, height, originX, originY }: Required<ShapeInfo>,
  ) {
    const transX = x + width * originX;
    const transY = y + height * originY;
    const transToMatrix = Matrix.fromTranslate(transX, transY);
    const transBackMatrix = Matrix.fromTranslate(-transX, -transY);
    const scaleMatrix = Matrix.fromTransform(scaleX, 0, 0, scaleY, 0, 0);

    return transToMatrix.multiple(scaleMatrix).multiple(transBackMatrix);
  }

  public static fromMixTransform(mixTransform: {
    translateX: number;
    translateY: number;
    rotate: number;
    scaleX: number;
    scaleY: number;
    originX: number;
    originY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    const { translateX, translateY, rotate, scaleX, scaleY } = mixTransform;

    let mergeMatrix = Matrix.fromTranslate();

    // Translate
    if (translateX || translateY) {
      const translateMatrix = Matrix.fromTranslate(translateX, translateY);
      mergeMatrix = mergeMatrix.multiple(translateMatrix);
    }

    // Rotate matrix
    if (rotate !== 0) {
      mergeMatrix = mergeMatrix.multiple(
        Matrix.fromRotate(rotate, mixTransform),
      );
    }

    // Scale matrix
    if (scaleX !== 1 || scaleY !== 1) {
      mergeMatrix = mergeMatrix.multiple(
        Matrix.fromScale(scaleX, scaleY, mixTransform),
      );
    }

    return mergeMatrix;
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
    const rets = multiply(this.getMatrix(), instance.getMatrix());

    return Matrix.fromArray(rets);
  };

  divide = (instance: Matrix) => {
    const inverse = Matrix.fromArray(inv(instance.getMatrix()));
    return inverse.multiple(this);
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
