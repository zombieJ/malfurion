import { SVGNodeRecord } from './interface';

export function getAttributes({
  attributes,
}: {
  attributes: NamedNodeMap;
}): Record<string, string> {
  const attrs: Record<string, string> = {};
  Array.from(attributes).forEach(({ name, value }) => {
    attrs[name] = value;
  });
  return attrs;
}

interface AbstractNode {
  tagName: string;
  attributes: NamedNodeMap;
  children?: HTMLCollection;
}

export function getNodeRecord(
  node: AbstractNode,
  loopChildren: boolean,
  postRecord?: (record: SVGNodeRecord) => void,
): SVGNodeRecord {
  let subRecords: SVGNodeRecord[] = [];
  if (loopChildren) {
    subRecords = Array.from(node.children || []).map(subNode =>
      getNodeRecord(subNode, true),
    );
  }

  const record = {
    tagName: node.tagName,
    attributes: getAttributes(node),
    children: subRecords,
  };

  if (postRecord) {
    postRecord(record);
  }

  return record;
}

type Matrix = [number, number, number, number, number, number];

function transformPoint(
  { x, y }: { x: number; y: number },
  [a, b, c, d, e, f]: Matrix,
) {
  return {
    x: a * x + c * y + e,
    y: b * x + d * y + f,
  };
}

export function getBox(ele: SVGGraphicsElement) {
  const { x, y, width, height } = ele.getBBox();
  const { a, b, c, d, e, f } = ele.getCTM()!;
  const matrix: Matrix = [a, b, c, d, e, f];

  const leftTop = transformPoint({ x, y }, matrix);
  const rightTop = transformPoint({ x: x + width, y }, matrix);
  const leftBottom = transformPoint({ x, y: y + height }, matrix);
  const rightBottom = transformPoint({ x: x + width, y: y + height }, matrix);

  const xs = [leftTop.x, rightTop.x, leftBottom.x, rightBottom.x];
  const ys = [leftTop.y, rightTop.y, leftBottom.y, rightBottom.y];

  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);

  return { x: left, y: top, width: right - left, height: bottom - top };
}
