import '../assets/index.less';
import React from 'react';
import plantTXT from './svg/Plant';
import Malfurion from '../src';

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

export default function App() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [rectProps, setRectProps] = React.useState<object | null>(null);
  const [current, setCurrent] = React.useState<Malfurion | null>(null);
  const [currentPath, setCurrentPath] = React.useState<number[]>([]);

  const proxyRef = React.useRef({ current, currentPath });
  proxyRef.current = {
    current,
    currentPath,
  };

  React.useEffect(() => {
    Malfurion.DEBUG = true;
    const plant = new Malfurion(svgText);
    svgRef.current!.appendChild(
      plant.getSVG({
        onClick: ({ target, currentTarget }, instance) => {
          console.log('>>>', target, currentTarget);

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
        },
      }),
    );
    Malfurion.DEBUG = false;
  }, []);

  React.useEffect(() => {
    if (current) {
      setRectProps(current.getBox(currentPath)!);
    }
  }, [current, currentPath]);

  return (
    <div>
      <svg
        width={2000}
        height={2000}
        viewBox="0 0 2000 2000"
        style={{ width: 500, height: 500 }}
        // onClick={({ target }) => {
        //   setRectProps((target as SVGSVGElement).getBBox());
        // }}
      >
        <g ref={svgRef} />
        <rect
          stroke="red"
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          {...rectProps}
        />
      </svg>
    </div>
  );
}
