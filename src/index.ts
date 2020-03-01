import { getNodeRecord } from './util';
import { SVGEntity, SVGNodeEntity, SVGBox, SVGNodeRecord } from './interface';

function analysisNodes(
  nodes: SVGGraphicsElement[],
  entity: SVGEntity,
  isDefs: boolean = false,
): SVGNodeEntity[] {
  const nodeEntities: SVGNodeEntity[] = [];

  nodes.forEach(node => {
    const { tagName, children } = node;

    switch (tagName) {
      case 'title':
      case 'desc':
        return;

      case 'mask':
        entity.defs.push(getNodeRecord(node, true));
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
          entity.defs.push(getNodeRecord(node, true));
        } else {
          nodeEntities.push({
            ...getNodeRecord(node),
            rect: node.getBBox(),
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

function analysisSVG(list: any): SVGEntity {
  const entity: SVGEntity = {
    ids: {},
    defs: [],
    nodes: [],
  };
  const elements: SVGGraphicsElement[] = Array.from(list);

  entity.nodes = analysisNodes(elements, entity);

  return entity;
}

class Malfurion {
  private entity: SVGEntity;

  private rect: SVGBox;

  public static DEBUG: boolean = false;

  constructor(source: string) {
    if (Malfurion.DEBUG) {
      console.time('parseSVG');
    }
    const holder = document.createElement('div');
    holder.innerHTML = source;
    const svg = holder.querySelector('svg')!;
    document.body.appendChild(svg);

    // Calculate rect
    this.entity = analysisSVG(svg.children);
    this.rect = svg.getBBox();

    // Clean up
    document.body.removeChild(svg);

    if (Malfurion.DEBUG) {
      console.timeEnd('parseSVG');
    }
  }

  getSVG = () => {
    if (Malfurion.DEBUG) {
      console.time('getSVG');
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    function fillNodes(holder: Element, nodes: SVGNodeRecord[]) {
      nodes.forEach(({ tagName, attributes, children }) => {
        const ele = document.createElementNS(
          'http://www.w3.org/2000/svg',
          tagName,
        );

        // Attributes
        Object.keys(attributes).forEach(key => {
          const value = attributes[key];

          if (key.includes('xlink:')) {
            ele.setAttributeNS(
              'http://www.w3.org/1999/xlink',
              'xlink:href',
              value,
            );
          } else {
            ele.setAttribute(key, value);
          }
        });

        // Children
        fillNodes(ele, children);

        holder.appendChild(ele);
      });
    }

    fillNodes(defs, this.entity.defs);
    fillNodes(svg, this.entity.nodes);

    if (Malfurion.DEBUG) {
      console.timeEnd('getSVG');
    }

    return svg;
  };
}

export default Malfurion;
