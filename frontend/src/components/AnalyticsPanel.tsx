import { useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { X, BarChart2, Trash2, CheckCircle, AlertTriangle, Repeat, Layers, Cpu, Box, Eye, ChevronDown, ChevronRight } from 'lucide-react';

export default function AnalyticsPanel() {
  const [isUnusedCollapsed, setIsUnusedCollapsed] = useState(true);
  const { 
    isAnalyticsOpen, toggleAnalytics, packageStats, unusedDependencies, circularImports,
    layers, couplingMetrics, violations, monolithicComponents, highlightViolations, toggleViolations
  } = useGraphStore();

  if (!isAnalyticsOpen) return null;

  const statsEntries = Object.entries(packageStats || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxCount = statsEntries.length > 0 ? statsEntries[0][1] : 1;

  return (
    <div className="absolute left-0 top-16 bottom-0 w-96 bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/80 shadow-2xl z-40 flex flex-col overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/80 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-slate-100">Repository Insights</h2>
        </div>
        <button onClick={toggleAnalytics} className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors" title="Close Panel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-900 border-b border-slate-700/80 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Highlight Violations</span>
          <button 
            onClick={toggleViolations}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${highlightViolations ? 'bg-red-500' : 'bg-slate-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${highlightViolations ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Isolates circular and tightly coupled edges in red.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        
        {/* Package Statistics */}
        <section>
          <h3 className="text-[11px] font-bold uppercase text-slate-500 mb-4 tracking-wider flex items-center gap-2">
            Top Packages
          </h3>
          {statsEntries.length > 0 ? (
            <div className="space-y-4">
              {statsEntries.map(([pkg, count]) => (
                <div key={pkg} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-300">
                    <span className="font-mono text-[11px] text-slate-200">{pkg}</span>
                    <span className="text-indigo-300">{count} ref{count !== 1 && 's'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-500">No external packages found.</p>
            </div>
          )}
        </section>

        {/* Unused Dependencies */}
        <section>
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-slate-800/50 p-1 -ml-1 rounded transition-colors"
            onClick={() => setIsUnusedCollapsed(!isUnusedCollapsed)}
          >
            <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2 m-0">
              Unused Dependencies
              <span className="bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded-full text-[9px]">
                {unusedDependencies?.length || 0}
              </span>
            </h3>
            {isUnusedCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
          {!isUnusedCollapsed && (
            unusedDependencies && unusedDependencies.length > 0 ? (
              <ul className="space-y-2">
                {unusedDependencies.map(pkg => (
                  <li key={pkg} className="flex items-center gap-3 text-sm text-slate-300 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-mono text-xs">{pkg}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-4 py-3 rounded-lg">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">Your manifests are clean.</span>
              </div>
            )
          )}
        </section>

        {/* Circular Imports */}
        <section>
          <h3 className="text-[11px] font-bold uppercase text-slate-500 mb-4 tracking-wider flex items-center gap-2">
            Circular Imports
          </h3>
          {circularImports && circularImports.length > 0 ? (
            <div className="space-y-4">
              {circularImports.map((cycle, i) => (
                <div key={i} className="bg-orange-950/20 border border-orange-900/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-900/20">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Cycle #{i + 1}</span>
                  </div>
                  <ul className="space-y-2 pl-1 border-l-2 border-orange-500/20 ml-2">
                    {cycle.map(path => {
                      const name = path.split(/[/\\]/).pop();
                      return (
                        <li key={path} className="flex items-start gap-2 text-xs text-slate-300">
                          <Repeat className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span className="font-mono break-all leading-tight" title={path}>{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-500">No circular imports detected.</p>
            </div>
          )}
        </section>

        {/* Architecture Overview */}
        <section>
          <h3 className="text-[11px] font-bold uppercase text-slate-500 mb-4 tracking-wider flex items-center gap-2">
            Architecture Overview
          </h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Layer</th>
                  <th className="px-3 py-2 font-medium text-right">Files</th>
                  <th className="px-3 py-2 font-medium text-right">Instability (I)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {Object.keys(layers).length > 0 ? (
                  Object.entries(layers).map(([layer, files]) => {
                    const metrics = couplingMetrics[layer];
                    const i = metrics?.instability ?? 0;
                    const isUnstable = i > 0.7;
                    return (
                      <tr key={layer} className="hover:bg-slate-700/30">
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-300 break-all">{layer}</td>
                        <td className="px-3 py-2 text-right text-slate-400">{files.length}</td>
                        <td className={`px-3 py-2 text-right font-medium ${isUnstable ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {i.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-500 italic">No layers detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Coupling Tracker */}
        <section>
          <h3 className="text-[11px] font-bold uppercase text-slate-500 mb-4 tracking-wider flex items-center gap-2">
            Coupling Tracker
          </h3>
          {violations && violations.length > 0 ? (
            <div className="space-y-3">
              {violations.map((v, i) => (
                <div key={i} className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Tight Coupling</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono break-all">
                    <span>{v.layers[0]}</span>
                    <Repeat className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{v.layers[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-500">No tight layer coupling detected.</p>
            </div>
          )}
        </section>

        {/* Monolith Scanner */}
        <section>
          <h3 className="text-[11px] font-bold uppercase text-slate-500 mb-4 tracking-wider flex items-center gap-2">
            Monolith Scanner
          </h3>
          {monolithicComponents && monolithicComponents.length > 0 ? (
            <div className="space-y-2">
              {monolithicComponents.map((component) => {
                const name = component.split(/[/\\]/).pop();
                return (
                  <div key={component} className="flex items-center gap-3 bg-purple-950/20 border border-purple-900/30 px-3 py-2 rounded-lg">
                    <Box className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-purple-300 truncate" title={component}>{name}</span>
                      <span className="text-[10px] text-slate-500 font-mono truncate">{component}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-4 py-3 rounded-lg">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">No monoliths detected.</span>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
