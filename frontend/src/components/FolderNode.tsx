import { Folder, FolderOpen } from 'lucide-react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useGraphStore } from '../store/useGraphStore';

interface FolderNodeData {
  label: string;
  isCollapsed: boolean;
  fileCount: number;
}

const FolderNode = ({ id, data, selected }: NodeProps<FolderNodeData>) => {
  const toggleFolder = useGraphStore(state => state.toggleFolder);
  const isCollapsed = data.isCollapsed;

  return (
    <div 
      className={`px-5 py-3 rounded-xl border-2 transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-3 w-64
        ${isCollapsed 
          ? 'bg-slate-800/90 border-slate-600 hover:border-blue-400 hover:bg-slate-700 shadow-slate-900/50' 
          : 'bg-blue-900/20 border-blue-500/50 shadow-blue-900/20'}`}
      onClick={() => toggleFolder(id)}
    >
      <div className={`p-2 rounded-lg transition-colors ${isCollapsed ? 'bg-slate-700 text-slate-300' : 'bg-blue-500/20 text-blue-400'}`}>
        {isCollapsed ? <Folder className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />}
      </div>
      
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`text-sm font-bold truncate ${isCollapsed ? 'text-slate-200' : 'text-blue-100'}`}>
          {data.label}
        </span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-slate-400 font-medium">
            {data.fileCount} file{data.fileCount !== 1 ? 's' : ''}
          </span>
          {isCollapsed && (
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold flex items-center">
              ▶ Expand
            </span>
          )}
        </div>
      </div>
      
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export default FolderNode;
