import React from 'react';
import { Matrix, Line } from '../../../src';
import useElementSelection from '../../hooks/useElementSelection';
import OperatePoint, { Position } from './OperatePoint';
import { OriginPoint } from './OriginPoint';
import RotateHandler from './RotateHandler';

export interface SelectionProps {
  selection: ReturnType<typeof useElementSelection>;
  originSize?: number;
  pointSize?: number;
  handlerSize?: number;
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

  // Origin
  origin: Point;

  // Operate position
  leftTop: Point;
  rightTop: Point;
  leftBottom: Point;
  rightBottom: Point;

  /**
   * Record user operation to render transform matrix.
   * This is same as matrix from `rotate` `scale` and `translate`
   * */
  transformMatrix: Matrix;

  /** Control point */
  control: null | 'lt' | 'rt' | 'lb' | 'rb' | 'rotate';
}

class Selection extends React.Component<SelectionProps, SelectionState> {
  state: SelectionState = {
    startPoint: null,

    leftTop: { x: 0, y: 0 },
    rightTop: { x: 0, y: 0 },
    leftBottom: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 },

    origin: { x: 0, y: 0 },

    transformMatrix: Matrix.fromTranslate(),

    control: null,
  };

  static getDerivedStateFromProps({ selection }: SelectionProps) {
    const newState: Partial<SelectionState> = {};

    if (selection.boundingBox) {
      const { x, y, width, height, originX, originY } = selection.boundingBox;

      const transformMatrix = Matrix.fromTransformText(
        selection.boundingBox.mergedTransform!,
      );

      // Origin
      newState.origin = transformMatrix.transformPosition(
        x + width * originX!,
        y + height * originY!,
      );

      // Points
      newState.leftTop = transformMatrix.transformPosition(x, y);
      newState.rightTop = transformMatrix.transformPosition(x + width, y);
      newState.leftBottom = transformMatrix.transformPosition(x, y + height);
      newState.rightBottom = transformMatrix.transformPosition(
        x + width,
        y + height,
      );
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
      control: position,
      startPoint: { x: clientX, y: clientY },
    });
  };

  onMouseMove = (e: MouseEvent) => {
    const {
      startPoint,
      leftTop,
      rightTop,
      // leftBottom,
      rightBottom,
      control,
    } = this.state;
    const { selection } = this.props;
    if (!startPoint || !selection.boundingBox) {
      return;
    }

    const offsetX = e.clientX - startPoint.x;
    const offsetY = e.clientY - startPoint.y;

    const { x, y, width, height } = selection.boundingBox;

    const positionList = [];
    const topLine = Line.fromPoints(leftTop, rightTop);
    // const bottomLine = Line.fromPoints(leftBottom, rightBottom);
    // const leftLine = Line.fromPoints(leftTop, leftBottom);
    const rightLine = Line.fromPoints(rightTop, rightBottom);

    switch (control) {
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

    this.updateTransform();
    this.setState({
      startPoint: {
        x: e.clientX,
        y: e.clientY,
      },
    });
  };

  onMouseUp = () => {
    this.updateTransform();
    this.setState({ startPoint: null });
  };

  updateTransform = () => {
    const { selection } = this.props;
    const { transformMatrix, startPoint } = this.state;

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

      // console.warn('=> MixSrc:', mixTransformMatrix.toTransform());

      // Get scaleX & scaleY
      const [a, b, c, d] = mixTransformMatrix.toTransform();
      let scaleX = 0;
      let scaleY = 0;
      if (rotate === 90) {
        scaleX = b;
        scaleY = -c;
      } else if (rotate === 270) {
        scaleX = -b;
        scaleY = c;
      } else {
        const cosA = Math.cos((rotate! / 180) * Math.PI);
        scaleX = a / cosA;
        scaleY = d / cosA;
      }
      const scaleMatrix = Matrix.fromScale(scaleX, scaleY, shapeInfo);

      // Get translate
      // Translate * Rotate * Scale
      const rotateMatrix = Matrix.fromRotate(rotate!, shapeInfo);
      const translateRotateMatrix = mixTransformMatrix.rightDivide(scaleMatrix);
      const translateMatrix = translateRotateMatrix.rightDivide(rotateMatrix);
      const [, , , , translateX, translateY] = translateMatrix.toTransform();

      // Test usage, not use in real case
      // const mixMatrix = Matrix.fromMixTransform({
      //   translateX,
      //   translateY,
      //   rotate: rotate!,
      //   scaleX,
      //   scaleY,
      //   originX: originX!,
      //   originY: originY!,

      //   x,
      //   y,
      //   width,
      //   height,
      // });

      // console.warn('=> MixMok:', mixMatrix.toTransform());

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
      origin,
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,
      transformMatrix,
    } = this.state;
    const {
      selection,
      originSize = 10,
      pointSize = 6,
      handlerSize = 100,
      stroke = '#000',
    } = this.props;

    if (!selection.boundingBox) {
      return null;
    }

    // Box
    const boxProps = {
      x: selection.boundingBox.x,
      y: selection.boundingBox.y,
      width: selection.boundingBox.width,
      height: selection.boundingBox.height,
      transform: selection.boundingBox.mergedTransform,
    };

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
          transform={transformMatrix.toString()}
        />
        {/* Origin Point */}
        <OriginPoint size={originSize} point={origin} stroke={stroke} />

        {/* Rotate Handler */}
        <RotateHandler
          origin={origin}
          size={pointSize}
          length={handlerSize}
          stroke={stroke}
          rotate={selection.boundingBox.rotate || 0}
        />

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
