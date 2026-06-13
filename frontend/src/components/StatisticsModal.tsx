import React, { useMemo } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { X, LayoutDashboard, Code, HardDrive, GitCommit, Users, Calendar } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#64748b'];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function StatisticsModal() {
  const { isStatsModalOpen, toggleStatsModal, statistics } = useGraphStore();

  const chartData = useMemo(() => {
    if (!statistics) return null;

    // Language Distribution Data
    const languageData = Object.entries(statistics.language_distribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number));

    // Growth History Data
    const growthData = Object.entries(statistics.growth_history || {})
      .map(([date, data]: [string, any]) => ({ date, loc: data?.net ?? data ?? 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Contribution Stats
    const heatmap = statistics.contribution_heatmap || {};
    const authors = new Set<string>();
    let mostActiveDate = '-';
    let maxCommits = 0;

    Object.entries(heatmap).forEach(([date, authorsObj]) => {
      let dailyCommits = 0;
      Object.entries(authorsObj as Record<string, number>).forEach(([author, count]) => {
        authors.add(author);
        dailyCommits += count;
      });
      if (dailyCommits > maxCommits) {
        maxCommits = dailyCommits;
        mostActiveDate = date;
      }
    });

    const totalBytes = languageData.reduce((acc, curr) => acc + (curr.value as number), 0);

    return {
      languageData,
      growthData,
      totalAuthors: authors.size,
      mostActiveDate,
      totalBytes
    };
  }, [statistics]);

  if (!isStatsModalOpen || !statistics || !chartData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/95 backdrop-blur-md overflow-y-auto p-6 md:p-10 flex flex-col font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl">
            <LayoutDashboard className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-stone-100 tracking-tight">Codebase Dashboard</h2>
            <p className="text-stone-400 mt-1 flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> 
              Avg File Size: <span className="font-semibold text-stone-200">{formatBytes(statistics.average_file_size_bytes)}</span>
            </p>
          </div>
        </div>
        
        <button 
          onClick={toggleStatsModal}
          className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2.5 rounded-xl border border-stone-700/50 transition-all shadow-sm"
        >
          <span className="font-medium">Close Dashboard</span>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        
        {/* Language Distribution */}
        <div className="bg-stone-800/60 rounded-2xl border border-stone-700/50 p-6 flex flex-col shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Code className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-semibold text-stone-200">Language Distribution</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.languageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.languageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = ((data.value / chartData.totalBytes) * 100).toFixed(1);
                      return (
                        <div className="bg-stone-800 border border-stone-600 rounded-lg p-3 shadow-xl">
                          <p className="text-stone-200 font-semibold mb-1 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
                            {data.name}
                          </p>
                          <p className="text-stone-400 text-sm ml-5">
                            {percentage}% <span className="text-stone-500 mx-1">•</span> {formatBytes(data.value)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  content={({ payload }) => (
                    <div className="bg-stone-900/80 border border-stone-700/80 rounded-xl p-1 shadow-lg ml-2 max-h-[260px] overflow-y-auto hidden md:block">
                      <table className="w-full text-left text-sm">
                        <tbody>
                          {(payload || []).map((entry: any, index: number) => (
                            <tr key={`item-${index}`} className="border-b border-stone-800 last:border-0 hover:bg-stone-800/50 transition-colors">
                              <td className="py-2.5 px-3 flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: entry.color }} />
                                <span className="text-stone-300 font-medium whitespace-nowrap">{entry.value}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repository Growth */}
        <div className="bg-stone-800/60 rounded-2xl border border-stone-700/50 p-6 flex flex-col shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <GitCommit className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-stone-200">Repository Growth</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            {chartData.growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLoc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                    itemStyle={{ color: '#10b981', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="loc" name="Net Lines Added" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLoc)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500">
                Not enough git history found.
              </div>
            )}
          </div>
        </div>

        {/* Top 10 Largest Files */}
        <div className="bg-stone-800/60 rounded-2xl border border-stone-700/50 p-6 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <HardDrive className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-stone-200">Top 10 Largest Files</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-300">
              <thead className="text-xs uppercase bg-stone-900/50 text-stone-400 border-b border-stone-700">
                <tr>
                  <th scope="col" className="px-4 py-3 rounded-tl-lg">File Path</th>
                  <th scope="col" className="px-4 py-3 rounded-tr-lg text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {(statistics.largest_files || []).map((file: any, i: number) => (
                  <tr key={i} className="border-b border-stone-700/50 last:border-0 hover:bg-stone-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[300px]" title={file.file_path}>
                      {file.file_path.split(/[\/\\]/).pop()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-200 whitespace-nowrap">
                      {formatBytes(file.size_bytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Complex Files & Contribution Stats */}
        <div className="flex flex-col gap-8">
          
          {/* Contribution Stats Card */}
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 rounded-2xl border border-teal-500/30 p-6 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/20 rounded-full">
                <Users className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-200/80 uppercase tracking-wider mb-1">Total Contributors</p>
                <p className="text-3xl font-bold text-white">{chartData.totalAuthors}</p>
              </div>
            </div>
            
            <div className="h-12 w-px bg-teal-500/30 mx-4"></div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/20 rounded-full">
                <Calendar className="w-6 h-6 text-rose-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-200/80 uppercase tracking-wider mb-1">Most Active Date</p>
                <p className="text-xl font-bold text-white">{chartData.mostActiveDate}</p>
              </div>
            </div>
          </div>

          {/* Top 10 Complex Files */}
          <div className="bg-stone-800/60 rounded-2xl border border-stone-700/50 p-6 flex-1 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <Code className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-stone-200">Top 10 Complex Files</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-300">
                <thead className="text-xs uppercase bg-stone-900/50 text-stone-400 border-b border-stone-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 rounded-tl-lg">File Path</th>
                    <th scope="col" className="px-4 py-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(statistics.complex_files || []).map((file: any, i: number) => (
                    <tr key={i} className="border-b border-stone-700/50 last:border-0 hover:bg-stone-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs truncate max-w-[300px]" title={file.file_path}>
                        {file.file_path.split(/[\/\\]/).pop()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-900/60 rounded">
                          {file.complexity_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
