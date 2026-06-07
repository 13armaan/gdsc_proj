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

const FileNode = ({ data, selected }: NodeProps<FileNodeData>) => {
  return (
    <div
      className={`relative bg-slate-800 text-white rounded-lg shadow-lg border p-3 min-w-[200px] hover:border-blue-500 transition-colors flex items-center gap-3 ${
        selected ? 'border-blue-500 shadow-blue-500/20 shadow-xl' : 'border-slate-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-blue-500 border-none"
      />
      
      <div className="flex-shrink-0 flex items-center justify-center">
        {getFileIcon(data.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-medium truncate" title={data.label}>
          {data.label}
        </p>
      </div>

      {data.loc !== undefined && (
        <div className="flex-shrink-0 ml-auto">
          <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300 font-mono">
            {data.loc} LoC
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-blue-500 border-none"
      />
    </div>
  );
};

export default memo(FileNode);
