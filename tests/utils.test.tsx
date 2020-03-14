import { divide } from 'mathjs';
import Matrix from '../src/utils/matrix';
import { Line } from '../src/utils/mathUtil';

describe('Utils', () => {
  describe('Matrix', () => {
    it('fill', () => {
      const m = new Matrix(2, 3);
      m.fill([1, 2, 3, 4, 5, 6]);

      expect(m.getMatrix()).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);

      expect(m.get(0, 0)).toEqual(1);
      expect(m.get(1, 0)).toEqual(2);
      expect(m.get(0, 1)).toEqual(3);
      expect(m.get(1, 1)).toEqual(4);
      expect(m.get(0, 2)).toEqual(5);
      expect(m.get(1, 2)).toEqual(6);

      m.set(0, 2, 9);
      expect(m.get(0, 2)).toEqual(9);
    });

    it('fromTransform', () => {
      const m = Matrix.fromTransform(1, 2, 3, 4, 5, 6);
      expect(m.getMatrix()).toEqual([
        [1, 3, 5],
        [2, 4, 6],
        [0, 0, 1],
      ]);
    });

    it('multiple', () => {
      const m1 = new Matrix(3, 2);
      const m2 = new Matrix(2, 3);
      m1.fill([1, 2, 3, 4, 5, 6]);
      m2.fill([1, 2, 3, 4, 5, 6]);
      const result = m1.multiple(m2);

      expect(result.getMatrix()).toEqual([
        [22, 28],
        [49, 64],
      ]);
    });

    it('leftDivide', () => {
      const m1 = new Matrix(2, 2, [1, 2, 3, 4]);
      const m2 = new Matrix(2, 2, [5, 6, 7, 8]);
      const multiple = m1.multiple(m2);
      expect(multiple.leftDivide(m1).getMatrix()).toEqual(m2.getMatrix());
    });

    it('rightDivide', () => {
      const m1 = new Matrix(2, 2, [1, 2, 3, 4]);
      const m2 = new Matrix(2, 2, [5, 6, 7, 8]);
      const multiple = m1.multiple(m2);
      expect(multiple.rightDivide(m2).getMatrix()).toEqual(m1.getMatrix());
    });
  });

  describe('Line', () => {
    it('fromPoints', () => {
      expect(
        Line.fromPoints({ x: 1, y: 2 }, { x: 1, y: 3 }).toUnits(),
      ).toEqual([null, null, 1, null]);

      expect(
        Line.fromPoints({ x: 1, y: 2 }, { x: 3, y: 2 }).toUnits(),
      ).toEqual([null, null, null, 2]);

      expect(
        Line.fromPoints({ x: 1, y: 2 }, { x: 2, y: 3 }).toUnits(),
      ).toEqual([1, 1, null, null]);
    });

    it('crossPoint', () => {
      const verticalLine = Line.fromPoints({ x: 1, y: 2 }, { x: 1, y: 3 });
      const horizontalLine = Line.fromPoints({ x: 1, y: 2 }, { x: 9, y: 2 });
      const line1 = Line.fromPoints({ x: 0, y: 1 }, { x: 1, y: 2 });
      const line2 = Line.fromPoints({ x: 0, y: 1 }, { x: -1, y: 2 });

      expect(verticalLine.crossPoint(horizontalLine)).toEqual({ x: 1, y: 2 });
      expect(horizontalLine.crossPoint(verticalLine)).toEqual({ x: 1, y: 2 });
      expect(verticalLine.crossPoint(line1)).toEqual({ x: 1, y: 2 });
      expect(horizontalLine.crossPoint(line1)).toEqual({ x: 1, y: 2 });
      expect(line1.crossPoint(line2)).toEqual({ x: 0, y: 1 });
    });

    it('translate', () => {
      const verticalLine = Line.fromPoints({ x: 1, y: 2 }, { x: 1, y: 3 });
      const horizontalLine = Line.fromPoints({ x: 1, y: 2 }, { x: 9, y: 2 });
      const line1 = Line.fromPoints({ x: 0, y: 1 }, { x: 1, y: 3 });

      expect(verticalLine.translate(1, 1).toUnits()).toEqual([
        null,
        null,
        2,
        null,
      ]);
      expect(horizontalLine.translate(1, 1).toUnits()).toEqual([
        null,
        null,
        null,
        3,
      ]);

      expect(line1.toUnits()).toEqual([2, 1, null, null]);
      expect(line1.translate(0, 1).toUnits()).toEqual([2, 2, null, null]);
      expect(line1.translate(1, 1).toUnits()).toEqual([2, 0, null, null]);
    });
  });
});
