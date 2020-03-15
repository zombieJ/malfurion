import React from 'react';
import { Point } from '../../../src/interface';

export interface RotateHandlerProps {
  origin: Point;
  length: number;
  size: number;
  stroke: string;
  rotate: number;
}

export default function RotateHandler({
  origin,
  length,
  stroke,
  size,
  rotate,
}: RotateHandlerProps) {
  return (
    <g transform={`rotate(${rotate} ${origin.x} ${origin.y})`}>
      <line
        x1={origin.x}
        y1={origin.y}
        x2={origin.x}
        y2={origin.y - length}
        stroke={stroke}
      />
      <circle
        cx={origin.x}
        cy={origin.y - length - size / 2}
        r={size / 2}
        fill="transparent"
        stroke={stroke}
      />
    </g>
  );
}
