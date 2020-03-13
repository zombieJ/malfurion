import { getBox, analysisSVG } from './utils/svgUtil';
import {
  SVGEntity,
  SVGNodeEntity,
  SVGBox,
  SVGNodeRecord,
  MalfurionEventHandler,
  MalfurionEventType,
  BoundingBox,
  BoundingBoxOrigin,
} from './interface';
import Matrix from './utils/matrix';
import { Line } from './utils/mathUtil';
import { PathCache } from './utils/cacheUtil';

export { BoundingBox, BoundingBoxOrigin, Matrix, Line };

export const MALFURION_INSTANCE = '__Malfurion_Instance__';

const DEFAULT_ORIGIN = 0.5;

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

    this.pathCache.getPathList().forEach(path => {
      const mergedTransform = this.getMergedTransform(path);
      const box = this.getOriginBox(path, true);
      const entity = this.getNodeEntity(path);

      if (box && entity) {
        const { originX = DEFAULT_ORIGIN, originY = DEFAULT_ORIGIN } = entity;
        const center = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        center.style.pointerEvents = 'none';
        center.setAttribute('cx', `${box.x + box.width * originX}`);
        center.setAttribute('cy', `${box.y + box.height * originY}`);
        center.setAttribute('r', '2');
        center.setAttribute('fill', 'blue');
        center.setAttribute('fill-opacity', '0.5');
        center.setAttribute('transform', mergedTransform);

        debugHolder.appendChild(center);
      }
    });
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
            this.pathCache.set(ele, elePath, node as SVGNodeEntity);
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

  /**
   * Return svg origin box related to the container.
   * When `pure` to `true`, return origin box related to context.
   */
  getOriginBox = (path?: number[], pure: boolean = false): SVGBox | null => {
    if (!path || !path.length) {
      return this.rect;
    }

    const entity = this.getNodeEntity(path);
    if (entity) {
      return pure ? entity.box : entity.rect;
    }

    return null;
  };

  /** Return  */
  getBox = (path: number[]): BoundingBox | null => {
    const element = this.getElement(path);
    if (element) {
      const mergedTransform = this.getMergedTransform(path);

      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        ...this.getOriginBox(path, true),
        mergedTransform,
        transformMatrix: Matrix.fromTransformText(mergedTransform),
      };
    }

    return null;
  };

  getBoxOrigin = (path: number[]): BoundingBoxOrigin | null => {
    const element = this.getElement(path);
    const entity = this.getNodeEntity(path);

    if (element && entity) {
      const { originX = DEFAULT_ORIGIN, originY = DEFAULT_ORIGIN } = entity;
      const mergedTransform = this.getMergedTransform(path);

      const box = this.getOriginBox(path, true)!;

      return {
        x: box.x + box.width * originX,
        y: box.y + box.height * originY,
        mergedTransform,
      };
    }

    return null;
  };

  getMergedTransform = (
    path: number[],
    ignoreCurrentMalfurion = false,
  ): string => {
    let mergedTransform = '';
    const endNodeEntity = this.getNodeEntity(path);
    let entity = endNodeEntity;
    while (entity) {
      const { attributes } = entity;

      // Skip if ignoreCurrentMalfurion
      let malfurionTransform = '';
      if (!ignoreCurrentMalfurion || endNodeEntity !== entity) {
        malfurionTransform = this.getMatrix(
          this.pathCache.getPath(entity)!,
        ).toString();
      }

      mergedTransform = `${attributes.transform ||
        ''} ${malfurionTransform} ${mergedTransform}`
        .replace(/\s+/, ' ')
        .trim();

      entity = entity.parent;
    }

    return mergedTransform;
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

    this.generateDebugHolder();

    return (entity && (entity[prop] as number)) || initialValue;
  };

  originX = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'originX', DEFAULT_ORIGIN, value);

  originY = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'originY', DEFAULT_ORIGIN, value);

  rotate = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'rotate', 0, value, val => val % 360);

  scaleX = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'scaleX', 1, value);

  scaleY = (path: number[], value?: number | ((origin: number) => number)) =>
    this.internalTransform(path, 'scaleY', 1, value);

  translateX = (
    path: number[],
    value?: number | ((origin: number) => number),
  ) => this.internalTransform(path, 'translateX', 0, value);

  translateY = (
    path: number[],
    value?: number | ((origin: number) => number),
  ) => this.internalTransform(path, 'translateY', 0, value);

  getMatrix = (path: number[]) => {
    const entity = this.getNodeEntity(path);
    let mergeMatrix = Matrix.fromTranslate();

    if (entity) {
      const {
        rotate = 0,
        scaleX = 1,
        scaleY = 1,
        translateX = 0,
        translateY = 0,
        originX = DEFAULT_ORIGIN,
        originY = DEFAULT_ORIGIN,
      } = entity;

      const mergedBox = this.getOriginBox(path, true);

      // Translate
      if (translateX || translateY) {
        const translateMatrix = Matrix.fromTranslate(translateX, translateY);
        mergeMatrix = mergeMatrix.multiple(translateMatrix);
      }

      // Rotate matrix
      if (rotate !== 0) {
        const deg = (rotate / 180) * Math.PI;
        const transX = mergedBox!.x + mergedBox!.width * originX;
        const transY = mergedBox!.y + mergedBox!.height * originY;
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
        const transX = mergedBox!.x + mergedBox!.width * originX;
        const transY = mergedBox!.y + mergedBox!.height * originY;
        const transToMatrix = Matrix.fromTranslate(transX, transY);
        const transBackMatrix = Matrix.fromTranslate(-transX, -transY);
        const scaleMatrix = Matrix.fromTransform(scaleX, 0, 0, scaleY, 0, 0);

        mergeMatrix = mergeMatrix
          .multiple(transToMatrix)
          .multiple(scaleMatrix)
          .multiple(transBackMatrix);
      }
    }

    return mergeMatrix;
  };

  refresh = (path: number[]) => {
    const entity = this.getNodeEntity(path);

    if (entity) {
      const ele = this.getElement(path);
      const { attributes } = entity;
      const matrix = this.getMatrix(path);

      ele!.setAttribute(
        'transform',
        `${attributes.transform || ''} ${matrix.toString()}`,
      );
    }
  };
}

export default Malfurion;
