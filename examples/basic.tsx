import '../assets/index.less';
import React from 'react';
// import plantTXT from './svg/Plant';
import Malfurion, { SVGBox } from '../src';

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
  <g transform="translate(150, 100) scale(2)">
    <rect x="0" y="0" width="100" height="100" fill="green" />
  </g>
</svg>
`;

interface ProxyRef {
  current: Malfurion | null;
  currentPath: number[];
}

function useElementSelection(
  overwriteProxyRef: React.RefObject<ProxyRef> = { current: null },
): {
  instance: Malfurion | null;
  path: number[];
  rect: SVGBox | null;
  updateSelection: (
    instance: Malfurion,
    target: SVGGraphicsElement | null,
  ) => void;
  proxyRef: React.RefObject<ProxyRef>;
} {
  const [rectProps, setRectProps] = React.useState<SVGBox | null>(null);
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

  return {
    instance: current,
    path: currentPath,
    rect: rectProps,
    updateSelection,
    proxyRef,
  };
}

export default function App() {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const selection = useElementSelection();
  const hover = useElementSelection(selection.proxyRef);

  React.useEffect(() => {
    const plant = new Malfurion(svgText);
    plant.debug = true;

    plant.addEventListener('click', ({ target, currentTarget }, instance) => {
      console.log('>>>', target, currentTarget);
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
          if (selection.instance) {
            selection.instance.rotate(selection.path, -30);
          }
        }}
      >
        Rotate
      </button>

      <svg
        width={2000}
        height={2000}
        viewBox="0 0 2000 2000"
        style={{
          width: 800,
          height: 500,
          display: 'block',
          background: 'rgba(255, 0, 0, 0.1)',
        }}
      >
        <g ref={svgRef} />
        <rect
          stroke="red"
          strokeWidth={5}
          fill="transparent"
          style={{ pointerEvents: 'none' }}
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
