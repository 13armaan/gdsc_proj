import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { FileCode2, FileJson, FileText, Settings, File, Braces, Terminal } from 'lucide-react';

interface FileNodeData {
  label: string;
  type: string;
  loc?: number;
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
  
  // Default Gray for standard files
  return selected 
    ? 'bg-slate-800/90 border-slate-300 shadow-slate-500/20' 
    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500/80';
};

const FileNode = ({ data, selected }: NodeProps<FileNodeData>) => {
  // Extract filename safely
  const filename = data.label ? (data.label.split(/[/\\]/).pop() || data.label) : 'Unknown';
  const semanticClasses = getSemanticColors(filename, selected);

  return (
    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-200 shadow-md min-w-[160px] backdrop-blur-sm ${semanticClasses}`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 w-0 h-0" />
      
      <div className="flex items-center justify-center bg-black/20 p-1.5 rounded-md shadow-inner">
        {getFileIcon(data.type)}
      </div>

      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <span className="text-[13px] font-mono font-medium text-slate-100 truncate leading-tight tracking-tight" title={data.label}>
          {filename}
        </span>
        {data.loc !== undefined && (
          <span className="text-[10px] text-slate-400/80 font-medium leading-tight mt-0.5">
            {data.loc} LoC
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0 w-0 h-0" />
    </div>
  );
};

export default memo(FileNode);
