import React from 'react';
import { Matrix, Line } from '../../../src';
import useElementSelection from '../../hooks/useElementSelection';
import OperatePoint, { Position } from './OperatePoint';

export interface SelectionProps {
  selection: ReturnType<typeof useElementSelection>;
  crossSize?: number;
  pointSize?: number;
  stroke?: string;
  onTransform?: (matrix: Matrix) => {};
}

interface Point {
  x: number;
  y: number;
}

interface SelectionState {
  startPoint: {
    x: number;
    y: number;
  } | null;
  offsetX: number;
  offsetY: number;

  // Operate position
  leftTop: Point;
  rightTop: Point;
  leftBottom: Point;
  rightBottom: Point;
  operatePosition: Position | null;
}

class Selection extends React.Component<SelectionProps, SelectionState> {
  state: SelectionState = {
    startPoint: null,
    offsetX: 1,
    offsetY: 1,

    leftTop: { x: 0, y: 0 },
    rightTop: { x: 0, y: 0 },
    leftBottom: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },
    operatePosition: null,
  };

  static getDerivedStateFromProps({ selection }: SelectionProps) {
    const newState: Partial<SelectionState> = {};

    if (selection.boundingBox) {
      const [a, b, c, d] = selection.boundingBox.transformMatrix!.toTransform();

      newState.offsetX = (a * a + b * b) ** 0.5;
      newState.offsetY = (c * c + d * d) ** 0.5;

      // Points
      const { x, y, width, height } = selection.boundingBox!;
      const matrix = selection.boundingBox.transformMatrix!;
      newState.leftTop = matrix.transformPosition(x, y);
      newState.rightTop = matrix.transformPosition(x + width, y);
      newState.leftBottom = matrix.transformPosition(x, y + height);
      newState.rightBottom = matrix.transformPosition(x + width, y + height);
    }

    return newState;
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  onMouseDown = (
    { clientX, clientY }: React.MouseEvent<SVGElement>,
    position: Position,
  ) => {
    this.setState({
      startPoint: { x: clientX, y: clientY },
      operatePosition: position,
    });
  };

  onMouseMove = (e: MouseEvent) => {
    const {
      startPoint,
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,
      operatePosition,
    } = this.state;
    const { selection } = this.props;
    if (!startPoint || !selection.boundingBox) {
      return;
    }

    const offsetX = e.clientX - startPoint.x;
    const offsetY = e.clientY - startPoint.y;

    const { x, y, width, height } = selection.boundingBox;
    console.log(
      '=> Origin Matrix',
      selection.boundingBox.transformMatrix!.toTransform(),
      operatePosition,
    );

    const positionList = [];
    const topLine = Line.fromPoints(leftTop, rightTop);
    const bottomLine = Line.fromPoints(leftBottom, rightBottom);
    const leftLine = Line.fromPoints(leftTop, leftBottom);
    const rightLine = Line.fromPoints(rightTop, rightBottom);

    switch (operatePosition) {
      case 'rb': {
        // LT
        positionList.push({
          source: { x, y },
          target: leftTop,
        });

        // RT
        const newRightLine = rightLine.translate(offsetX, offsetY);
        const crossPoint = topLine.crossPoint(newRightLine);
        positionList.push({
          source: { x: x + width, y },
          target: { x: crossPoint.x, y: crossPoint.y },
        });

        // RB
        positionList.push({
          source: { x: x + width, y: y + height },
          target: { x: rightBottom.x + offsetX, y: rightBottom.y + offsetY },
        });
        break;
      }

      default:
      // Do nothing
    }

    const matrix = Matrix.backFromPosition(positionList);
    console.log('=> Trans Matrix', matrix.toTransform());

    this.setState({
      matrixStr: matrix.toString(),
    });
  };

  onMouseUp = () => {
    this.setState({ startPoint: null });
  };

  render() {
    const {
      offsetX,
      offsetY,
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,
      matrixStr,
    } = this.state;
    const {
      selection,
      crossSize = 5,
      pointSize = 5,
      stroke = '#000',
    } = this.props;

    if (!selection.boundingBox || !selection.boundingBoxOrigin) {
      return null;
    }

    // Box
    const boxProps = {
      ...selection.boundingBox,
      transform: selection.boundingBox.mergedTransform,
    };
    delete boxProps.mergedTransform;
    delete boxProps.transformMatrix;

    // Points
    const pointProps = {
      size: pointSize,
      stroke,
      fill: 'transparent',
      onMouseDown: this.onMouseDown,
    };

    return (
      <>
        {/* Selection Rect */}
        <rect
          stroke={stroke}
          strokeWidth={1}
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          vectorEffect="non-scaling-stroke"
          {...boxProps}
        />

        <rect
          stroke="red"
          strokeWidth={1}
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          vectorEffect="non-scaling-stroke"
          {...boxProps}
          transform={this.state.matrixStr}
        />
        {/* Center Cross */}
        <g
          transform={selection.boundingBoxOrigin.mergedTransform}
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

        {/* Points */}
        <OperatePoint {...pointProps} position="lt" point={leftTop} />
        <OperatePoint {...pointProps} position="rt" point={rightTop} />
        <OperatePoint {...pointProps} position="lb" point={leftBottom} />
        <OperatePoint {...pointProps} position="rb" point={rightBottom} />
      </>
    );
  }
}

export default Selection;
