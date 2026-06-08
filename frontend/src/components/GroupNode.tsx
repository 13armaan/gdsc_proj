import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Layers } from 'lucide-react';

function GroupNode({ data }: any) {
  return (
    <div className="w-full h-full relative group">
      <div className="absolute top-0 left-0 right-0 h-10 px-3 flex items-center gap-2 border-b border-slate-700/50 bg-slate-800/80 rounded-t-lg">
        <Layers className="w-4 h-4 text-indigo-400" />
        <span className="font-semibold text-xs text-slate-300 uppercase tracking-wider">{data.label}</span>
      </div>
      
      {/* Invisible handles to allow edges to target the group itself if needed */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export default memo(GroupNode);
