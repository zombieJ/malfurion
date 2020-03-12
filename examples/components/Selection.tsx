import React from 'react';
import { Matrix } from '../../src';
import useElementSelection from '../hooks/useElementSelection';

interface RectProps {
  size: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  stroke: string;
}

const Rect: React.FC<RectProps> = ({
  size,
  x,
  y,
  offsetX,
  offsetY,
  stroke,
}) => (
  <rect
    style={{ cursor: 'pointer' }}
    x={x - size / 2 / offsetX}
    y={y - size / 2 / offsetY}
    width={size / offsetX}
    height={size / offsetY}
    fill="#FFF"
    stroke={stroke}
    vectorEffect="non-scaling-stroke"
  />
);

export interface SelectionProps {
  selection: ReturnType<typeof useElementSelection>;
  crossSize?: number;
  rectSize?: number;
  stroke?: string;
}

const Selection: React.FC<SelectionProps> = ({
  selection,
  crossSize = 5,
  rectSize = 5,
  stroke = '#000',
}) => {
  const matrix = React.useMemo(() => {
    const m = Matrix.fromTransformText(
      selection.boundingBoxOrigin ? selection.boundingBoxOrigin.transform : '',
    );
    return m.toTransform();
  }, [selection.boundingBoxOrigin && selection.boundingBoxOrigin.transform]);

  if (!selection.boundingBox || !selection.boundingBoxOrigin) {
    return null;
  }

  const [a, b, c, d] = matrix;

  // Cross
  const offsetX = (a * a + b * b) ** 0.5;
  const offsetY = (c * c + d * d) ** 0.5;

  // Rects
  const { x, y, width, height } = selection.boundingBox!;
  const reactSharedProps = {
    size: rectSize,
    offsetX,
    offsetY,
    stroke,
  };

  return (
    <>
      <rect
        stroke={stroke}
        strokeWidth={1}
        fill="transparent"
        style={{ pointerEvents: 'none' }}
        vectorEffect="non-scaling-stroke"
        {...selection.boundingBox}
      />
      {/* Center Cross */}
      <g
        transform={selection.boundingBoxOrigin.transform}
        style={{ pointerEvents: 'none' }}
      >
        <line
          x1={selection.boundingBoxOrigin.x}
          x2={selection.boundingBoxOrigin.x}
          y1={selection.boundingBoxOrigin.y - crossSize / offsetY}
          y2={selection.boundingBoxOrigin.y + crossSize / offsetY}
          stroke={stroke}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={selection.boundingBoxOrigin.x - crossSize / offsetX}
          x2={selection.boundingBoxOrigin.x + crossSize / offsetX}
          y1={selection.boundingBoxOrigin.y}
          y2={selection.boundingBoxOrigin.y}
          stroke={stroke}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Rects */}
      <g transform={selection.boundingBoxOrigin.transform}>
        <Rect {...reactSharedProps} size={rectSize} x={x} y={y} />
        <Rect {...reactSharedProps} size={rectSize} x={x + width} y={y} />
        <Rect {...reactSharedProps} size={rectSize} x={x} y={y + height} />
        <Rect
          {...reactSharedProps}
          size={rectSize}
          x={x + width}
          y={y + height}
        />
      </g>
    </>
  );
};

export default Selection;
