import React from 'react';
import { Point } from '../../../src/interface';

export type Position = 'lt' | 'rt' | 'lb' | 'rb';

export interface OperatePointProps {
  point: Point;
  size: number;
  stroke: string;
  position: Position;
  onMouseDown: (e: React.MouseEvent<SVGElement>, position: Position) => void;
}

export default ({
  point,
  size,
  stroke,
  position,
  onMouseDown,
}: OperatePointProps) => (
  <circle
    style={{ cursor: 'pointer' }}
    fill="transparent"
    vectorEffect="non-scaling-stroke"
    cx={point.x}
    cy={point.y}
    r={size / 2}
    stroke={stroke}
    onMouseDown={e => {
      onMouseDown(e, position);
    }}
  />
);
