import { SVGNodeRecord } from './interface';

export function getAttributes({
  attributes,
}: {
  attributes: NamedNodeMap;
}): Record<string, string> {
  const attrs: Record<string, string> = {};
  Array.from(attributes).forEach(({ name, value }) => {
    attrs[name] = value;
  });
  return attrs;
}

interface AbstractNode {
  tagName: string;
  attributes: NamedNodeMap;
  children?: HTMLCollection;
}

export function getNodeRecord(
  node: AbstractNode,
  loopChildren: boolean,
  postRecord?: (record: SVGNodeRecord) => void,
): SVGNodeRecord {
  let subRecords: SVGNodeRecord[] = [];
  if (loopChildren) {
    subRecords = Array.from(node.children || []).map(subNode =>
      getNodeRecord(subNode, true),
    );
  }

  const record = {
    tagName: node.tagName,
    attributes: getAttributes(node),
    children: subRecords,
  };

  if (postRecord) {
    postRecord(record);
  }

  return record;
}

export function getBox(ele: SVGGraphicsElement) {
  const { x, y, width, height } = ele.getBBox();
  return { x, y, width, height };
}
