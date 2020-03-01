export interface SVGNodeEntity {
  node: SVGElement;
}

export interface SVGEntity {
  defs: SVGElement[];
  nodes: SVGNodeEntity[];
}

function analysisSVG(list: any): SVGEntity {
  const entity: SVGEntity = {
    defs: [],
    nodes: [],
  };
  const elements: SVGElement[] = Array.from(list);
  console.error('>>>', elements);

  elements.forEach(node => {
    const { tagName } = node;

    switch (tagName) {
      case 'title':
        return;

      case 'defs':
        entity.defs = (node.children as any) as SVGElement[];
        return;

      default:
        entity.nodes.push();
    }
  });

  return entity;
}

class Malfurion {
  private svg: SVGSVGElement;

  constructor(source: string) {
    const holder = document.createElement('div');
    holder.innerHTML = source;
    this.svg = holder.querySelector('svg')!;
    document.body.appendChild(this.svg);

    // Calculate rect
    analysisSVG(this.svg.children);
    console.log('>>>', this.svg.getBBox());

    // Clean up
    document.body.removeChild(this.svg);
  }

  getSVG = () => this.svg;
}

export default Malfurion;
