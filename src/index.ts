import { getBox, analysisSVG, PathCache } from './util';
import {
  SVGEntity,
  SVGNodeEntity,
  SVGBox,
  SVGNodeRecord,
  MalfurionEventHandler,
  MalfurionEventType,
} from './interface';
import Matrix from './utils/matrix';

export { SVGBox };

const MALFURION_INSTANCE = '__Malfurion_Instance__';

class Malfurion {
  public debug: boolean = false;

  private entity: SVGEntity;

  private rect: SVGBox;

  private svg: SVGSVGElement | null = null;

  private debugHolder: SVGElement | null = null;

  private pathCache: PathCache = new PathCache();

  private clickEventHandlers = new Set<MalfurionEventHandler>();

  private mouseEnterEventHandlers = new Set<MalfurionEventHandler>();

  private mouseLeaveEventHandlers = new Set<MalfurionEventHandler>();

  private elementEnterEventHandlers = new Set<MalfurionEventHandler>();

  private elementLeaveEventHandlers = new Set<MalfurionEventHandler>();

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

  addEventListener = (
    event: MalfurionEventType,
    callback: MalfurionEventHandler,
  ) => {
    switch (event) {
      case 'click':
        this.clickEventHandlers.add(callback);
        break;
      case 'mouseEnter':
        this.mouseEnterEventHandlers.add(callback);
        break;
      case 'mouseLeave':
        this.mouseLeaveEventHandlers.add(callback);
        break;
      case 'elementEnter':
        this.elementEnterEventHandlers.add(callback);
        break;
      case 'elementLeave':
        this.elementLeaveEventHandlers.add(callback);
        break;
      default:
        console.warn(`Malfurion do not support '${event}' type.`);
    }
  };

  private generateDebugHolder = () => {
    if (!this.svg) {
      return;
    }

    if (this.debugHolder) {
      this.svg.removeChild(this.debugHolder);
    }

    if (!this.debug) {
      return;
    }

    const debugHolder = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g',
    );

    const fillDebugNodes = (
      nodes: SVGNodeRecord[] | SVGNodeEntity[],
      path: number[] = [],
    ) => {
      nodes.forEach((node, index) => {
        const elePath = [...path, index];

        const {
          children,
          rect,
          originX = 0.5,
          originY = 0.5,
        } = node as SVGNodeEntity;

        if (rect) {
          const center = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'circle',
          );
          center.style.pointerEvents = 'none';
          center.setAttribute('cx', `${rect.x + rect.width * originX}`);
          center.setAttribute('cy', `${rect.y + rect.height * originY}`);
          center.setAttribute('r', '5');
          center.setAttribute('fill', 'blue');
          debugHolder.appendChild(center);
        }

        // Children
        fillDebugNodes(children, elePath);
      });
    };

    fillDebugNodes(this.entity.nodes);
    this.debugHolder = debugHolder;
    this.svg.appendChild(this.debugHolder);
  };

  getSVG = () => {
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

      this.svg = svg;
      (svg as any)[MALFURION_INSTANCE] = this;
      svg.appendChild(defs);

      const fillNodes = (
        holder: Element,
        nodes: SVGNodeRecord[] | SVGNodeEntity[],
        path: false | number[] = [],
      ) => {
        nodes.forEach((node, index) => {
          const { tagName, attributes, children } = node as SVGNodeEntity;

          const ele = document.createElementNS(
            'http://www.w3.org/2000/svg',
            tagName,
          );

          // Fill path data
          const elePath = path ? [...path, index] : path;
          if (elePath) {
            ele.setAttribute('data-path', elePath.join('-'));
            this.pathCache.set(ele, elePath);
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
        });
      };

      fillNodes(defs, this.entity.defs, false);
      fillNodes(svg, this.entity.nodes);

      if (this.debug) {
        this.generateDebugHolder();
        console.timeEnd('getSVG');
      }

      // Events
      svg.addEventListener('click', (e: any) => {
        this.clickEventHandlers.forEach(callback => callback(e, this));
      });
      svg.addEventListener('mouseenter', (e: any) => {
        this.mouseEnterEventHandlers.forEach(callback => callback(e, this));
      });
      svg.addEventListener('mouseleave', (e: any) => {
        this.mouseLeaveEventHandlers.forEach(callback => callback(e, this));
      });
      svg.addEventListener('mouseover', (e: any) => {
        this.elementEnterEventHandlers.forEach(callback => callback(e, this));
      });
      svg.addEventListener('mouseout', (e: any) => {
        this.elementLeaveEventHandlers.forEach(callback => callback(e, this));
      });
    }

    return this.svg;
  };

  getPath = (element: any): number[] | null => this.pathCache.getPath(element);

  getElement = (path: number[]): SVGGraphicsElement | null =>
    this.pathCache.getElement(path) as SVGGraphicsElement;

  private getNodeEntity = (path?: number[]) => {
    if (!path || !path.length) {
      return null;
    }

    let { nodes } = this.entity;

    for (let i = 0; i < path.length; i += 1) {
      const index = i === 0 ? 0 : path[i];
      const current = nodes[index];

      if (i === path.length - 1) {
        return current;
      }

      nodes = current.children;
    }

    return null;
  };

  getBox = (path?: number[], pure: boolean = false): SVGBox | null => {
    if (!path || !path.length) {
      return this.rect;
    }

    const entity = this.getNodeEntity(path);
    if (entity) {
      return pure ? entity.box : entity.rect;
    }

    return null;
  };

  private internalTransform = (
    path: number[],
    prop: keyof SVGNodeEntity,
    initialValue: number,
    value?: number | ((origin: number) => number),
    postUpdate?: (val: number) => number,
  ): number => {
    const entity = this.getNodeEntity(path);

    if (entity && value !== undefined) {
      const target =
        typeof value === 'function'
          ? value((entity[prop] as number) || initialValue)
          : value;

      (entity[prop] as number) = postUpdate ? postUpdate(target) : target;
      this.refresh(path);
    }

    return (entity && (entity[prop] as number)) || initialValue;
  };

  originX = (path: number[], value?: number | ((origin: number) => number)) => {
    this.internalTransform(path, 'originX', 0.5, value);
    this.generateDebugHolder();
  };

  originY = (path: number[], value?: number | ((origin: number) => number)) => {
    this.internalTransform(path, 'originY', 0.5, value);
    this.generateDebugHolder();
  };

  rotate = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'rotate', 0, value, val => val % 360);

  scaleX = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'scaleX', 1, value);

  scaleY = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'scaleY', 1, value);

  refresh = (path: number[]) => {
    const entity = this.getNodeEntity(path);

    if (entity) {
      const {
        rotate = 0,
        scaleX = 1,
        scaleY = 1,
        originX = 0.5,
        originY = 0.5,
      } = entity;
      const ele = this.getElement(path);
      const { attributes } = entity;

      const box = this.getBox(path, true);

      let mergeMatrix = Matrix.fromTranslate(0, 0);

      // Rotate matrix
      if (rotate !== 0) {
        const deg = (rotate / 180) * Math.PI;
        const transX = box!.x + box!.width * originX;
        const transY = box!.y + box!.height * originY;
        const transToMatrix = Matrix.fromTranslate(transX, transY);
        const transBackMatrix = Matrix.fromTranslate(-transX, -transY);
        const rotateMatrix = Matrix.fromTransform(
          Math.cos(deg),
          Math.sin(deg),
          -Math.sin(deg),
          Math.cos(deg),
          0,
          0,
        );

        mergeMatrix = mergeMatrix
          .multiple(transToMatrix)
          .multiple(rotateMatrix)
          .multiple(transBackMatrix);
      }

      // Scale matrix
      if (scaleX !== 1 || scaleY !== 1) {
        const transX = box!.x + box!.width * originX;
        const transY = box!.y + box!.height * originY;
        const transToMatrix = Matrix.fromTranslate(transX, transY);
        const transBackMatrix = Matrix.fromTranslate(-transX, -transY);
        const scaleMatrix = Matrix.fromTransform(scaleX, 0, 0, scaleY, 0, 0);

        mergeMatrix = mergeMatrix
          .multiple(transToMatrix)
          .multiple(scaleMatrix)
          .multiple(transBackMatrix);
      }

      ele!.setAttribute(
        'transform',
        `${attributes.transform || ''} matrix(${mergeMatrix
          .toTransform()
          .join(',')})`,
      );
    }
  };
}

export default Malfurion;
