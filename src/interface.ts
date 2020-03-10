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
  box: SVGBox;
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

export interface SVGEvents {
  onClick?: (e: MockEvent, instance: Malfurion) => void;
  onMouseEnter?: (e: MockEvent, instance: Malfurion) => void;
  onMouseLeave?: (e: MockEvent, instance: Malfurion) => void;
  onElementEnter?: (e: MockEvent, instance: Malfurion) => void;
  onElementLeave?: (e: MockEvent, instance: Malfurion) => void;
}
