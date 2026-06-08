import { useGraphStore } from '../store/useGraphStore';
import { Layers, Activity, Bug, GitCommit, FileDigit } from 'lucide-react';

const HeatmapLegend = () => {
  const { activeHeatmapMode, setHeatmapMode, maxCommitCount } = useGraphStore();

  const modes = [
    { id: 'none', label: 'Default', icon: <Layers className="w-4 h-4" /> },
    { id: 'complexity', label: 'Complexity', icon: <Activity className="w-4 h-4" /> },
    { id: 'size', label: 'File Size', icon: <FileDigit className="w-4 h-4" /> },
    { id: 'contribution', label: 'Contribution', icon: <GitCommit className="w-4 h-4" /> },
    { id: 'bugHotspot', label: 'Bug Risk', icon: <Bug className="w-4 h-4" /> },
  ] as const;

  const showGitWarning = maxCommitCount <= 1 && (activeHeatmapMode === 'contribution' || activeHeatmapMode === 'bugHotspot');

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-2xl w-64 pointer-events-auto">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Heatmap Modes</h3>
      
      <div className="space-y-1 mb-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setHeatmapMode(mode.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              activeHeatmapMode === mode.id 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-300 hover:bg-slate-800 border border-transparent'
            }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {activeHeatmapMode !== 'none' && (
        <div className="px-1">
          <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1.5">
            <span>Low</span>
            <span>High</span>
          </div>
          <div className={`h-2 rounded-full w-full ${
            activeHeatmapMode === 'complexity' || activeHeatmapMode === 'size' ? 'bg-gradient-to-r from-slate-800 to-amber-600' :
            activeHeatmapMode === 'contribution' ? 'bg-gradient-to-r from-slate-800 to-violet-600' :
            'bg-gradient-to-r from-slate-800 to-rose-600'
          }`} />
          {activeHeatmapMode === 'bugHotspot' && (
             <p className="text-[10px] text-slate-400 mt-2 leading-tight">Highlighting nodes with high complexity & frequent changes.</p>
          )}
        </div>
      )}

      {showGitWarning && (
        <div className="mt-3 bg-amber-950/40 border border-amber-700/50 p-2 rounded-lg">
          <p className="text-xs text-amber-500 leading-tight">No git history found. Churn metrics disabled.</p>
        </div>
      )}
    </div>
  );
};

export default HeatmapLegend;
