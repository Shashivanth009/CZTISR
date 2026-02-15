import { useState, useEffect } from 'react';
import { FileSearch, Eye, Radio, Globe, Satellite, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { GlassExpand } from './GlassExpand';
import { config } from '../config';

interface Props { token: string; }

const SOURCE_ICONS: Record<string, any> = {
    SIGINT: Radio, HUMINT: Eye, IMINT: Satellite, OSINT: Globe, ELINT: Radio,
};

export const Intelligence = ({ token }: Props) => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await fetch(`${config.gatewayUrl}/api/intelligence`);
                setData(await resp.json());
            } catch (e) { console.error('Intel fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, [token]);

    const getClassColor = (c: string) =>
        c === 'TOP_SECRET' ? 'bg-cyber-red/20 text-cyber-red' :
            c === 'SECRET' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                'bg-cyber-blue/20 text-cyber-blue';

    const getStatusIcon = (s: string) =>
        s === 'VERIFIED' ? <CheckCircle size={12} className="text-cyber-neon" /> :
            s.includes('PENDING') ? <Clock size={12} className="text-cyber-yellow" /> :
                <AlertTriangle size={12} className="text-cyber-blue" />;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-neon">
                    <p className="text-[10px] text-gray-400 tracking-wider">TOTAL REPORTS</p>
                    <div className="text-2xl font-bold text-cyber-neon">{data?.stats?.total_reports ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-blue">
                    <p className="text-[10px] text-gray-400 tracking-wider">VERIFIED</p>
                    <div className="text-2xl font-bold text-cyber-blue">{data?.stats?.verified ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-yellow">
                    <p className="text-[10px] text-gray-400 tracking-wider">PENDING</p>
                    <div className="text-2xl font-bold text-cyber-yellow">{data?.stats?.pending ?? '—'}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-white">
                    <p className="text-[10px] text-gray-400 tracking-wider">AVG CONFIDENCE</p>
                    <div className="text-2xl font-bold text-white">{data?.stats?.avg_confidence ?? '—'}%</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-red">
                    <p className="text-[10px] text-gray-400 tracking-wider">SOURCES</p>
                    <div className="text-2xl font-bold text-cyber-red">{data?.stats?.sources ? Object.keys(data.stats.sources).length : '—'}</div>
                </div>
            </div>

            {/* Source Badges */}
            <div className="flex gap-3 flex-wrap">
                {data?.stats?.sources && Object.entries(data.stats.sources).map(([source, count]: any) => {
                    const Icon = SOURCE_ICONS[source] || FileSearch;
                    return (
                        <div key={source} className="glass-panel px-4 py-2 rounded flex items-center gap-2">
                            <Icon size={14} className="text-cyber-neon" />
                            <span className="text-xs text-white">{source}</span>
                            <span className="text-[10px] text-gray-500">({count})</span>
                        </div>
                    );
                })}
            </div>

            {/* Intel Reports */}
            <div className="space-y-3">
                {data?.reports?.map((report: any) => {
                    const Icon = SOURCE_ICONS[report.source] || FileSearch;
                    return (
                        <GlassExpand key={report.id} title={report.title}>
                            <div className="glass-panel p-5 rounded hover:border-cyber-neon/30 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 border border-cyber-slate/50 rounded flex items-center justify-center bg-black/40">
                                            <Icon size={18} className="text-cyber-neon" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">{report.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-500 font-mono">{report.id}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded ${getClassColor(report.classification)}`}>{report.classification}</span>
                                                <span className="text-[10px] text-gray-500">{report.source}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(report.status)}
                                        <span className="text-[10px] text-gray-400">{report.status}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 mt-3 mb-3 pl-[52px]">{report.summary}</p>

                                <div className="flex justify-between items-center pl-[52px]">
                                    <div className="flex gap-4 text-[10px] text-gray-500">
                                        <span>Analyst: {report.analyst}</span>
                                        <span>{report.timestamp?.slice(11, 16)}</span>
                                    </div>
                                    {/* Confidence Bar */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500">CONFIDENCE</span>
                                        <div className="w-20 h-2 bg-gray-800 rounded overflow-hidden">
                                            <div className={`h-full rounded transition-all ${report.confidence > 80 ? 'bg-cyber-neon' :
                                                report.confidence > 60 ? 'bg-cyber-yellow' : 'bg-cyber-red'
                                                }`} style={{ width: `${report.confidence}%` }}></div>
                                        </div>
                                        <span className="text-[10px] text-white">{report.confidence}%</span>
                                    </div>
                                </div>
                            </div>
                        </GlassExpand>
                    );
                })}
            </div>
        </div>
    );
};
