
import { useState } from 'react';

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

export const ButtonEdge = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  style = {},
  markerEnd 
}: ButtonEdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const edgePathStyle = {
    ...style,
    strokeWidth: isHovered ? 4 : 3,
    stroke: isHovered ? '#64748b' : '#94a3b8',
    strokeDasharray: '8 4',
    animation: 'dashdraw 0.8s linear infinite',
    transition: 'all 0.2s ease',
  };

  const dx = Math.abs(targetX - sourceX) * 0.5;
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
  
  return (
    <>
      <path
        d={edgePath}
        style={{
          strokeWidth: 25,
          stroke: 'transparent',
          fill: 'none',
          cursor: 'pointer',
        }}
        className="edge-hit-area"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={edgePathStyle}
        markerEnd={markerEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </>
  );
};
