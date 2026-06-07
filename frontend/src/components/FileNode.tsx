import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileCode2, FileJson, FileImage, FileText, Settings, File } from 'lucide-react';

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'go':
    case 'rs':
      return <FileCode2 className="w-5 h-5 text-blue-500" />;
    case 'json':
      return <FileJson className="w-5 h-5 text-green-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
      return <FileImage className="w-5 h-5 text-purple-500" />;
    case 'md':
    case 'txt':
      return <FileText className="w-5 h-5 text-gray-500" />;
    case 'env':
    case 'config':
    case 'toml':
    case 'yaml':
    case 'yml':
      return <Settings className="w-5 h-5 text-orange-500" />;
    default:
      return <File className="w-5 h-5 text-slate-500" />;
  }
};

const FileNode = ({ data, selected }: { data: { label: string }, selected: boolean }) => {
  return (
    <div
      className={`relative px-4 py-3 shadow-md rounded-xl bg-white border-2 transition-all duration-300 flex items-center gap-3 w-[250px] ${
        selected ? 'border-blue-500 shadow-blue-500/20 shadow-lg scale-105' : 'border-slate-200 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
      
      <div className="flex-shrink-0 bg-slate-50 p-2 rounded-lg border border-slate-100">
        {getFileIcon(data.label)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate" title={data.label}>
          {data.label}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-indigo-400 border-2 border-white"
      />
    </div>
  );
};

export default memo(FileNode);
