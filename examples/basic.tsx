import '../assets/index.less';
import React from 'react';
import plantTXT from './svg/Plant';
import Malfurion, { SVGBox } from '../src';

const svgText = plantTXT;
// const anotherText = `
// <svg>
//   <g transform="translate(150, 100)">
//     <g transform="rotate(45 0 0)">
//       <rect x="0" y="0" width="100" height="100" fill="green" />
//       <circle cx="50" cy="50" r="10" fill="blue" />
//     </g>
//   </g>
// </svg>
// `;

interface ProxyRef {
  current: Malfurion | null;
  currentPath: number[];
}

function useElementSelection(
  overwriteProxyRef: React.RefObject<ProxyRef> = { current: null },
): [
  SVGBox | null,
  (instance: Malfurion, target: SVGGraphicsElement) => void,
  React.RefObject<ProxyRef>,
] {
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

  function updateSelection(instance: Malfurion, target: SVGGraphicsElement) {
    if (proxyRef.current.current !== instance) {
      setCurrent(instance);
      setCurrentPath([]);
    } else {
      const path = instance.getPath(target);

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

  return [rectProps, updateSelection, proxyRef];
}

export default function App() {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const [selectReact, updateSelection, selectionRef] = useElementSelection();
  const [hoverReact, updateHoverSelection] = useElementSelection(selectionRef);

  React.useEffect(() => {
    const plant = new Malfurion(svgText);
    plant.debug = true;

    svgRef.current!.appendChild(
      plant.getSVG({
        onClick: ({ target, currentTarget }, instance) => {
          console.log('>>>', target, currentTarget);

          updateSelection(instance, target);
        },
        onElementEnter: ({ target }, instance) => {
          updateHoverSelection(instance, target);
        },
        onElementLeave: () => {
          console.log('leave');
        },
      }),
    );
    Malfurion.DEBUG = false;
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          console.log('Rotate!!!');
        }}
      >
        Rotate
      </button>

      <svg
        width={2000}
        height={2000}
        viewBox="0 0 2000 2000"
        style={{
          width: 500,
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
          {...selectReact}
        />
        <rect
          stroke="blue"
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          {...hoverReact}
        />
      </svg>
    </div>
  );
}
