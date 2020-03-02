import '../assets/index.less';
import React from 'react';
import plantTXT from './svg/Plant';
import Malfurion from '../src';

const svgText = plantTXT;
// const svgText = `
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
  const [rectProps, setRectProps] = React.useState({
    width: 550.7053833007812,
    height: 895.8939208984375,
    x: 234.9997100830078,
    y: 63.06151580810547,
  });

  React.useEffect(() => {
    Malfurion.DEBUG = true;
    const malfurion = new Malfurion(svgText);
    svgRef.current!.appendChild(
      malfurion.getSVG({
        onClick: ({ target, currentTarget }, instance) => {
          const path = instance.getPath(target);
          const rect = instance.getBox(path);
          console.log('>>>', target, currentTarget);
          console.log('-', rect);
          setRectProps(rect!);
        },
      }),
    );
    Malfurion.DEBUG = false;
  }, []);

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
