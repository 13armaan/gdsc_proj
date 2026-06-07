import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  type Node,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, FolderSearch } from 'lucide-react';
import { useGraphStore } from './store/useGraphStore';
import FileNode from './components/FileNode';

const nodeTypes = {
  fileNode: FileNode,
};

function AppContent() {
  const {
    nodes,
    edges,
    scanTarget,
    selectedNode,
    summaryData,
    isLoading,
    isSummaryLoading,
    scanError,
    setScanTarget,
    fetchGraph,
    fetchSummary,
    onNodesChange,
    onEdgesChange
  } = useGraphStore();

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      fetchSummary(node.id);
    },
    [fetchSummary]
  );

  const handleScan = () => {
    if (scanTarget.trim()) {
      fetchGraph();
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white text-gray-800 font-sans">
      
      {/* Floating Control Panel */}
      <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
          <FolderSearch className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Enter absolute directory path..."
            className="bg-transparent border-none outline-none text-sm w-80 placeholder-gray-400"
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
        {scanError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 pointer-events-none">
            <p className="text-lg font-semibold">{scanError}</p>
            <p className="text-sm mt-2 text-gray-500">Ensure the backend is running and the path is valid.</p>
          </div>
        ) : nodes.length === 0 && !isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            <p>Enter a repository path to begin static analysis</p>
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
            className="bg-gray-50/50"
          >
            <Background color="#cbd5e1" gap={20} size={2} />
            <Controls className="bg-white border border-gray-200 shadow-sm rounded-lg" />
          </ReactFlow>
        )}
      </div>

      {/* Sidebar Panel */}
      <div className="w-96 shrink-0 h-full border-l border-gray-200 bg-white flex flex-col p-6 shadow-xl z-10 relative overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">File Details</h2>
        
        {!selectedNode ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <p>Select a file node in the graph to view its AI summary and metrics.</p>
          </div>
        ) : isSummaryLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm animate-pulse">Analyzing file context via LLM...</p>
          </div>
        ) : summaryData ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selected File</h3>
              <p className="text-sm font-mono bg-gray-100 p-3 rounded-lg text-gray-800 break-all border border-gray-200">
                {selectedNode}
              </p>
            </div>

            {summaryData.loc !== undefined && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Metrics</h3>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-sm text-blue-800 font-medium">Lines of Code</span>
                  <span className="text-lg font-bold text-blue-600">{summaryData.loc}</span>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Summary</h3>
              <div className="prose prose-sm prose-blue text-gray-600 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="whitespace-pre-wrap">{summaryData.summary}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center text-red-500 space-y-4">
            <p>Failed to load data for this file.</p>
          </div>
        )}
      </div>
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
