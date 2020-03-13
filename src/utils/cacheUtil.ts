import { SVGNodeEntity } from '../interface';

function convertStringPath(path: string) {
  return path.split('-').map(pos => Number(pos));
}

export class PathCache {
  private elementPathMap = new Map<Element, string>();

  private pathElementMap = new Map<string, Element>();

  private entityPathMap = new Map<SVGNodeEntity, string>();

  public set = (element: Element, path: number[], entity: SVGNodeEntity) => {
    const strPath = path.join('-');
    this.elementPathMap.set(element, strPath);
    this.pathElementMap.set(strPath, element);
    this.entityPathMap.set(entity, strPath);
  };

  public getElement = (path: number[]) =>
    this.pathElementMap.get(path.join('-')) || null;

  public getPath = (e: Element | SVGNodeEntity) => {
    const path1 = this.elementPathMap.get(e as any);
    const path2 = this.entityPathMap.get(e as any);
    const path = path1 || path2;

    return path ? convertStringPath(path) : null;
  };

  public getPathList = () =>
    [...this.pathElementMap.keys()].map(convertStringPath);
}
