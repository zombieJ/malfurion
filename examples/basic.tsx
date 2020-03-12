import '../assets/index.less';
import React from 'react';
// import plantTXT from './svg/Plant';
import Malfurion from '../src';
import useElementSelection from './hooks/useElementSelection';
import Selection from './components/Selection';

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
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.translateX(path, origin => origin + 1);
          });
        }}
      >
        TranslateX
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

        <Selection selection={selection} />
      </svg>
    </div>
  );
}
