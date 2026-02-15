import { useState, useEffect } from 'react';
import { Flag, Clock, Users, ChevronRight, Target } from 'lucide-react';
import { GlassExpand } from './GlassExpand';
import { config } from '../config';

interface Props { token: string; }

export const MissionControl = ({ token }: Props) => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await fetch(`${config.gatewayUrl}/api/missions`);
                setData(await resp.json());
            } catch (e) { console.error('Mission fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const getStatusColor = (s: string) =>
        s === 'ACTIVE' ? 'bg-cyber-neon/20 text-cyber-neon border-cyber-neon/30' :
            s === 'PLANNING' ? 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30' :
                s === 'COMPLETE' ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' :
                    'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30';

    const getPriorityColor = (p: string) =>
        p === 'CRITICAL' ? 'text-cyber-red' : p === 'HIGH' ? 'text-cyber-yellow' : 'text-cyber-blue';

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-neon">
                    <p className="text-[10px] text-gray-400 tracking-wider">ACTIVE OPS</p>
                    <div className="text-2xl font-bold text-cyber-neon">{data?.active ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-blue">
                    <p className="text-[10px] text-gray-400 tracking-wider">PLANNING</p>
                    <div className="text-2xl font-bold text-cyber-blue">{data?.planning ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-gray-500">
                    <p className="text-[10px] text-gray-400 tracking-wider">COMPLETE</p>
                    <div className="text-2xl font-bold text-gray-400">{data?.complete ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-yellow">
                    <p className="text-[10px] text-gray-400 tracking-wider">TOTAL MISSIONS</p>
                    <div className="text-2xl font-bold text-cyber-yellow">{data?.total ?? '—'}</div>
                </div>
            </div>

            {/* Mission Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data?.missions?.map((m: any) => (
                    <GlassExpand key={m.id} title={m.name}>
                        <div className="glass-panel p-5 rounded hover:border-cyber-neon/40 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Flag size={14} className={getPriorityColor(m.priority)} />
                                        <span className="text-xs font-bold text-white">{m.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">{m.id}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded border ${getStatusColor(m.status)}`}>{m.status}</span>
                            </div>

                            <p className="text-xs text-gray-400 mb-3">{m.objective}</p>

                            <div className="grid grid-cols-3 gap-2 text-[10px] mb-3">
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Users size={10} /> <span>{m.commander}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Target size={10} /> <span>{m.assets_assigned} Assets</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Clock size={10} /> <span>{m.start_time?.slice(11, 16)}</span>
                                </div>
                            </div>

                            {/* Classification Badge */}
                            <div className="flex justify-between items-center mb-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded ${m.classification === 'TOP_SECRET' ? 'bg-cyber-red/20 text-cyber-red' :
                                    m.classification === 'SECRET' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                        'bg-cyber-blue/20 text-cyber-blue'
                                    }`}>{m.classification}</span>
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-cyber-neon transition-colors" />
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyber-blue to-cyber-neon transition-all duration-1000 rounded" style={{ width: `${m.progress}%` }}></div>
                            </div>
                            <div className="text-right text-[10px] text-gray-500 mt-1">{m.progress}% COMPLETE</div>
                        </div>
                    </GlassExpand>
                ))}
            </div>
        </div>
    );
};
