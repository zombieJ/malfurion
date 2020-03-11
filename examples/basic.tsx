import '../assets/index.less';
import React from 'react';
// import plantTXT from './svg/Plant';
import Malfurion, { BoundingBox } from '../src';

// const svgText = plantTXT;
// const svgText = `
// <svg>
//   <g transform="translate(150, 100)">
//     <g transform="rotate(45 0 0)">
//       <rect x="0" y="0" width="100" height="100" fill="green" />
//       <circle cx="50" cy="50" r="10" fill="yellow" />
//     </g>
//   </g>

//   <circle cx="50" cy="50" r="20" fill="red" />
// </svg>
// `;
const svgText = `
<svg>
  <g transform="translate(150, 100)">
    <rect x="0" y="0" width="50" height="80" fill="green" />
  </g>
</svg>
`;
// const svgText = `
// <svg>
//   <rect transform="translate(150, 100)" x="0" y="0" width="50" height="80" fill="green" />
// </svg>
// `;

interface ProxyRef {
  current: Malfurion | null;
  currentPath: number[];
}

function useElementSelection(
  overwriteProxyRef: React.RefObject<ProxyRef> = { current: null },
) {
  const [rectProps, setRectProps] = React.useState<BoundingBox | null>(null);
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
      setRectProps(current.getBox(currentPath)!);
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
      setRectProps(current.getBox(currentPath)!);
    }
  }

  return {
    instance: current,
    path: currentPath,
    rect: rectProps,
    updateSelection,
    proxyRef,
    transformCurrentPath,
  };
}

export default function App() {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const selection = useElementSelection();
  const hover = useElementSelection(selection.proxyRef);

  React.useEffect(() => {
    const plant = new Malfurion(svgText);
    plant.debug = true;

    plant.addEventListener('click', ({ target }, instance) => {
      selection.updateSelection(instance, target);
    });
    // plant.addEventListener('elementEnter', ({ target }, instance) => {
    //   hover.updateSelection(instance, target);
    // });
    // plant.addEventListener('elementLeave', (_, instance) => {
    //   hover.updateSelection(instance, null);
    // });

    svgRef.current!.appendChild(plant.getSVG());
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.originX(path, Math.random());
            instance.originY(path, Math.random());
          });
        }}
      >
        Random Origin
      </button>
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.rotate(path, origin => origin + 30);
          });
        }}
      >
        Rotate
      </button>
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.scaleX(path, origin => origin + 0.1);
          });
        }}
      >
        LargerX
      </button>
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.scaleY(path, origin => origin + 0.1);
          });
        }}
      >
        LargerY
      </button>

      <svg
        width={500}
        height={500}
        viewBox="0 0 500 500"
        style={{
          width: 500,
          height: 500,
          display: 'block',
          background: 'rgba(255, 0, 0, 0.1)',
        }}
      >
        <g ref={svgRef} dangerouslySetInnerHTML={{ __html: '' }} />
        <rect
          stroke="red"
          strokeWidth={5}
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          vectorEffect="non-scaling-stroke"
          {...selection.rect}
        />
        <rect
          stroke="blue"
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          {...hover.rect}
        />
      </svg>
    </div>
  );
}
