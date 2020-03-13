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
