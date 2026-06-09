import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';

interface ImportEdgeData {
  statement?: string;
  weight?: number;
}

const ImportEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<ImportEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isHovered, setIsHovered] = useState(false);

  const weight = data?.weight || 1;
  const strokeWidth = weight > 1 ? Math.min(weight * 1.5, 10) : (style.strokeWidth || 1.5);
  const statement = data?.statement;

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, strokeWidth }}
        interactionWidth={20}
      />
      
      {/* Invisible thicker path to make hovering easier */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="react-flow__edge-interaction"
      />

      {statement && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
            className="bg-stone-800 text-green-400 font-mono text-[10px] px-2 py-1 rounded border border-stone-600 shadow-lg"
          >
            {statement}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(ImportEdge);
