import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, FolderSearch, AlertCircle, Waypoints } from 'lucide-react';
import { useGraphStore } from './store/useGraphStore';
import FileNode from './components/FileNode';
import Sidebar from './components/Sidebar';

const nodeTypes = {
  file: FileNode,
};

const AppContent = () => {
  const {
    nodes,
    edges,
    isLoading,
    scanError,
    scanTarget,
    setScanTarget,
    fetchGraph,
    onNodesChange,
    onEdgesChange,
    fetchSummary
  } = useGraphStore();

  const { fitView } = useReactFlow();

  const handleScan = async () => {
    if (!scanTarget.trim()) return;
    await fetchGraph();
    // Allow a brief moment for React Flow to render the new nodes before animating the zoom
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  };

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      fetchSummary(node.id);
    },
    [fetchSummary]
  );



  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-900 text-slate-100 font-sans">
      
      {/* Floating Control Panel */}
      <div className="absolute top-4 left-4 z-50 bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3">
        <div className="flex items-center bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
          <FolderSearch className="w-5 h-5 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Enter absolute directory path..."
            className="bg-transparent border-none outline-none text-sm w-80 text-white placeholder-slate-500"
            value={scanTarget}
            onChange={(e) => setScanTarget(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          />
        </div>
        <button
          onClick={handleScan}
          disabled={isLoading || !scanTarget.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Scanning...' : 'Scan Repo'}
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 h-full relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-semibold text-slate-100">Analyzing Repository...</p>
          </div>
        )}
        {scanError ? (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-red-500/30 flex flex-col items-center text-center max-w-md shadow-2xl">
              <AlertCircle className="w-16 h-16 text-red-400 mb-4 opacity-90" />
              <p className="text-xl font-semibold text-red-400 mb-2">{scanError}</p>
              <p className="text-sm text-slate-400">Directory not found or access denied. Please check the path and try again.</p>
            </div>
          </div>
        ) : nodes.length === 0 && !isLoading ? (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center text-center opacity-60">
              <Waypoints className="w-24 h-24 text-slate-500 mb-6" strokeWidth={1.5} />
              <h2 className="text-2xl font-medium text-slate-300 mb-3">Ready to map your architecture</h2>
              <p className="text-slate-400 max-w-md text-base leading-relaxed">
                Enter a local repository path above and click Scan Repo to begin visualizing your codebase.
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ maxZoom: 1.2, padding: 0.2 }}
          >
            <Background color="#334155" variant="dots" gap={20} size={2} />
            <Controls className="bg-slate-800 border-slate-700 fill-slate-200" />
            <MiniMap 
              nodeStrokeColor="#334155" 
              nodeColor="#1e293b" 
              maskColor="rgba(15, 23, 42, 0.8)" 
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} 
            />
          </ReactFlow>
        )}
      </div>

      <Sidebar />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}

export default App;
