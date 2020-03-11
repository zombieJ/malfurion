function convertStringPath(path: string) {
  return path.split('-').map(pos => Number(pos));
}

export class PathCache {
  private elementPathMap = new Map<Element, string>();

  private pathElementMap = new Map<string, Element>();

  public set = (element: Element, path: number[]) => {
    const strPath = path.join('-');
    this.elementPathMap.set(element, strPath);
    this.pathElementMap.set(strPath, element);
  };

  public getElement = (path: number[]) =>
    this.pathElementMap.get(path.join('-')) || null;

  public getPath = (element: Element) => {
    const path = this.elementPathMap.get(element);
    return path ? convertStringPath(path) : null;
  };

  public getPathList = () =>
    [...this.pathElementMap.keys()].map(convertStringPath);
}
