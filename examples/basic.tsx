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
  <defs>
    <radialGradient id="myGradient">
      <stop offset="0%"   stop-color="pink" />
      <stop offset="100%" stop-color="black" />
    </radialGradient>
  </defs>
  <circle cx="80" cy="80" r="20" fill="yellow" />
  <g id="分组" transform="translate(150 100) scale(1.5)">
    <rect id="方块1" x="0" y="0" width="40" height="100" fill="#00FF00" />
    <rect x="0" y="80" width="50" height="20" fill="url(#myGradient)" stroke="#F00" opacity="0.5" />
  </g>

  <text x="20" y="20" dominant-baseline="hanging" text-anchor="end">fg</text>
</svg>
`;

const SC =
  '[{"path":[0],"rotate":30},{"path":[0,1],"rotate":27.72411817330965},{"path":[0,1,0],"rotate":315.9457209584655,"scaleX":2.9937769231279017,"scaleY":0.5168243503792648,"translateX":62.38341114458523,"translateY":-48.54876214439338}]';

const plant = new Malfurion(svgText);
plant.debug = true;

export default function App() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [record, setRecord] = React.useState(SC);

  const selection = useElementSelection();
  const hover = useElementSelection(selection.proxyRef);

  React.useEffect(() => {
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
            instance.rotate(path, origin => origin - 30);
          });
        }}
      >
        RotateUp
      </button>
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.rotate(path, origin => origin + 30);
          });
        }}
      >
        RotateDown
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
            instance.translateX(path, origin => origin + 10);
          });
        }}
      >
        TranslateX
      </button>
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.opacity(path, origin => (origin + 0.1) % 1);
          });
        }}
      >
        Opacity
      </button>

      <button
        type="button"
        onClick={() => {
          const transform = plant.serializeTransform();
          console.log(transform);
          setRecord(JSON.stringify(transform));
        }}
      >
        Serialize
      </button>
      <button
        type="button"
        onClick={() => {
          plant.deserializeTransform(JSON.parse(record));
        }}
      >
        Deserialize
      </button>
      <button
        type="button"
        onClick={() => {
          plant.reset();
        }}
      >
        Reset
      </button>
      <button
        type="button"
        onClick={() => {
          console.log('Hierarchy:', plant.getHierarchy());
        }}
      >
        Hierarchy
      </button>
      <button
        type="button"
        onClick={() => {
          selection.transformCurrentPath((instance, path) => {
            instance.fill(path, 'orange');
            instance.stroke(path, 'cyan');
          });
        }}
      >
        Random Color
      </button>

      <br />

      <svg
        width={500}
        height={500}
        viewBox="0 0 500 500"
        style={{
          width: 500,
          height: 500,
          display: 'inline-block',
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

      <textarea
        value={record}
        style={{ width: 500, height: 300, verticalAlign: 'top' }}
        onChange={e => {
          setRecord(e.target.value);
        }}
      />
    </div>
  );
}
