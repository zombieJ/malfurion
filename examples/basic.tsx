import '../assets/index.less';
import React from 'react';
import plantTxt from './svg/Plant';
import Malfurion from '../src';

export default function App() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [rectProps, setRectProps] = React.useState({
    width: 550.7053833007812,
    height: 895.8939208984375,
    x: 234.9997100830078,
    y: 63.06151580810547,
  });

  React.useEffect(() => {
    const malfurion = new Malfurion(plantTxt);
    svgRef.current!.appendChild(malfurion.getSVG());
  }, []);

  return (
    <div>
      <svg
        width={2000}
        height={2000}
        viewBox="0 0 2000 2000"
        style={{ width: 500, height: 500 }}
        onClick={({ target }) => {
          setRectProps((target as SVGSVGElement).getBBox());
        }}
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
