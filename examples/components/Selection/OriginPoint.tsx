import React from 'react';
import { Point } from '../../../src/interface';

export interface OriginPointProps {
  point: Point;
  size: number;
  stroke: string;
}

export function OriginPoint({ point, size, stroke }: OriginPointProps) {
  const half = size / 2;

  return (
    <g>
      <line
        x1={point.x - half}
        x2={point.x + half}
        y1={point.y}
        y2={point.y}
        stroke={stroke}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={point.x}
        x2={point.x}
        y1={point.y - half}
        y2={point.y + half}
        stroke={stroke}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
