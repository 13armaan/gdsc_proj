import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { FileCode2, FileJson, FileText, Settings, File, Braces, Terminal, Cpu, Zap, Coffee, Gem, Flame } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';

interface FileNodeData {
  label: string;
  type: string;
  loc?: number;
  heavyNodeCount?: number;
}

const getFileIcon = (ext: string) => {
  switch (ext.toLowerCase()) {
    case 'ts':
    case 'tsx':
      return <FileCode2 className="w-5 h-5 text-blue-400" />;
    case 'js':
    case 'jsx':
      return <Braces className="w-5 h-5 text-yellow-400" />;
    case 'py':
      return <Terminal className="w-5 h-5 text-blue-300" />;
    case 'cpp':
    case 'h':
    case 'hpp':
    case 'cc':
      return <Cpu className="w-5 h-5 text-blue-500" />;
    case 'go':
      return <Zap className="w-5 h-5 text-sky-400" />;
    case 'java':
      return <Coffee className="w-5 h-5 text-orange-500" />;
    case 'rb':
      return <Gem className="w-5 h-5 text-red-500" />;
    case 'json':
      return <FileJson className="w-5 h-5 text-green-400" />;
    case 'md':
    case 'txt':
      return <FileText className="w-5 h-5 text-slate-400" />;
    case 'env':
    case 'config':
    case 'toml':
    case 'yaml':
    case 'yml':
      return <Settings className="w-5 h-5 text-orange-400" />;
    default:
      return <File className="w-5 h-5 text-slate-400" />;
  }
};

const getSemanticColors = (filename: string, selected: boolean) => {
  const name = filename.toLowerCase();
  
  const ext = name.split('.').pop() || '';
  
  if (name.includes('test') || name.includes('spec')) {
    return selected 
      ? 'bg-purple-900/40 border-purple-400 shadow-purple-500/20' 
      : 'bg-purple-900/10 border-purple-800/50 hover:border-purple-500/50';
  }
  if (['package.json', 'vite.config', '.env', 'tsconfig', 'tailwind', 'config'].some(c => name.includes(c))) {
    return selected 
      ? 'bg-orange-900/40 border-orange-400 shadow-orange-500/20' 
      : 'bg-orange-900/10 border-orange-800/50 hover:border-orange-500/50';
  }
  if (['main', 'index', 'app'].some(c => name.includes(c))) {
    return selected 
      ? 'bg-green-900/40 border-green-400 shadow-green-500/20' 
      : 'bg-green-900/10 border-green-800/50 hover:border-green-500/50';
  }
  
  if (ext === 'py') {
    return selected ? 'bg-blue-900/40 border-blue-400 shadow-blue-500/20' : 'bg-blue-900/10 border-blue-400 hover:border-blue-300';
  }
  if (ext === 'cpp' || ext === 'h' || ext === 'hpp' || ext === 'cc') {
    return selected ? 'bg-blue-950/40 border-blue-600 shadow-blue-600/20' : 'bg-blue-950/20 border-blue-700 hover:border-blue-500';
  }
  if (ext === 'go') {
    return selected ? 'bg-sky-900/40 border-sky-400 shadow-sky-400/20' : 'bg-sky-900/10 border-sky-400 hover:border-sky-300';
  }
  if (ext === 'java') {
    return selected ? 'bg-red-950/40 border-orange-500 shadow-orange-500/20' : 'bg-orange-900/10 border-orange-500 hover:border-orange-400';
  }
  if (ext === 'rb') {
    return selected ? 'bg-red-900/40 border-red-500 shadow-red-500/20' : 'bg-red-900/10 border-red-500 hover:border-red-400';
  }

  // Default Gray for standard files
  return selected 
    ? 'bg-slate-800/90 border-slate-300 shadow-slate-500/20' 
    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500/80';
};

const FileNode = ({ data, selected }: NodeProps<FileNodeData>) => {
  const filename = data.label ? (data.label.split(/[/\\]/).pop() || data.label) : 'Unknown';
  const ext = filename.split('.').pop() || '';
  const semanticClasses = getSemanticColors(filename, selected);

  return (
    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-200 shadow-md min-w-[160px] backdrop-blur-sm ${semanticClasses}`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 w-0 h-0" />
      
      <div className="flex items-center justify-center bg-black/20 p-1.5 rounded-md shadow-inner">
        {getFileIcon(ext)}
      </div>

      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <span className="text-[13px] font-mono font-medium text-slate-100 truncate leading-tight tracking-tight" title={data.label}>
          {filename}
        </span>
        {data.loc !== undefined && (
          <span className="text-[10px] text-slate-400/80 font-medium leading-tight mt-0.5 flex items-center gap-1">
            {data.loc} LoC
            {data.heavyNodeCount !== undefined && data.heavyNodeCount > 5 && (
              <span className="flex items-center text-orange-500" title={`Heavy Dependency: ${data.heavyNodeCount} Descendants`}>
                <Flame className="w-3 h-3 ml-1 fill-orange-500/20" />
              </span>
            )}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0 w-0 h-0" />
    </div>
  );
};

export default memo(FileNode);
