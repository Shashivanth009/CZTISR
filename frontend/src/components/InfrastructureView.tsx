import { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, Shield, Lock, RefreshCw } from 'lucide-react';

interface Props { token: string; }

export const InfrastructureView = ({ token }: Props) => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await fetch('http://localhost:8020/api/infrastructure');
                setData(await resp.json());
            } catch (e) { console.error('Infra fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token]);

    return (
        <div className="space-y-6">
            {/* Encryption & Certificate Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={16} className="text-cyber-neon" />
                        <h4 className="text-xs font-bold text-white tracking-wider">ENCRYPTION</h4>
                    </div>
                    <div className="text-lg font-bold text-cyber-neon">{data?.encryption?.algorithm}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Key Rotation: {data?.encryption?.key_rotation_days} days</div>
                    <div className="text-[10px] text-gray-500">Last: {data?.encryption?.last_rotation}</div>
                    <div className={`mt-2 text-[10px] px-2 py-0.5 rounded inline-block ${data?.encryption?.status === 'COMPLIANT' ? 'bg-cyber-neon/20 text-cyber-neon' : 'bg-cyber-red/20 text-cyber-red'
                        }`}>{data?.encryption?.status}</div>
                </div>
                <div className="glass-panel p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-cyber-blue" />
                        <h4 className="text-xs font-bold text-white tracking-wider">CERTIFICATES</h4>
                    </div>
                    <div className="text-lg font-bold text-cyber-blue">{data?.certificates?.valid}/{data?.certificates?.total}</div>
                    <div className="text-[10px] text-gray-500 mt-1">CA: {data?.certificates?.ca}</div>
                    <div className="text-[10px] text-cyber-yellow mt-1">{data?.certificates?.expiring_soon} expiring soon</div>
                </div>
                <div className="glass-panel p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <RefreshCw size={16} className="text-cyber-yellow" />
                        <h4 className="text-xs font-bold text-white tracking-wider">NETWORK DEFENSE</h4>
                    </div>
                    <div className="text-lg font-bold text-cyber-yellow">{data?.network?.firewall_rules?.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Firewall Rules Active</div>
                    <div className="text-[10px] text-gray-500">IDS Signatures: {data?.network?.ids_signatures?.toLocaleString()}</div>
                </div>
            </div>

            {/* Service Grid */}
            <div className="glass-panel p-5 rounded">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Server size={16} className="text-cyber-neon" /> ZERO TRUST SERVICE MESH
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data?.services?.map((svc: any) => (
                        <div key={svc.name} className="border border-cyber-slate/30 bg-black/50 p-4 rounded hover:border-cyber-neon/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${svc.status === 'HEALTHY' ? 'bg-cyber-neon animate-pulse' : 'bg-cyber-red'}`}></div>
                                        <span className="text-xs font-bold text-white">{svc.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 ml-4">{svc.layer}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">:{svc.port}</span>
                            </div>

                            {/* Resource Bars */}
                            <div className="space-y-2 mt-3">
                                <div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                        <span className="flex items-center gap-1"><Cpu size={9} /> CPU</span>
                                        <span>{svc.cpu}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden">
                                        <div className={`h-full rounded transition-all duration-1000 ${svc.cpu > 60 ? 'bg-cyber-red' : svc.cpu > 40 ? 'bg-cyber-yellow' : 'bg-cyber-neon'
                                            }`} style={{ width: `${svc.cpu}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                        <span className="flex items-center gap-1"><HardDrive size={9} /> MEM</span>
                                        <span>{svc.memory}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden">
                                        <div className={`h-full rounded transition-all duration-1000 ${svc.memory > 70 ? 'bg-cyber-red' : svc.memory > 50 ? 'bg-cyber-yellow' : 'bg-cyber-blue'
                                            }`} style={{ width: `${svc.memory}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-3 text-[10px] text-gray-500">
                                <span>Protocol: {svc.protocol}</span>
                                <span>Uptime: {svc.uptime}%</span>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1">Requests/hr: {svc.requests_1h?.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
