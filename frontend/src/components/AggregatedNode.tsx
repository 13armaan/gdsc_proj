import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Folder, Layers } from 'lucide-react';

interface AggregatedNodeData {
  label: string;
  viewType: 'folder' | 'module';
  loc: number;
}

const AggregatedNode = ({ data, selected }: NodeProps<AggregatedNodeData>) => {
  const Icon = data.viewType === 'folder' ? Folder : Layers;
  
  const semanticClasses = selected 
    ? 'bg-slate-800/90 border-blue-400 shadow-blue-500/20 ring-1 ring-blue-500/50' 
    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500/80';

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 shadow-lg w-[250px] max-w-[250px] backdrop-blur-sm ${semanticClasses}`}>
      <Handle type="target" position={Position.Top} className="opacity-0 w-0 h-0" />
      
      <div className={`flex items-center justify-center p-2 rounded-lg shadow-inner ${data.viewType === 'folder' ? 'bg-amber-900/20' : 'bg-purple-900/20'}`}>
        <Icon className={`w-6 h-6 ${data.viewType === 'folder' ? 'text-amber-400' : 'text-purple-400'}`} />
      </div>

      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <span className="text-[14px] font-semibold text-slate-100 truncate leading-tight tracking-tight" title={data.label}>
          {data.label}
        </span>
        <span className="text-[11px] text-slate-400/90 font-medium leading-tight mt-1 flex items-center gap-1">
          <span className="bg-slate-900/50 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700/50">
            {data.loc.toLocaleString()} LoC
          </span>
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0 w-0 h-0" />
    </div>
  );
};

export default memo(AggregatedNode);
