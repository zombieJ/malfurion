import { getNodeRecord, getBox } from './util';
import {
  SVGEntity,
  SVGNodeEntity,
  SVGBox,
  SVGNodeRecord,
  SVGEvents,
} from './interface';

export { SVGBox };

let uuid = 0;

const MALFURION_INSTANCE = '__Malfurion_Instance__';

function analysisNodes(
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

function analysisSVG(list: any, rootRect: SVGBox): SVGEntity {
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

class Malfurion {
  private entity: SVGEntity;

  private rect: SVGBox;

  private svg: SVGSVGElement | null = null;

  public debug: boolean = false;

  static getInstance = (svg: SVGSVGElement): Malfurion =>
    (svg as any)[MALFURION_INSTANCE];

  static getElement = (svg: any, path: number[]): SVGElement => {
    let element: any = svg;

    path.forEach(index => {
      if (element) {
        element = element.children[index];
      }
    });

    return element;
  };

  constructor(source: string) {
    const holder = document.createElement('div');
    holder.innerHTML = source;
    const svg = holder.querySelector('svg')!;
    document.body.appendChild(svg);

    // Calculate rect
    this.rect = getBox(svg);
    this.entity = analysisSVG(svg.children, this.rect);

    // Clean up
    document.body.removeChild(svg);
  }

  getSVG = (events: SVGEvents = {}) => {
    if (!this.svg) {
      // Create id cache
      const idCacheList = Object.keys(this.entity.ids)
        .sort((id1, id2) => id2.length - id1.length)
        .map(id => [id, this.entity.ids[id]]);

      if (this.debug) {
        console.time('getSVG');
      }

      // Render svg
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const defs = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'defs',
      );
      const debugHolder = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g',
      );
      (svg as any)[MALFURION_INSTANCE] = this;
      svg.appendChild(defs);

      const fillNodes = (
        holder: Element,
        nodes: SVGNodeRecord[] | SVGNodeEntity[],
        path: false | number[] = [],
      ) => {
        nodes.forEach((node, index) => {
          const {
            tagName,
            attributes,
            children,
            rect,
            box,
          } = node as SVGNodeEntity;

          const ele = document.createElementNS(
            'http://www.w3.org/2000/svg',
            tagName,
          );

          // Fill path data
          const elePath = path ? [...path, index] : path;
          if (elePath) {
            ele.setAttribute('data-path', elePath.join('-'));
          }

          // Attributes
          Object.keys(attributes).forEach(key => {
            let value = attributes[key];

            // Replace value with real id
            if (value.includes('#')) {
              idCacheList.forEach(([id, replaceId]) => {
                value = value.replace(`#${id}`, `#${replaceId}`);
              });
            }

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
          fillNodes(ele, children, elePath);

          // Append node
          holder.appendChild(ele);

          // ================ DEBUG ================
          if (this.debug && rect) {
            (ele as any).debugRect = rect;
            (ele as any).debugBox = box;
            console.log('~~~!!!!', rect, box);
            const center = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'circle',
            );
            (center as any).debugNode = ele;
            center.style.pointerEvents = 'none';
            center.setAttribute('cx', `${rect.x + rect.width / 2}`);
            center.setAttribute('cy', `${rect.y + rect.height / 2}`);
            center.setAttribute('r', '5');
            center.setAttribute('fill', 'blue');
            debugHolder.appendChild(center);
          }
        });
      };

      fillNodes(defs, this.entity.defs, false);
      fillNodes(svg, this.entity.nodes);

      if (this.debug) {
        svg.appendChild(debugHolder);
        console.timeEnd('getSVG');
      }

      // Events
      svg.addEventListener('click', (e: any) => {
        if (events.onClick) events.onClick(e, this);
      });
      svg.addEventListener('mouseenter', (e: any) => {
        if (events.onMouseEnter) events.onMouseEnter!(e, this);
      });
      svg.addEventListener('mouseleave', (e: any) => {
        if (events.onMouseLeave) events.onMouseLeave!(e, this);
      });
      svg.addEventListener('mouseover', (e: any) => {
        if (events.onElementEnter) events.onElementEnter!(e, this);
      });
      svg.addEventListener('mouseout', (e: any) => {
        if (events.onElementLeave) events.onElementLeave!(e, this);
      });

      this.svg = svg;
    }

    return this.svg;
  };

  getPath = (element: any): number[] => {
    const dataPath: string | null = element.getAttribute('data-path');
    if (!dataPath) {
      return [];
    }

    return dataPath.split('-').map(pos => Number(pos));
  };

  getBox = (path?: number[]): SVGBox | null => {
    if (!path || !path.length) {
      return this.rect;
    }

    let { nodes } = this.entity;

    for (let i = 0; i < path.length; i += 1) {
      const index = i === 0 ? 0 : path[i];
      const current = nodes[index];

      if (i === path.length - 1) {
        return current.rect;
      }

      nodes = current.children;
    }

    return null;
  };

  // rotate = (path: number[], rotate: number) => {};
}

export default Malfurion;
