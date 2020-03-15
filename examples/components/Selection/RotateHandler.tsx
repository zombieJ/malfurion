import React from 'react';
import { Point } from '../../../src/interface';

export interface RotateHandlerProps {
  origin: Point;
  length: number;
  size: number;
  stroke: string;
  rotate: number;
  onMouseDown: React.MouseEventHandler<SVGElement>;
}

function RotateHandler(
  { origin, length, stroke, size, rotate, onMouseDown }: RotateHandlerProps,
  ref: React.RefObject<SVGRectElement | null>,
) {
  const centerRef = React.useRef<SVGRectElement>(null);

  React.useImperativeHandle(ref, () => centerRef.current);

  return (
    <g transform={`rotate(${rotate} ${origin.x} ${origin.y})`}>
      <line
        x1={origin.x}
        y1={origin.y}
        x2={origin.x}
        y2={origin.y - length}
        stroke={stroke}
        style={{ pointerEvents: 'none' }}
      />
      <circle
        cx={origin.x}
        cy={origin.y - length - size / 2}
        r={size / 2}
        fill="transparent"
        stroke={stroke}
        style={{ cursor: 'pointer' }}
        onMouseDown={onMouseDown}
      />
      <rect
        x={origin.x}
        y={origin.y}
        width={1}
        height={1}
        fill="red"
        ref={centerRef}
      />
    </g>
  );
}

export default React.forwardRef(RotateHandler);
