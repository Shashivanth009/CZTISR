import { useState, useEffect } from 'react';
import { FileText, Filter, CheckCircle, XCircle } from 'lucide-react';
import { GlassExpand } from './GlassExpand';
import { config } from '../config';

interface Props { token: string; }

export const AuditLog = ({ token }: Props) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'PERMIT' | 'DENY'>('ALL');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const resp = await fetch(`${config.gatewayUrl}/api/audit-logs`);
                const data = await resp.json();
                setLogs(data);
            } catch (e) { console.error('Audit fetch error', e); }
        };
        fetchLogs();
        const interval = setInterval(fetchLogs, 3000);
        return () => clearInterval(interval);
    }, [token]);

    const filtered = filter === 'ALL' ? logs : logs.filter(l => l.decision === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText size={16} className="text-cyber-neon" /> IMMUTABLE AUDIT TRAIL
                </h3>
                <div className="flex gap-2">
                    {(['ALL', 'PERMIT', 'DENY'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-[10px] rounded border transition-all ${filter === f
                                ? f === 'DENY' ? 'border-cyber-red bg-cyber-red/20 text-cyber-red'
                                    : f === 'PERMIT' ? 'border-cyber-neon bg-cyber-neon/20 text-cyber-neon'
                                        : 'border-cyber-blue bg-cyber-blue/20 text-cyber-blue'
                                : 'border-cyber-slate/30 text-gray-500 hover:text-white'
                                }`}
                        >
                            <Filter size={10} className="inline mr-1" />{f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded text-center">
                    <div className="text-2xl font-bold text-white">{logs.length}</div>
                    <div className="text-[10px] text-gray-400 tracking-wider">TOTAL EVENTS</div>
                </div>
                <div className="glass-panel p-4 rounded text-center">
                    <div className="text-2xl font-bold text-cyber-neon">{logs.filter(l => l.decision === 'PERMIT').length}</div>
                    <div className="text-[10px] text-gray-400 tracking-wider">PERMITTED</div>
                </div>
                <div className="glass-panel p-4 rounded text-center">
                    <div className="text-2xl font-bold text-cyber-red">{logs.filter(l => l.decision === 'DENY').length}</div>
                    <div className="text-[10px] text-gray-400 tracking-wider">DENIED</div>
                </div>
            </div>

            {/* Log Table */}
            <GlassExpand title="AUDIT TRAIL">
                <div className="glass-panel rounded overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-gray-400 bg-black/40 border-b border-cyber-slate/30">
                                <th className="text-left p-3">TIMESTAMP</th>
                                <th className="text-left p-3">ACTOR</th>
                                <th className="text-left p-3">ACTION</th>
                                <th className="text-left p-3">RESOURCE</th>
                                <th className="text-left p-3">DECISION</th>
                                <th className="text-left p-3">RISK</th>
                                <th className="text-left p-3">DETAILS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No audit events yet. Interact with the system to generate events.</td></tr>
                            ) : (
                                filtered.map((log: any) => (
                                    <tr key={log.id} className="border-b border-cyber-slate/10 hover:bg-cyber-neon/5 transition-colors">
                                        <td className="p-3 text-gray-400 font-mono">{log.timestamp}</td>
                                        <td className="p-3 text-white">{log.actor}</td>
                                        <td className="p-3 text-gray-300">{log.action}</td>
                                        <td className="p-3 text-gray-300 font-mono">{log.resource}</td>
                                        <td className="p-3">
                                            {log.decision === 'PERMIT' ? (
                                                <span className="flex items-center gap-1 text-cyber-neon"><CheckCircle size={12} /> PERMIT</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-cyber-red"><XCircle size={12} /> DENY</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.risk_score > 50 ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-neon/20 text-cyber-neon'
                                                }`}>{log.risk_score}</span>
                                        </td>
                                        <td className="p-3 text-gray-400 truncate max-w-[200px]">{log.details}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassExpand>
        </div>
    );
};
