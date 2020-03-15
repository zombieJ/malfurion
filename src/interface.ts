import Malfurion from '.';

export interface SVGBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShapeInfo extends SVGBox {
  originX?: number;
  originY?: number;
}

export interface BoundingBox extends ShapeInfo {
  mergedTransform?: string;
  pureMergedTransform?: string;
  rotate?: number;
}

export interface SVGNodeRecord {
  tagName: string;
  attributes: Record<string, string>;
  children: SVGNodeRecord[];
}

export interface SVGNodeEntity extends SVGNodeRecord {
  parent: SVGNodeEntity | null;
  children: SVGNodeEntity[];
  box: SVGBox;
  rotate?: number;
  originX?: number;
  originY?: number;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  opacity?: number;
}

export interface SVGEntity {
  defs: SVGNodeRecord[];
  nodes: SVGNodeEntity[];
  ids: Record<string, string>;
}

interface MockEvent {
  target: SVGGraphicsElement | SVGSVGElement;
  currentTarget: SVGGraphicsElement | SVGSVGElement;
}

export type MalfurionEventHandler = (e: MockEvent, instance: Malfurion) => void;

export type MalfurionEventType =
  | 'click'
  | 'mouseEnter'
  | 'mouseLeave'
  | 'elementEnter'
  | 'elementLeave';

export interface Point {
  x: number;
  y: number;
}
