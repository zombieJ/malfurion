import React from 'react';
import Malfurion, { BoundingBox } from '../../src';

interface ProxyRef {
  current: Malfurion | null;
  currentPath: number[];
}

export default function useElementSelection(
  overwriteProxyRef: React.RefObject<ProxyRef> = { current: null },
) {
  const [boundingBox, setBoundingBox] = React.useState<BoundingBox | null>(
    null,
  );
  const [current, setCurrent] = React.useState<Malfurion | null>(null);
  const [currentPath, setCurrentPath] = React.useState<number[]>([]);
  const proxyRef = React.useRef({ current, currentPath });
  proxyRef.current = {
    current,
    currentPath,
    ...overwriteProxyRef.current,
  };

  React.useEffect(() => {
    if (current) {
      setBoundingBox(current.getBox(currentPath)!);
    }
  }, [current, currentPath]);

  function updateSelection(
    instance: Malfurion,
    target: SVGGraphicsElement | null,
  ) {
    if (proxyRef.current.current !== instance) {
      setCurrent(instance);
      setCurrentPath([0]);
    } else {
      const path = instance.getPath(target) || [];

      // Need to get common shared path
      const commonPath = [];
      for (let i = 0; i < proxyRef.current.currentPath.length; i += 1) {
        const pos = proxyRef.current.currentPath[i];

        if (pos === path[i]) {
          commonPath.push(pos);
        } else {
          break;
        }
      }

      setCurrentPath(path.slice(0, commonPath.length + 1));
    }
  }

  function transformCurrentPath(
    callback: (instance: Malfurion, path: number[]) => void,
  ) {
    if (current && currentPath) {
      callback(current, currentPath);
      setBoundingBox(current.getBox(currentPath)!);
    }
  }

  return {
    boundingBox,
    updateSelection,
    proxyRef,
    transformCurrentPath,
  };
}
