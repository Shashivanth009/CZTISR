import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Terminal, Lock, Shield, Activity } from 'lucide-react';
import { GlassExpand } from './GlassExpand';
import { config } from '../config';

interface Props { token: string; }

const COLORS = ['#00d9f9', '#ff2a6d', '#fcee0a', '#00ff9d'];

export const SOCDashboard = ({ token }: Props) => {
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [threats, setThreats] = useState<any>(null);
    const [networkStats, setNetworkStats] = useState<any>(null);

    // Simulated live traffic
    useEffect(() => {
        const initial = Array.from({ length: 20 }, (_, i) => ({
            time: i,
            traffic: Math.floor(Math.random() * 80) + 20,
            anomalies: Math.floor(Math.random() * 10)
        }));
        setTrafficData(initial);

        const interval = setInterval(() => {
            setTrafficData(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(1), {
                    time: last.time + 1,
                    traffic: Math.floor(Math.random() * 80) + 20,
                    anomalies: Math.random() > 0.85 ? Math.floor(Math.random() * 40) : Math.floor(Math.random() * 5)
                }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch threats
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tResp, nResp] = await Promise.all([
                    fetch(`${config.gatewayUrl}/api/threats`),
                    fetch(`${config.gatewayUrl}/api/network-stats`),
                ]);
                setThreats(await tResp.json());
                setNetworkStats(await nResp.json());
            } catch (e) { console.error('SOC fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, [token]);

    const protocolData = networkStats?.protocols
        ? Object.entries(networkStats.protocols).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-red">
                    <p className="text-[10px] text-gray-400 tracking-wider">ACTIVE THREATS</p>
                    <div className="text-2xl font-bold text-cyber-red">{threats?.active_threats?.length ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-neon">
                    <p className="text-[10px] text-gray-400 tracking-wider">BLOCKED IPs</p>
                    <div className="text-2xl font-bold text-cyber-neon">{threats?.blocked_ips?.length ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-blue">
                    <p className="text-[10px] text-gray-400 tracking-wider">PACKETS INSPECTED</p>
                    <div className="text-2xl font-bold text-cyber-blue">{threats?.total_packets_inspected?.toLocaleString() ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-yellow">
                    <p className="text-[10px] text-gray-400 tracking-wider">ENCRYPTED</p>
                    <div className="text-2xl font-bold text-cyber-yellow">{networkStats?.encrypted_percentage ?? 99.2}%</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Network Traffic */}
                <GlassExpand title="NETWORK TRAFFIC">
                    <div className="glass-panel p-5 rounded lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Activity size={16} className="text-cyber-blue" /> NETWORK TRAFFIC (LIVE)
                            </h3>
                            <div className="flex gap-3 text-[10px]">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyber-blue rounded-full"></div> NORMAL</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyber-red rounded-full"></div> ANOMALY</span>
                            </div>
                        </div>
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trafficData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="time" hide />
                                    <YAxis stroke="#94a3b8" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #00d9f9', fontSize: 11 }} />
                                    <Line type="monotone" dataKey="traffic" stroke="#00d9f9" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="anomalies" stroke="#ff2a6d" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </GlassExpand>

                {/* Protocol Breakdown */}
                <GlassExpand title="PROTOCOL MIX">
                    <div className="glass-panel p-5 rounded">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={16} className="text-cyber-neon" /> PROTOCOL MIX
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={protocolData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}%`} labelLine={false} fontSize={10}>
                                        {protocolData.map((_: any, i: number) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </GlassExpand>
            </div>

            {/* Threat Table */}
            <GlassExpand title="THREAT INTELLIGENCE">
                <div className="glass-panel p-5 rounded">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Terminal size={16} className="text-cyber-red" /> THREAT INTELLIGENCE FEED
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-gray-400 border-b border-cyber-slate/30">
                                    <th className="text-left p-2">ID</th>
                                    <th className="text-left p-2">TYPE</th>
                                    <th className="text-left p-2">SEVERITY</th>
                                    <th className="text-left p-2">SOURCE</th>
                                    <th className="text-left p-2">TARGET</th>
                                    <th className="text-left p-2">ATTEMPTS</th>
                                    <th className="text-left p-2">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {threats?.active_threats?.map((t: any) => (
                                    <tr key={t.id} className="border-b border-cyber-slate/10 hover:bg-cyber-neon/5 transition-colors">
                                        <td className="p-2 text-white font-mono">{t.id}</td>
                                        <td className="p-2 text-gray-300">{t.type}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.severity === 'CRITICAL' ? 'bg-cyber-red/20 text-cyber-red' :
                                                t.severity === 'HIGH' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                                    'bg-cyber-blue/20 text-cyber-blue'
                                                }`}>{t.severity}</span>
                                        </td>
                                        <td className="p-2 text-gray-300 font-mono">{t.source_ip}</td>
                                        <td className="p-2 text-gray-300">{t.target}</td>
                                        <td className="p-2 text-white">{t.attempts.toLocaleString()}</td>
                                        <td className="p-2">
                                            <span className={`text-[10px] font-bold ${t.status === 'ACTIVE' ? 'text-cyber-red animate-pulse' :
                                                t.status === 'BLOCKED' ? 'text-cyber-neon' :
                                                    'text-cyber-yellow'
                                                }`}>{t.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </GlassExpand>

            {/* Terminal Log */}
            <GlassExpand title="SYSTEM TERMINAL">
                <div className="glass-panel p-4 rounded font-mono text-xs h-40 overflow-y-auto bg-black/80">
                    {trafficData.map((d, i) => (
                        <div key={d.time} className="mb-0.5">
                            <span className="text-gray-600 mr-2">[{new Date().toLocaleDateString()} {String(Math.floor(i / 60)).padStart(2, '0')}:{String(i % 60).padStart(2, '0')}]</span>
                            {d.anomalies > 20 ? (
                                <span className="text-cyber-red font-bold">⚠ CRITICAL ANOMALY :: SECTOR 7 :: SCORE {d.anomalies} :: ESCALATING</span>
                            ) : d.anomalies > 10 ? (
                                <span className="text-cyber-yellow">⚡ ELEVATED :: DPI FLAGGED PATTERN :: SCORE {d.anomalies}</span>
                            ) : (
                                <span className="text-cyber-blue">✓ NORMAL :: TRUST 98 :: PACKET VERIFIED :: ALLOW</span>
                            )}
                        </div>
                    ))}
                </div>
            </GlassExpand>
        </div>
    );
};
