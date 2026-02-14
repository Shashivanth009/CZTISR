import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Database, Plane, Ship, Truck, Wifi, WifiOff } from 'lucide-react';

interface Props { token: string; }

export const CommanderDashboard = ({ token }: Props) => {
    const [assets, setAssets] = useState<Record<string, any>>({});
    const [stats, setStats] = useState<any>(null);
    const [connected, setConnected] = useState(false);

    // Fetch system status
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const resp = await fetch('http://localhost:8020/api/system-status');
                const data = await resp.json();
                setStats(data);
            } catch (e) { console.error('Stats fetch error', e); }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [token]);

    // WebSocket for live telemetry
    useEffect(() => {
        let socket: WebSocket;
        let reconnectTimer: ReturnType<typeof setTimeout>;

        const connect = () => {
            socket = new WebSocket('ws://localhost:8020/ws/telemetry');
            socket.onopen = () => setConnected(true);
            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type && msg.data) {
                        setAssets(prev => ({ ...prev, [msg.data.id]: msg.data }));
                    }
                } catch (e) { /* ignore parse errors */ }
            };
            socket.onclose = () => {
                setConnected(false);
                reconnectTimer = setTimeout(connect, 3000);
            };
        };

        connect();
        return () => {
            clearTimeout(reconnectTimer);
            socket?.close();
        };
    }, []);

    const getAssetIcon = (id: string) => {
        if (id.includes('AIR')) return <Plane size={14} className="text-cyber-blue" />;
        if (id.includes('NAVAL')) return <Ship size={14} className="text-cyber-neon" />;
        return <Truck size={14} className="text-cyber-yellow" />;
    };

    const getStatusColor = (s: string) => s === 'OPERATIONAL' ? 'text-cyber-neon' : s === 'ENGAGED' ? 'text-cyber-red' : 'text-cyber-yellow';

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-xs">
                {connected
                    ? <><Wifi size={12} className="text-cyber-neon" /><span className="text-cyber-neon">TELEMETRY UPLINK ACTIVE</span></>
                    : <><WifiOff size={12} className="text-cyber-red animate-pulse" /><span className="text-cyber-red">RECONNECTING...</span></>
                }
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="DEFCON LEVEL" value={stats?.defcon_level ?? '—'} sub={stats?.defcon_name ?? ''} icon={<Shield size={20} />} color="neon" />
                <StatCard label="ACTIVE MISSIONS" value={stats?.active_missions ?? '—'} sub={`+${stats?.pending_missions ?? 0} PENDING`} icon={<Database size={20} />} color="yellow" />
                <StatCard label="LIVE ASSETS" value={Object.keys(assets).length} sub="TRACKING ACTIVE" icon={<Plane size={20} />} color="blue" />
                <StatCard label="THREATS" value={stats?.threats_detected ?? '—'} sub={`${stats?.critical_threats ?? 0} CRITICAL`} icon={<AlertTriangle size={20} />} color="red" />
            </div>

            {/* Battlespace + Intel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-5 rounded lg:col-span-2 min-h-[360px] relative overflow-hidden">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Database size={16} className="text-cyber-neon" /> LIVE BATTLESPACE
                    </h3>
                    <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
                        {Object.values(assets).map((a: any) => (
                            <div key={a.id} className="border border-cyber-slate/50 bg-black/70 p-3 rounded hover:border-cyber-neon/50 transition-all">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 flex items-center gap-1">{getAssetIcon(a.id)} {a.id}</span>
                                    <span className={getStatusColor(a.status)}>{a.status}</span>
                                </div>
                                <div className="text-xs font-mono text-white mt-1">{a.lat?.toFixed(4)}, {a.lng?.toFixed(4)}</div>
                                <div className="w-full h-1 bg-gray-800 mt-2 rounded overflow-hidden">
                                    <div className="h-full bg-cyber-blue transition-all duration-1000" style={{ width: `${a.fuel}%` }}></div>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">FUEL: {a.fuel?.toFixed(0)}%</div>
                            </div>
                        ))}
                        {Object.keys(assets).length === 0 && (
                            <div className="col-span-3 text-center text-gray-500 animate-pulse py-16">
                                ESTABLISHING SATELLITE UPLINK...
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-5 rounded">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-cyber-red" /> SIGNAL INTEL
                    </h3>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.values(assets).slice(0, 10).map((a: any, i: number) => (
                            <div key={`${a.id}-${i}`} className="p-2 border-b border-cyber-slate/20 text-xs font-mono">
                                <div className="flex justify-between text-gray-500">
                                    <span>TS::{new Date().toLocaleTimeString()}</span>
                                    <span className="text-cyber-blue">UPDATED</span>
                                </div>
                                <div className="text-gray-300 mt-1">
                                    <span className="text-white">{a.id}</span> :: <span className={getStatusColor(a.status)}>{a.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable Stat Card
const StatCard = ({ label, value, sub, icon, color }: any) => (
    <div className={`glass-panel p-4 rounded border-l-4 border-cyber-${color}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[10px] text-gray-400 mb-1 tracking-wider">{label}</p>
                <div className="text-2xl font-bold text-white">{value}</div>
            </div>
            <div className={`text-cyber-${color}`}>{icon}</div>
        </div>
        <p className={`text-[10px] text-cyber-${color} mt-2`}>{sub}</p>
    </div>
);
