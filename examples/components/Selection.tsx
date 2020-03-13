import React from 'react';
import { Matrix } from '../../src';
import useElementSelection from '../hooks/useElementSelection';

export interface SelectionProps {
  selection: ReturnType<typeof useElementSelection>;
  crossSize?: number;
  rectSize?: number;
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

  leftTop: Point;
  rightTop: Point;
  leftBottom: Point;
  rightBottom: Point;
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

  onMouseDown: React.MouseEventHandler<SVGElement> = ({ clientX, clientY }) => {
    this.setState({ startPoint: { x: clientX, y: clientY } });
  };

  // onMouseMove123 = (e: MouseEvent) => {
  //   const { startPoint } = this.state;
  //   const { selection } = this.props;
  //   if (!startPoint || !selection.boundingBox) {
  //     return;
  //   }

  //   const { width, height } = selection.boundingBox;

  //   const offsetX = e.clientX - startPoint.x;
  //   const offsetY = e.clientY - startPoint.y;
  //   // console.log(offsetX, offsetY, e.clientX, e.clientY);

  //   // onTransform(Matrix.fromTranslate(1, 0));
  //   selection.transformCurrentPath((instance, path) => {
  //     const rotate = instance.rotate(path);
  //     // console.log('>>>', rotate);

  //     const angle = (rotate / 180) * Math.PI;
  //     const cosA = Math.cos(angle);
  //     // const sinA = Math.sin(angle);
  //     // const cosA = 1;
  //     const sinA = 1;

  //     // if (rotate % 90 === 0 && rotate % 180 !== 0) {
  //     //   cosA = 1;
  //     // }

  //     // ScaleX
  //     instance.scaleX(path, prevScaleX => {
  //       if (rotate % 90 === 0 && rotate % 180 !== 0) {
  //         // Vertical status will not affect by offsetX
  //         return prevScaleX;
  //       }
  //       return (prevScaleX * width + offsetX / cosA) / width;
  //     });
  //     instance.translateX(path, prevTranslateX => {
  //       if (rotate % 90 === 0 && rotate % 180 !== 0) {
  //         // Vertical status will not affect by offsetX
  //         return prevTranslateX;
  //       }
  //       return prevTranslateX + offsetX / 2;
  //     });

  //     // ScaleY
  //     // instance.scaleY(
  //     //   path,
  //     //   prevScaleY => (prevScaleY * height + offsetY / sinA) / height,
  //     // );
  //     // instance.translateY(path, prevTranslateY => prevTranslateY + offsetY / 2);
  //   });

  //   this.setState({
  //     startPoint: {
  //       x: e.clientX,
  //       y: e.clientY,
  //     },
  //   });
  // };

  onMouseMove = (e: MouseEvent) => {
    const {
      startPoint,
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,
    } = this.state;
    const { selection } = this.props;
    if (!startPoint || !selection.boundingBox) {
      return;
    }

    const { x, y, width, height } = selection.boundingBox;
    console.log(
      'Origin Matrix',
      selection.boundingBox.transformMatrix!.toTransform(),
    );

    const matrix = Matrix.backFromPosition([
      { source: { x, y }, target: { x: leftTop.x, y: leftTop.y } },
      { source: { x: x + width, y }, target: { x: rightTop.x, y: rightTop.y } },
      {
        source: { x: x + width, y: y + height },
        target: { x: rightBottom.x, y: rightBottom.y },
      },
    ]);
    console.log('Trans Matrix', matrix.toTransform());
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
    } = this.state;
    const {
      selection,
      crossSize = 5,
      rectSize = 5,
      stroke = '#000',
    } = this.props;

    if (!selection.boundingBox || !selection.boundingBoxOrigin) {
      return null;
    }

    // Box
    const boxProps = { ...selection.boundingBox };
    delete boxProps.transformMatrix;

    // Points
    const pointProps = {
      r: rectSize / 2,
      fill: 'transparent',
      stroke,
      vectorEffect: 'non-scaling-stroke',
      style: { cursor: 'pointer' },
      onMouseDown: this.onMouseDown,
    };

    return (
      <>
        <rect
          stroke={stroke}
          strokeWidth={1}
          fill="transparent"
          style={{ pointerEvents: 'none' }}
          vectorEffect="non-scaling-stroke"
          {...boxProps}
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

        {/* Points */}
        <circle {...pointProps} cx={leftTop.x} cy={leftTop.y} />
        <circle {...pointProps} cx={rightTop.x} cy={rightTop.y} />
        <circle {...pointProps} cx={leftBottom.x} cy={leftBottom.y} />
        <circle {...pointProps} cx={rightBottom.x} cy={rightBottom.y} />
      </>
    );
  }
}

export default Selection;
