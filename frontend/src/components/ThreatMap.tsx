import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Shield, AlertTriangle, Target, Bug } from 'lucide-react';

interface Props { token: string; }

export const ThreatMap = ({ token }: Props) => {
    const [threats, setThreats] = useState<any>(null);
    const [vulnScan, setVulnScan] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tResp, vResp] = await Promise.all([
                    fetch('http://localhost:8020/api/threats'),
                    fetch('http://localhost:8020/api/vulnerability-scan'),
                ]);
                setThreats(await tResp.json());
                setVulnScan(await vResp.json());
            } catch (e) { console.error('ThreatMap fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [token]);

    const vulnData = vulnScan?.vulnerabilities
        ? Object.entries(vulnScan.vulnerabilities).map(([name, count]) => ({
            name: name.toUpperCase(),
            count,
            fill: name === 'critical' ? '#ff2a6d' : name === 'high' ? '#fcee0a' : name === 'medium' ? '#00d9f9' : '#00ff9d'
        }))
        : [];

    return (
        <div className="space-y-6">
            {/* Threat Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Threats Visual */}
                <div className="glass-panel p-5 rounded relative overflow-hidden min-h-[360px]">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Target size={16} className="text-cyber-red" /> THREAT LANDSCAPE
                    </h3>
                    {/* Radar background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border border-cyber-neon/10 rounded-full"></div>
                        <div className="absolute w-48 h-48 border border-cyber-neon/10 rounded-full"></div>
                        <div className="absolute w-32 h-32 border border-cyber-neon/10 rounded-full"></div>
                        <div className="absolute w-16 h-16 border border-cyber-neon/20 rounded-full"></div>
                        <div className="absolute w-64 h-[1px] bg-cyber-neon/10"></div>
                        <div className="absolute w-[1px] h-64 bg-cyber-neon/10"></div>
                        <div className="absolute w-64 h-64 border-r-2 border-cyber-neon/30 rounded-full animate-radar origin-center"></div>
                    </div>

                    {/* Threat Points */}
                    <div className="relative z-10 mt-8">
                        {threats?.active_threats?.map((t: any, i: number) => {
                            const positions = [
                                { top: '20%', left: '60%' }, { top: '40%', left: '25%' },
                                { top: '55%', left: '70%' }, { top: '70%', left: '40%' },
                                { top: '30%', left: '45%' }, { top: '60%', left: '55%' },
                            ];
                            const pos = positions[i % positions.length];
                            return (
                                <div key={t.id} className="absolute flex items-center gap-2" style={pos}>
                                    <div className={`w-3 h-3 rounded-full animate-pulse ${t.severity === 'CRITICAL' ? 'bg-cyber-red shadow-[0_0_10px_#ff2a6d]' :
                                            t.severity === 'HIGH' ? 'bg-cyber-yellow shadow-[0_0_10px_#fcee0a]' :
                                                'bg-cyber-blue shadow-[0_0_10px_#00d9f9]'
                                        }`}></div>
                                    <span className="text-[10px] text-gray-400">{t.id} ({t.type})</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Vulnerability Scan */}
                <div className="glass-panel p-5 rounded">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Bug size={16} className="text-cyber-yellow" /> VULNERABILITY ASSESSMENT
                    </h3>

                    {/* Compliance Score */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#00ff9d" strokeWidth="8"
                                    strokeDasharray={`${(vulnScan?.compliance_score ?? 0) * 3.14} 314`}
                                    strokeLinecap="round" />
                            </svg>
                            <div className="absolute text-center">
                                <div className="text-2xl font-bold text-cyber-neon">{vulnScan?.compliance_score ?? '—'}%</div>
                                <div className="text-[10px] text-gray-400">COMPLIANCE</div>
                            </div>
                        </div>
                    </div>

                    {/* Vuln Bar Chart */}
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vulnData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                                <YAxis stroke="#94a3b8" fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #00ff9d', fontSize: 11 }} />
                                <Bar dataKey="count" fill="#00d9f9" barSize={24}>
                                    {vulnData.map((entry: any, index: number) => (
                                        <Bar key={index} dataKey="count" fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Findings Table */}
            <div className="glass-panel p-5 rounded">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-cyber-yellow" /> SECURITY FINDINGS
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-gray-400 border-b border-cyber-slate/30">
                                <th className="text-left p-2">CVE/ID</th>
                                <th className="text-left p-2">SEVERITY</th>
                                <th className="text-left p-2">ASSET</th>
                                <th className="text-left p-2">DESCRIPTION</th>
                                <th className="text-left p-2">REMEDIATION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vulnScan?.findings?.map((f: any) => (
                                <tr key={f.id} className="border-b border-cyber-slate/10 hover:bg-cyber-neon/5 transition-colors">
                                    <td className="p-2 text-white font-mono">{f.id}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.severity === 'HIGH' ? 'bg-cyber-yellow/20 text-cyber-yellow' : 'bg-cyber-blue/20 text-cyber-blue'
                                            }`}>{f.severity}</span>
                                    </td>
                                    <td className="p-2 text-gray-300">{f.asset}</td>
                                    <td className="p-2 text-gray-300">{f.description}</td>
                                    <td className="p-2 text-cyber-neon">{f.remediation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
