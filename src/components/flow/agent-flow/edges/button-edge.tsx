import { memo, useMemo } from "react";

interface ButtonEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: string;
  targetPosition?: string;
  style?: React.CSSProperties;
  markerEnd?: string;
}

const ButtonEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}: ButtonEdgeProps) => {
  const edgePath = useMemo(() => {
    const dx = Math.abs(targetX - sourceX) * 0.5;
    return `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
  }, [sourceX, sourceY, targetX, targetY]);

  return (
    <>
      <path
        d={edgePath}
        style={{
          strokeWidth: 25,
          stroke: "transparent",
          fill: "none",
          cursor: "pointer",
        }}
        className="edge-hit-area"
      />
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: "#94a3b8",
          strokeDasharray: "8 4",
        }}
        markerEnd={markerEnd}
      />
    </>
  );
};

export const ButtonEdge = memo(ButtonEdgeComponent);
