import { SVGNodeRecord, SVGEntity, SVGNodeEntity, SVGBox } from './interface';

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

export function getBox(ele: SVGGraphicsElement, pure: boolean = false) {
  const { x, y, width, height } = ele.getBBox();

  if (pure) {
    return { x, y, width, height };
  }

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

let uuid = 0;

export function analysisNodes(
  nodes: SVGGraphicsElement[],
  entity: SVGEntity,
  isDefs: boolean = false,
): SVGNodeEntity[] {
  const nodeEntities: SVGNodeEntity[] = [];

  function postRecord(record: SVGNodeRecord) {
    if (record.attributes.id) {
      const newId = `MALFURION_${uuid}`;
      entity.ids[record.attributes.id] = newId;
      record.attributes.id = newId;
      uuid += 1;
    }
  }

  nodes.forEach(node => {
    const { tagName, children } = node;

    switch (tagName) {
      case 'title':
      case 'desc':
        return;

      case 'mask':
        entity.defs.push(getNodeRecord(node, true, postRecord));
        return;

      case 'defs':
        analysisNodes(
          Array.from(children) as SVGGraphicsElement[],
          entity,
          true,
        );
        return;

      default:
        if (isDefs) {
          entity.defs.push(getNodeRecord(node, true, postRecord));
        } else {
          nodeEntities.push({
            ...getNodeRecord(node, false, postRecord),
            rect: getBox(node),
            box: getBox(node, true),
            children: analysisNodes(
              Array.from(children) as SVGGraphicsElement[],
              entity,
            ),
          });
        }
    }
  });

  return nodeEntities;
}

export function analysisSVG(list: any, rootRect: SVGBox): SVGEntity {
  const entity: SVGEntity = {
    ids: {},
    defs: [],
    nodes: [],
  };
  const elements: SVGGraphicsElement[] = Array.from(list);
  let rootNodes = analysisNodes(elements, entity);

  if (rootNodes.length > 1) {
    rootNodes = [
      {
        tagName: 'g',
        rect: rootRect,
        box: rootRect,
        attributes: {},
        children: rootNodes,
      },
    ];
  }

  entity.nodes = rootNodes;

  return entity;
}

export class PathCache {
  private elementPathMap = new Map<Element, string>();

  private pathElementMap = new Map<string, Element>();

  public set = (element: Element, path: number[]) => {
    const strPath = path.join('-');
    this.elementPathMap.set(element, strPath);
    this.pathElementMap.set(strPath, element);
  };

  public getElement = (path: number[]) =>
    this.pathElementMap.get(path.join('-')) || null;

  public getPath = (element: Element) => {
    const path = this.elementPathMap.get(element);
    return path ? path.split('-').map(pos => Number(pos)) : null;
  };
}
