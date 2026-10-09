import React from 'react';
import { History, Eye, Trash2, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RecentAnalyses({
  analyses = [],
  currentId,
  onSelectAnalysis,
  onDeleteAnalysis
}) {
  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-950 border border-blue-800 rounded-md text-blue-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Recent Analyses</h3>
            <p className="text-[11px] text-slate-400">Historical runs recorded in SQLite database</p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
          {analyses.length} Recorded
        </span>
      </div>

      {/* Table / List */}
      {analyses.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No previous analyses found. Complete a change detection run to store it here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Analysis ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Before / After</th>
                <th className="py-2.5 px-3 text-right">Changed Area</th>
                <th className="py-2.5 px-3 text-right">Confidence</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {analyses.map((item) => {
                const isSelected = item.id === currentId;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${isSelected
                        ? 'bg-cyan-950/40 text-cyan-200'
                        : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                  >
                    <td className="py-3 px-3 font-semibold text-cyan-400 whitespace-nowrap">
                      #{item.id.replace('ANL_', '')}
                    </td>

                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      <span className="text-slate-400 truncate max-w-[100px] inline-block align-middle" title={item.before_filename}>
                        {item.before_filename}
                      </span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span className="text-slate-300 truncate max-w-[100px] inline-block align-middle" title={item.after_filename}>
                        {item.after_filename}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="text-rose-400 font-bold">
                        {item.change_percentage?.toFixed(1)}%
                      </span>
                      <span className="text-slate-500 text-[10px] ml-1">
                        ({Math.round(item.changed_area_m2).toLocaleString()} m²)
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-cyan-300 whitespace-nowrap">
                      {item.confidence_score?.toFixed(1)}%
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Completed</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectAnalysis(item)}
                          className="px-2 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors text-[11px] flex items-center space-x-1"
                          title="View analysis results"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="font-sans">View</span>
                        </button>
                        <button
                          onClick={() => onDeleteAnalysis(item.id)}
                          className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors text-slate-500"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
