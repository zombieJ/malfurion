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
  onMouseDown: React.MouseEventHandler<SVGElement>;
}

const Rect: React.FC<RectProps> = ({
  size,
  x,
  y,
  offsetX,
  offsetY,
  stroke,
  onMouseDown,
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
    onMouseDown={onMouseDown}
  />
);

export interface SelectionProps {
  selection: ReturnType<typeof useElementSelection>;
  crossSize?: number;
  rectSize?: number;
  stroke?: string;
  onTransform?: (matrix: Matrix) => {};
}

interface SelectionState {
  startPoint: {
    x: number;
    y: number;
  } | null;
  offsetX: number;
  offsetY: number;
}

class Selection extends React.Component<SelectionProps, SelectionState> {
  state: SelectionState = {
    startPoint: null,
    offsetX: 1,
    offsetY: 1,
  };

  static getDerivedStateFromProps({ selection }: SelectionProps) {
    const newState: Partial<SelectionState> = {};

    if (selection.boundingBox) {
      const [a, b, c, d] = selection.boundingBox.transformMatrix!.toTransform();

      newState.offsetX = (a * a + b * b) ** 0.5;
      newState.offsetY = (c * c + d * d) ** 0.5;
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

  onMouseMove = (e: MouseEvent) => {
    const { startPoint } = this.state;
    const { selection } = this.props;
    if (!startPoint || !selection.boundingBox) {
      return;
    }

    const { width } = selection.boundingBox;

    const offsetX = e.clientX - startPoint.x;
    const offsetY = e.clientY - startPoint.y;
    console.log(offsetX, offsetY, e.clientX, e.clientY);

    // onTransform(Matrix.fromTranslate(1, 0));
    selection.transformCurrentPath((instance, path) => {
      instance.scaleX(
        path,
        prevScaleX => (prevScaleX * width + offsetX) / width,
      );
      instance.translateX(path, prevTranslateX => prevTranslateX + offsetX / 2);
    });

    this.setState({
      startPoint: {
        x: e.clientX,
        y: e.clientY,
      },
    });
  };

  onMouseUp = () => {
    this.setState({ startPoint: null });
  };

  render() {
    const { offsetX, offsetY } = this.state;
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

    // Rects
    const { x, y, width, height } = selection.boundingBox!;
    const reactSharedProps = {
      size: rectSize,
      offsetX,
      offsetY,
      stroke,
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
  }
}

export default Selection;
