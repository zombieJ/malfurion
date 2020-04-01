import { SVGNodeRecord, SVGEntity, SVGNodeEntity, SVGBox } from '../interface';
import Matrix from './matrix';

function getColor(str: string = '') {
  const { style } = new Option();
  style.color = str;

  if (style.color) {
    return style.color;
  }

  return null;
}

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

/**
 *
 * @param node svg element
 * @param loopChildren only used for defs element
 * @param postRecord some additional work
 */
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

  // Get attributes
  const attributes = getAttributes(node);

  const record = {
    tagName: node.tagName,
    attributes,
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

  const leftTop = matrix.transformPosition(x, y);
  const rightTop = matrix.transformPosition(x + width, y);
  const leftBottom = matrix.transformPosition(x, y + height);
  const rightBottom = matrix.transformPosition(x + width, y + height);

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
  parent: SVGNodeEntity | null,
  nodes: SVGGraphicsElement[],
  entity: SVGEntity,
  isDefs: boolean = false,
): SVGNodeEntity[] {
  const nodeEntities: SVGNodeEntity[] = [];

  function postRecord(record: SVGNodeRecord) {
    /* eslint-disable no-param-reassign */
    // Replace any id content
    if (record.attributes.id) {
      const newId = `MALFURION_${uuid}`;
      entity.ids[record.attributes.id] = newId;
      record.attributes.id = newId;
      uuid += 1;
    }

    // Normalize colors
    const fillColor = getColor(record.attributes.fill);
    if (fillColor) {
      record.attributes.fill = fillColor;
    }

    const strokeColor = getColor(record.attributes.stroke);
    if (strokeColor) {
      record.attributes.stroke = strokeColor;
    }
    /* eslint-enable */
  }

  nodes.forEach(node => {
    const { tagName, children, childNodes } = node;

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
            box: getBox(node, true),
            children: [],
          };

          nodeEntity.children = analysisNodes(
            nodeEntity,
            Array.from(children) as SVGGraphicsElement[],
            entity,
          );

          // Handle additional text children
          if (childNodes.length && !children.length) {
            nodeEntity.innerHTML = node.innerHTML;
          }

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
    const rootNode: SVGNodeEntity = {
      parent: null,
      tagName: 'g',
      box: rootRect,
      attributes: {},
      children: rootNodes,
    };

    rootNodes.forEach(node => {
      node.parent = rootNode;
    });

    rootNodes = [rootNode];
  }

  entity.nodes = rootNodes;

  return entity;
}

export function parseTransformMatrix(transform: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(g);
  document.body.appendChild(svg);
  g.setAttribute('transform', transform);
  const matrix = g.getCTM();
  document.body.removeChild(svg);
  return matrix;
}
