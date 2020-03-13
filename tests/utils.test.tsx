import Matrix from '../src/utils/matrix';
import { pointsToLine } from '../src/utils/mathUtil';

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

      expect(m1.multiple(m2).getMatrix()).toEqual([
        [22, 28],
        [49, 64],
      ]);
    });
  });

  describe('line', () => {
    it('pointsToLine', () => {
      expect(pointsToLine({ x: 1, y: 2 }, { x: 1, y: 3 }).toUnits()).toEqual([
        null,
        null,
        1,
        null,
      ]);

      expect(pointsToLine({ x: 1, y: 2 }, { x: 3, y: 2 }).toUnits()).toEqual([
        null,
        null,
        null,
        2,
      ]);

      expect(pointsToLine({ x: 1, y: 2 }, { x: 2, y: 3 }).toUnits()).toEqual([
        1,
        1,
        null,
        null,
      ]);
    });

    it('crossPoint', () => {
      const verticalLine = pointsToLine({ x: 1, y: 2 }, { x: 1, y: 3 });
      const horizontalLine = pointsToLine({ x: 1, y: 2 }, { x: 9, y: 2 });
      const line1 = pointsToLine({ x: 0, y: 1 }, { x: 1, y: 2 });
      const line2 = pointsToLine({ x: 0, y: 1 }, { x: -1, y: 2 });

      expect(verticalLine.crossPoint(horizontalLine)).toEqual({ x: 1, y: 2 });
      expect(horizontalLine.crossPoint(verticalLine)).toEqual({ x: 1, y: 2 });
      expect(verticalLine.crossPoint(line1)).toEqual({ x: 1, y: 2 });
      expect(horizontalLine.crossPoint(line1)).toEqual({ x: 1, y: 2 });
      expect(line1.crossPoint(line2)).toEqual({ x: 0, y: 1 });
    });
  });
});
