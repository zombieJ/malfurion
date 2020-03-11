import { SVGNodeRecord, SVGEntity, SVGNodeEntity, SVGBox } from '../interface';
import Matrix from './matrix';

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

export function getBox(ele: SVGGraphicsElement, pure: boolean = false) {
  const { x, y, width, height } = ele.getBBox();

  if (pure) {
    return { x, y, width, height };
  }

  const { a, b, c, d, e, f } = ele.getCTM()!;
  const matrix: Matrix = Matrix.fromTransform(a, b, c, d, e, f);

  const leftTop = matrix.multiple(new Matrix(1, 3, [x, y, 1]));
  const rightTop = matrix.multiple(new Matrix(1, 3, [x + width, y, 1]));
  const leftBottom = matrix.multiple(new Matrix(1, 3, [x, y + height, 1]));
  const rightBottom = matrix.multiple(
    new Matrix(1, 3, [x + width, y + height, 1]),
  );

  const xs = [
    leftTop.get(0, 0),
    rightTop.get(0, 0),
    leftBottom.get(0, 0),
    rightBottom.get(0, 0),
  ];
  const ys = [
    leftTop.get(0, 1),
    rightTop.get(0, 1),
    leftBottom.get(0, 1),
    rightBottom.get(0, 1),
  ];

  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

let uuid = 0;

export function analysisNodes(
  parent: SVGNodeEntity | null,
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
          null,
          Array.from(children) as SVGGraphicsElement[],
          entity,
          true,
        );
        return;

      default:
        if (isDefs) {
          entity.defs.push(getNodeRecord(node, true, postRecord));
        } else {
          const nodeEntity: SVGNodeEntity = {
            ...getNodeRecord(node, false, postRecord),
            parent,
            rect: getBox(node),
            box: getBox(node, true),
            children: [],
          };

          nodeEntity.children = analysisNodes(
            nodeEntity,
            Array.from(children) as SVGGraphicsElement[],
            entity,
          );
          nodeEntities.push(nodeEntity);
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
  let rootNodes = analysisNodes(null, elements, entity);

  if (rootNodes.length > 1) {
    rootNodes = [
      {
        parent: null,
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
