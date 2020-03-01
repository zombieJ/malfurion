import { getNodeRecord } from './util';
import { SVGEntity, SVGNodeEntity } from './interface';

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
    defs: [],
    nodes: [],
  };
  const elements: SVGGraphicsElement[] = Array.from(list);

  entity.nodes = analysisNodes(elements, entity);

  return entity;
}

class Malfurion {
  private entity: SVGEntity;

  constructor(source: string) {
    const holder = document.createElement('div');
    holder.innerHTML = source;
    const svg = holder.querySelector('svg')!;
    document.body.appendChild(svg);

    // Calculate rect
    this.entity = analysisSVG(svg.children);
    console.error('>>>', this.entity);

    console.error('SSS:', svg.getBBox());

    // Clean up
    document.body.removeChild(svg);
  }

  getSVG = () => document.createElement('svg');
}

export default Malfurion;
