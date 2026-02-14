import { useState, useEffect } from 'react';
import { Eye, Radar, Plane, Ship, Satellite, Crosshair, Camera, Radio } from 'lucide-react';

interface Props { token: string; }

export const SurveillanceRecon = ({ token }: Props) => {
    const [survData, setSurvData] = useState<any>(null);
    const [reconData, setReconData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sResp, rResp] = await Promise.all([
                    fetch('http://localhost:8020/api/surveillance'),
                    fetch('http://localhost:8020/api/reconnaissance'),
                ]);
                setSurvData(await sResp.json());
                setReconData(await rResp.json());
            } catch (e) { console.error('ISR fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const getReconIcon = (type: string) =>
        type === 'UAV' ? <Plane size={14} className="text-cyber-blue" /> :
            type === 'SATELLITE' ? <Satellite size={14} className="text-cyber-yellow" /> :
                type === 'GROUND' ? <Crosshair size={14} className="text-cyber-neon" /> :
                    <Radio size={14} className="text-cyber-red" />;

    return (
        <div className="space-y-6">
            {/* ISR Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-neon">
                    <p className="text-[10px] text-gray-400 tracking-wider">ACTIVE ZONES</p>
                    <div className="text-2xl font-bold text-cyber-neon">{survData?.stats?.active_zones ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-blue">
                    <p className="text-[10px] text-gray-400 tracking-wider">TOTAL SENSORS</p>
                    <div className="text-2xl font-bold text-cyber-blue">{survData?.stats?.total_sensors ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-yellow">
                    <p className="text-[10px] text-gray-400 tracking-wider">RECON MISSIONS</p>
                    <div className="text-2xl font-bold text-cyber-yellow">{reconData?.stats?.active_missions ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-red">
                    <p className="text-[10px] text-gray-400 tracking-wider">TARGETS IDENTIFIED</p>
                    <div className="text-2xl font-bold text-cyber-red">{reconData?.stats?.total_targets ?? '—'}</div>
                </div>
            </div>

            {/* Surveillance Zones */}
            <div className="glass-panel p-5 rounded">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Eye size={16} className="text-cyber-neon" /> SURVEILLANCE ZONES
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {survData?.zones?.map((zone: any) => (
                        <div key={zone.id} className="border border-cyber-slate/30 bg-black/40 p-4 rounded hover:border-cyber-neon/30 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Radar size={14} className={zone.status === 'ACTIVE' ? 'text-cyber-neon' : 'text-cyber-red'} />
                                        <span className="text-xs font-bold text-white">{zone.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono ml-6">{zone.id} • {zone.type}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${zone.status === 'ACTIVE' ? 'bg-cyber-neon/20 text-cyber-neon' : 'bg-cyber-red/20 text-cyber-red'
                                    }`}>{zone.status}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 mb-2">
                                <span>Sensors: {zone.sensors}</span>
                                <span>Radius: {zone.radius_km}km</span>
                                <span className={zone.alerts > 3 ? 'text-cyber-red font-bold' : ''}>Alerts: {zone.alerts}</span>
                            </div>

                            {/* Coverage Bar */}
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                <span>COVERAGE</span>
                                <span className={zone.coverage > 90 ? 'text-cyber-neon' : zone.coverage > 70 ? 'text-cyber-yellow' : 'text-cyber-red'}>
                                    {zone.coverage}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
                                <div className={`h-full transition-all rounded ${zone.coverage > 90 ? 'bg-cyber-neon' : zone.coverage > 70 ? 'bg-cyber-yellow' : 'bg-cyber-red'
                                    }`} style={{ width: `${zone.coverage}%` }}></div>
                            </div>

                            <div className="text-[10px] text-gray-600 mt-2 font-mono">
                                {zone.lat?.toFixed(2)}°N, {zone.lng?.toFixed(2)}°E
                            </div>
                        </div>
                    ))}
                </div>
                {/* Sensor Types */}
                <div className="mt-4 flex gap-2 flex-wrap">
                    {survData?.sensor_types?.map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-1 rounded bg-cyber-slate/20 text-gray-400 border border-cyber-slate/10">{s}</span>
                    ))}
                </div>
            </div>

            {/* Reconnaissance Missions */}
            <div className="glass-panel p-5 rounded">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Crosshair size={16} className="text-cyber-yellow" /> RECONNAISSANCE ASSETS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reconData?.missions?.map((r: any) => (
                        <div key={r.id} className="border border-cyber-slate/30 bg-black/40 p-4 rounded hover:border-cyber-yellow/30 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    {getReconIcon(r.type)}
                                    <div>
                                        <span className="text-xs font-bold text-white">{r.asset}</span>
                                        <div className="text-[10px] text-gray-500">{r.id} • {r.type}</div>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${r.status === 'IN FLIGHT' || r.status === 'OVERHEAD PASS' ? 'bg-cyber-blue/20 text-cyber-blue animate-pulse' :
                                        r.status === 'DEPLOYED' || r.status === 'ACTIVE' ? 'bg-cyber-neon/20 text-cyber-neon' :
                                            'bg-gray-600/20 text-gray-400'
                                    }`}>{r.status}</span>
                            </div>

                            <div className="text-[10px] text-gray-400 mb-2">Area: {r.area}</div>

                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="flex justify-between text-gray-500">
                                    <span>ALT</span><span className="text-white">{r.altitude_ft?.toLocaleString()} ft</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>SPD</span><span className="text-white">{r.speed_kts?.toLocaleString()} kts</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span><Camera size={9} className="inline" /> IMAGERY</span><span className="text-cyber-blue">{r.imagery_collected?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span><Crosshair size={9} className="inline" /> TARGETS</span><span className="text-cyber-red">{r.targets_identified}</span>
                                </div>
                            </div>

                            {/* Fuel Bar */}
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                    <span>FUEL</span><span>{r.fuel_pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden">
                                    <div className={`h-full rounded transition-all ${r.fuel_pct > 50 ? 'bg-cyber-neon' : r.fuel_pct > 20 ? 'bg-cyber-yellow' : 'bg-cyber-red'
                                        }`} style={{ width: `${r.fuel_pct}%` }}></div>
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1">Mission Time: {r.mission_time}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
