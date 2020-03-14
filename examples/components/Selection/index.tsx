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

  /**
   * Record user operation to render transform matrix.
   * This is same as matrix from `rotate` `scale` and `translate`
   * */
  transformMatrix: Matrix;
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

    transformMatrix: Matrix.fromTranslate(),
  };

  static getDerivedStateFromProps({ selection }: SelectionProps) {
    const newState: Partial<SelectionState> = {};

    if (selection.boundingBox) {
      const transformMatrix = Matrix.fromTransformText(
        selection.boundingBox.mergedTransform!,
      );
      const [a, b, c, d] = transformMatrix.toTransform();

      newState.offsetX = (a * a + b * b) ** 0.5;
      newState.offsetY = (c * c + d * d) ** 0.5;

      // Points
      const { x, y, width, height } = selection.boundingBox!;
      const matrix = transformMatrix;
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
      // leftBottom,
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
      '=> Strings:',
      selection.boundingBox.mergedTransform,
      selection.boundingBox.pureMergedTransform,
    );
    console.log(
      '=> Origin Matrix',
      Matrix.fromTransformText(
        selection.boundingBox.mergedTransform!,
      ).toTransform(),
      Matrix.fromTransformText(
        selection.boundingBox.pureMergedTransform!,
      ).toTransform(),
      operatePosition,
    );

    const positionList = [];
    const topLine = Line.fromPoints(leftTop, rightTop);
    // const bottomLine = Line.fromPoints(leftBottom, rightBottom);
    // const leftLine = Line.fromPoints(leftTop, leftBottom);
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

    const transformMatrix = Matrix.backFromPosition(positionList);

    this.setState({
      transformMatrix,
    });
  };

  onMouseUp = () => {
    const { selection } = this.props;
    const { transformMatrix, startPoint } = this.state;
    this.setState({ startPoint: null });

    if (selection.boundingBox && startPoint) {
      const {
        pureMergedTransform,
        x,
        y,
        width,
        height,
        originX,
        originY,
        rotate,
      } = selection.boundingBox;
      const source = Matrix.fromTransformText(pureMergedTransform!);
      const target = transformMatrix;
      // console.warn(
      //   '=> Up:\n',
      //   source.toTransform(),
      //   '\n',
      //   target.toTransform(),
      // );

      // Get mixed transform matrix
      // source * mixTransformMatrix = target
      const mixTransformMatrix = target.leftDivide(source);
      const shapeInfo = {
        x,
        y,
        width,
        height,
        originX: originX!,
        originY: originY!,
      };

      // Get scaleX & scaleY
      const [a, , , d] = mixTransformMatrix.toTransform();
      const cosA = Math.cos((rotate! / 180) * Math.PI);
      const scaleX = a / cosA;
      const scaleY = d / cosA;
      const scaleMatrix = Matrix.fromScale(scaleX, scaleY, shapeInfo);

      // Get translate
      // Translate * Rotate * Scale
      const rotateMatrix = Matrix.fromRotate(rotate!, shapeInfo);
      const translateRotateMatrix = mixTransformMatrix.rightDivide(scaleMatrix);
      const translateMatrix = translateRotateMatrix.rightDivide(rotateMatrix);
      const [, , , , translateX, translateY] = translateMatrix.toTransform();

      // Test usage, not use in real case
      const mixMatrix = Matrix.fromMixTransform({
        translateX,
        translateY,
        rotate: rotate!,
        scaleX,
        scaleY,
        originX: originX!,
        originY: originY!,

        x,
        y,
        width,
        height,
      });

      console.warn('=> MixSrc:', mixTransformMatrix.toTransform());
      console.warn('=> MixMok:', mixMatrix.toTransform());

      selection.transformCurrentPath((instance, path) => {
        instance.scaleX(path, scaleX);
        instance.scaleY(path, scaleY);
        instance.translateX(path, translateX);
        instance.translateY(path, translateY);
      });
    }
  };

  render() {
    const {
      offsetX,
      offsetY,
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,
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
          transform={this.state.transformMatrix.toString()}
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
