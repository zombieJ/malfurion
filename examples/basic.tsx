import '../assets/index.less';
import React from 'react';
// import plantTXT from './svg/Plant';
import Malfurion, { BoundingBox, BoundingBoxOrigin } from '../src';

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
  <circle cx="80" cy="80" r="20" fill="yellow" />
  <g transform="translate(150, 100)">
    <rect x="0" y="0" width="50" height="80" fill="green" />
    <rect x="0" y="80" width="50" height="20" fill="yellow" />
  </g>
</svg>
`;

interface ProxyRef {
  current: Malfurion | null;
  currentPath: number[];
}

function useElementSelection(
  overwriteProxyRef: React.RefObject<ProxyRef> = { current: null },
) {
  const [boundingBox, setBoundingBox] = React.useState<BoundingBox | null>(
    null,
  );
  const [
    boundingBoxOrigin,
    setBoundingBoxOrigin,
  ] = React.useState<BoundingBoxOrigin | null>(null);
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
      setBoundingBoxOrigin(current.getBoxOrigin(currentPath)!);
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
      setBoundingBoxOrigin(current.getBoxOrigin(currentPath)!);
    }
  }

  return {
    boundingBox,
    boundingBoxOrigin,
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
    plant.addEventListener('elementEnter', ({ target }, instance) => {
      hover.updateSelection(instance, target);
    });
    plant.addEventListener('elementLeave', (_, instance) => {
      hover.updateSelection(instance, null);
    });

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
          stroke="rgba(100, 100, 100, 0.5)"
          fill="rgba(255, 255, 255, 0.1)"
          style={{ pointerEvents: 'none' }}
          {...hover.boundingBox}
        />

        <rect
          stroke="#000"
          strokeWidth={1}
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          vectorEffect="non-scaling-stroke"
          {...selection.boundingBox}
        />
        {selection.boundingBoxOrigin && (
          <g
            transform={selection.boundingBoxOrigin.transform}
            style={{ pointerEvents: 'none' }}
          >
            <line
              x1={selection.boundingBoxOrigin.x}
              x2={selection.boundingBoxOrigin.x}
              y1={selection.boundingBoxOrigin.y - 5}
              y2={selection.boundingBoxOrigin.y + 5}
              stroke="#000"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={selection.boundingBoxOrigin.x - 5}
              x2={selection.boundingBoxOrigin.x + 5}
              y1={selection.boundingBoxOrigin.y}
              y2={selection.boundingBoxOrigin.y}
              stroke="#000"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
