export interface SVGNodeRecord {
  tagName: string;
  attributes: Record<string, string>;
  children: SVGNodeRecord[];
}

export interface SVGNodeEntity extends SVGNodeRecord {
  children: SVGNodeEntity[];
  rect: { x: number; y: number; width: number; height: number };
}

export interface SVGEntity {
  defs: SVGNodeRecord[];
  nodes: SVGNodeEntity[];
}
