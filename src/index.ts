import { getNodeRecord, getBox } from './util';
import {
  SVGEntity,
  SVGNodeEntity,
  SVGBox,
  SVGNodeRecord,
  SVGEvents,
} from './interface';

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
    if (Malfurion.DEBUG) {
      console.time('parseSVG');
    }
    const holder = document.createElement('div');
    holder.innerHTML = source;
    const svg = holder.querySelector('svg')!;
    document.body.appendChild(svg);

    // Calculate rect
    this.entity = analysisSVG(svg.children);
    this.rect = getBox(svg);

    // Clean up
    document.body.removeChild(svg);

    if (Malfurion.DEBUG) {
      console.timeEnd('parseSVG');
      console.log('Entity:', this.entity);
    }
  }

  getSVG = (events: SVGEvents = {}) => {
    // Create id cache
    const idCacheList = Object.keys(this.entity.ids)
      .sort((id1, id2) => id2.length - id1.length)
      .map(id => [id, this.entity.ids[id]]);

    if (Malfurion.DEBUG) {
      console.time('getSVG');
    }

    // Render svg
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    (svg as any)[MALFURION_INSTANCE] = this;
    svg.appendChild(defs);

    function fillNodes(holder: Element, nodes: SVGNodeRecord[]) {
      nodes.forEach(({ tagName, attributes, children }) => {
        const ele = document.createElementNS(
          'http://www.w3.org/2000/svg',
          tagName,
        );

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
        fillNodes(ele, children);

        holder.appendChild(ele);
      });
    }

    fillNodes(defs, this.entity.defs);
    fillNodes(svg, this.entity.nodes);

    if (Malfurion.DEBUG) {
      console.timeEnd('getSVG');
    }

    // Events
    if (events.onClick) {
      svg.addEventListener('click', (e: any) => {
        events.onClick!(e, this);
      });
    }
    if (events.onMouseEnter) {
      svg.addEventListener('mouseEnter', (e: any) => {
        events.onMouseEnter!(e, this);
      });
    }
    if (events.onMouseLeave) {
      svg.addEventListener('mouseLeave', (e: any) => {
        events.onMouseLeave!(e, this);
      });
    }

    return svg;
  };

  getPath = (element: any): number[] => {
    const path: number[] = [];
    let parent: any = element.parentNode;
    let current = element;

    while (parent) {
      const index = Array.from(parent.children).indexOf(current);
      path.unshift(index);

      current = parent;
      parent = parent.parentNode;

      if (current[MALFURION_INSTANCE]) {
        break;
      }
    }

    return path;
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
}

export default Malfurion;
