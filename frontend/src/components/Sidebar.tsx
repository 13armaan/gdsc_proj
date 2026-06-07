import { X } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';

const Sidebar = () => {
  const {
    selectedNode,
    summaryData,
    isSummaryLoading,
    clearSelection,
  } = useGraphStore();

  if (!selectedNode) {
    return null;
  }

  // Extract just the filename for a cleaner header
  const filename = selectedNode.split(/[/\\]/).pop() || selectedNode;

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-slate-800 border-l border-slate-700 shadow-2xl p-6 flex flex-col z-50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-700">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Selected File
          </h2>
          <h1 className="text-lg font-mono font-bold text-slate-100 truncate break-all" title={selectedNode}>
            {filename}
          </h1>
          <p className="text-xs text-slate-500 mt-1 truncate" title={selectedNode}>
            {selectedNode}
          </p>
        </div>
        <button
          onClick={clearSelection}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Loading State */}
      {isSummaryLoading ? (
        <div className="flex-1 animate-pulse space-y-6 mt-4">
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
          <div className="h-24 bg-slate-700 rounded-lg w-full mt-8"></div>
        </div>
      ) : summaryData ? (
        /* Content State */
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              AI Summary
            </h3>
            <div className="prose prose-sm prose-invert text-slate-300 leading-relaxed bg-slate-900 border border-slate-700 rounded-lg p-5 shadow-inner">
              <p className="whitespace-pre-wrap m-0">{summaryData.summary}</p>
            </div>
          </div>

          {summaryData.loc !== undefined && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Metrics
              </h3>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 shadow-inner flex items-center justify-between">
                <span className="text-sm text-slate-400 font-medium">Lines of Code</span>
                <span className="text-xl font-bold text-blue-400">{summaryData.loc}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Error/Empty State */
        <div className="flex-1 flex items-center justify-center text-red-400">
          <p>Failed to load data for this file.</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
