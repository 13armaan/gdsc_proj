import { useCallback, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  type Node,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Search, Loader2, FolderSearch, AlertCircle, Waypoints, Network, ChevronUp, ChevronDown, Maximize2, Minimize2, BarChart2, LayoutDashboard, FolderOpen } from 'lucide-react';
import axios from 'axios';
import { useGraphStore } from './store/useGraphStore';
import FileNode from './components/FileNode';
import FolderNode from './components/FolderNode';
import AggregatedNode from './components/AggregatedNode';
import ImportEdge from './components/ImportEdge';
import Sidebar from './components/Sidebar';
import AnalyticsPanel from './components/AnalyticsPanel';
import StatisticsModal from './components/StatisticsModal';

const nodeTypes = {
  file: FileNode,
  folder: FolderNode,
  aggregated: AggregatedNode
};

const edgeTypes = {
  import: ImportEdge
};

const AppContent = () => {
  const {
    nodes,
    rawNodes,
    edges,
    isLoading,
    scanError,
    scanTarget,
    setScanTarget,
    fetchGraph,
    onNodesChange,
    onEdgesChange,
    fetchSummary,
    selectedNode,
    expandAllFolders,
    collapseAllFolders,
    isAnalyticsOpen,
    toggleAnalytics,
    isStatsModalOpen,
    toggleStatsModal,
    currentViewMode,
    setViewMode,
    collapsedNodes,
    toggleNodeCollapse,
    searchQuery: globalSearchQuery,
    setSearchQuery: setGlobalSearchQuery,
    getVisibleElements
  } = useGraphStore();

  const { fitView, setCenter } = useReactFlow();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [autoExpandedFolder, setAutoExpandedFolder] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setGlobalSearchQuery(localSearchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [localSearchQuery, setGlobalSearchQuery]);

  const searchResults = useMemo(() => {
    if (!localSearchQuery.trim()) return [];
    return rawNodes.filter(n => n.id.toLowerCase().includes(localSearchQuery.toLowerCase()));
  }, [localSearchQuery, rawNodes]);

  // Update search results whenever query changes
  useEffect(() => {
    setFocusedIndex(-1);
    setSearchError(null);
  }, [localSearchQuery]);

  const { visibleNodes, visibleEdges } = getVisibleElements();

  const handleScan = async () => {
    if (!scanTarget.trim()) return;
    await fetchGraph();
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  };

  const handleBrowse = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/browse');
      if (response.data.path) {
        setScanTarget(response.data.path);
      }
    } catch (error) {
      console.error("Failed to open file browser", error);
    }
  };

  const handleNodeSearch = async (e?: React.FormEvent, direction: 'next' | 'prev' = 'next') => {
    if (e) e.preventDefault();
    if (localSearchQuery.trim() && searchResults.length === 0) {
      setSearchError("No files found");
      return;
    }
    setSearchError(null);
    if (searchResults.length === 0) return;
    
    let targetIndex = 0;
    if (focusedIndex === -1) {
      targetIndex = direction === 'next' ? 0 : searchResults.length - 1;
    } else {
      if (direction === 'next') {
        targetIndex = (focusedIndex + 1) % searchResults.length;
      } else {
        targetIndex = focusedIndex - 1 < 0 ? searchResults.length - 1 : focusedIndex - 1;
      }
    }
    
    setFocusedIndex(targetIndex);
    const targetNode = searchResults[targetIndex];
    
    if (targetNode) {
      // Find the current layout position from the store
      const currentNode = useGraphStore.getState().nodes.find(n => n.id === targetNode.id) || targetNode;
      let x = currentNode.position.x + (currentNode.width || 200) / 2;
      let y = currentNode.position.y + (currentNode.height || 60) / 2;
      
      if (currentViewMode === 'file' && targetNode.type === 'file') {
        const lastSlash = Math.max(targetNode.id.lastIndexOf('/'), targetNode.id.lastIndexOf('\\'));
        const folder = lastSlash >= 0 ? targetNode.id.substring(0, lastSlash) : 'root';
        const folderId = `folder_${folder}`;
        
        let shouldRefetchPosition = false;

        // Collapse previously auto-expanded folder if it's different
        if (autoExpandedFolder && autoExpandedFolder !== folderId && !collapsedNodes.has(autoExpandedFolder)) {
          await toggleNodeCollapse(autoExpandedFolder);
          shouldRefetchPosition = true;
        }

        // Expand target folder if collapsed
        if (collapsedNodes.has(folderId)) {
          await toggleNodeCollapse(folderId);
          setAutoExpandedFolder(folderId);
          shouldRefetchPosition = true;
        }

        if (shouldRefetchPosition) {
          // Re-fetch targetNode from the updated nodes state to get new position
          const updatedNode = useGraphStore.getState().nodes.find(n => n.id === targetNode.id);
          if (updatedNode) {
            x = updatedNode.position.x + (updatedNode.width || 200) / 2;
            y = updatedNode.position.y + (updatedNode.height || 60) / 2;
          }
        }
      }

      setCenter(x, y, { zoom: 1.5, duration: 800 });
    }
  };

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'folder' || node.type === 'aggregated') return;
      fetchSummary(node.id);
    },
    [fetchSummary]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'folder' || node.type === 'aggregated') {
        toggleNodeCollapse(node.id);
      }
    },
    [toggleNodeCollapse]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-900 text-slate-100 font-sans">
      
      {/* Dedicated Header Bar */}
      <header className="w-full bg-slate-800/95 border-b border-slate-700/80 px-6 py-3 flex items-center justify-between z-50 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3 select-none cursor-default">
          <Waypoints className="w-6 h-6 text-blue-500" />
          <h1 className="font-bold text-lg tracking-wide text-slate-100">RepoMap<span className="text-blue-500">Analyzer</span></h1>
        </div>

        <div className="flex items-center gap-4">
          {nodes.length > 0 && (
            <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
              {(['file', 'folder', 'module'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode).then(() => {
                      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${currentViewMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

          <div className="bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 border border-slate-600 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
              <FolderSearch className="w-4 h-4 text-blue-400 mr-2" />
              <input
                type="text"
                placeholder="Absolute path..."
                className="bg-transparent border-none outline-none text-xs w-64 text-slate-200 placeholder-slate-500"
                value={scanTarget}
                onChange={(e) => setScanTarget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <button 
                onClick={handleBrowse}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors ml-1"
                title="Browse Folders"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handleScan}
              disabled={isLoading || !scanTarget.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {isLoading ? 'Scanning...' : 'Scan'}
            </button>
          </div>

          {nodes.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={expandAllFolders} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5 text-xs font-medium transition-colors" title="Expand All">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={collapseAllFolders} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5 text-xs font-medium transition-colors" title="Collapse All">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button onClick={toggleAnalytics} className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${isAnalyticsOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 hover:bg-slate-700 border-slate-700/50 text-slate-300'}`} title="View Insights">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Insights
                </button>
                <button onClick={toggleStatsModal} className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${isStatsModalOpen ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 hover:bg-slate-700 border-slate-700/50 text-slate-300'}`} title="View Dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </button>
              </div>

              <form onSubmit={(e) => handleNodeSearch(e)} className="bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-700/50 flex items-center gap-2 transition-all duration-300 relative">
              <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 border border-slate-600 focus-within:border-purple-500/80 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all">
                <Search className="w-4 h-4 text-purple-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search file..."
                  className="bg-transparent border-none outline-none text-xs w-48 text-slate-200 placeholder-slate-500"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 ? (
                  <span className="text-[10px] text-slate-400 ml-2 font-mono whitespace-nowrap">
                    {focusedIndex === -1 ? 0 : focusedIndex + 1} / {searchResults.length}
                  </span>
                ) : (localSearchQuery.trim() && searchError) ? (
                  <span className="text-[10px] text-red-400 ml-2 font-mono whitespace-nowrap">
                    0 / 0
                  </span>
                ) : null}
              </div>
              
              {localSearchQuery.trim() && searchError && (
                 <div className="absolute top-12 right-0 bg-red-900/90 text-white text-xs px-2 py-1 rounded shadow-lg">
                    {searchError}
                 </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => handleNodeSearch(undefined, 'prev')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Previous match">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleNodeSearch(undefined, 'next')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Next match (Enter)">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button type="submit" className="hidden">Search</button>
            </form>
            </>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full relative">
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
            <div className="flex flex-col items-center text-center opacity-60 select-none cursor-default pointer-events-auto">
              <Network className="w-24 h-24 text-slate-500 mb-6" strokeWidth={1.5} />
              <h2 className="text-2xl font-medium text-slate-300 mb-3">Ready to map your architecture</h2>
              <p className="text-slate-400 max-w-md text-base leading-relaxed">
                Enter a local repository path above and click Scan Repo to begin visualizing your codebase.
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            minZoom={0.05}
            fitView
            fitViewOptions={{ maxZoom: 1.2, padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e293b" variant="dots" gap={24} size={1.5} />
            <Controls className="bg-slate-800 border-slate-700 fill-slate-200" />
          </ReactFlow>
        )}
      </div>

      <AnalyticsPanel />
      <StatisticsModal />
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
