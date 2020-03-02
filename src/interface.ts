import Malfurion from '.';

export interface SVGBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SVGNodeRecord {
  tagName: string;
  attributes: Record<string, string>;
  children: SVGNodeRecord[];
}

export interface SVGNodeEntity extends SVGNodeRecord {
  children: SVGNodeEntity[];
  rect: SVGBox;
}

export interface SVGEntity {
  defs: SVGNodeRecord[];
  nodes: SVGNodeEntity[];
  ids: Record<string, string>;
}

interface MockEvent {
  target: SVGGraphicsElement;
  currentTarget: SVGGraphicsElement;
}

export interface SVGEvents {
  onClick?: (e: MockEvent, instance: Malfurion) => void;
}
