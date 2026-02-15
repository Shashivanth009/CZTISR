import { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle, XCircle, Layers } from 'lucide-react';
import { GlassExpand } from './GlassExpand';
import { config } from '../config';

interface Props { token: string; }

export const PolicyEngine = ({ token }: Props) => {
    const [policyData, setPolicyData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await fetch(`${config.gatewayUrl}/api/policy-decisions`);
                setPolicyData(await resp.json());
            } catch (e) { console.error('Policy fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token]);

    return (
        <div className="space-y-6">
            {/* Clearance Hierarchy */}
            <GlassExpand title="CLEARANCE HIERARCHY">
                <div className="glass-panel p-5 rounded">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Layers size={16} className="text-cyber-neon" /> BELL-LAPADULA MODEL — CLEARANCE HIERARCHY
                    </h3>
                    <div className="flex items-end justify-center gap-4 h-48">
                        {policyData?.clearance_hierarchy?.map((level: any) => (
                            <div key={level.level} className="flex flex-col items-center gap-2">
                                <div
                                    className="w-24 rounded-t border transition-all hover:opacity-80"
                                    style={{
                                        height: `${(level.value + 1) * 40}px`,
                                        backgroundColor: `${level.color}20`,
                                        borderColor: level.color,
                                    }}
                                >
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Lock size={16} style={{ color: level.color }} />
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 tracking-wider">{level.level}</span>
                                <span className="text-xs font-bold" style={{ color: level.color }}>L{level.value}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-[10px] text-gray-500 mt-4">NO READ UP — SUBJECT CLEARANCE ≥ RESOURCE CLASSIFICATION</p>
                </div>
            </GlassExpand>

            {/* Policy Rules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Policies */}
                <GlassExpand title="ACTIVE POLICIES">
                    <div className="glass-panel p-5 rounded">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={16} className="text-cyber-blue" /> ACTIVE POLICY RULES
                        </h3>
                        <div className="space-y-3">
                            {policyData?.policy_rules?.map((rule: any) => (
                                <div key={rule.name} className="border border-cyber-slate/30 bg-black/40 p-3 rounded hover:border-cyber-neon/30 transition-all">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white">{rule.name}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${rule.status === 'ACTIVE'
                                            ? 'bg-cyber-neon/20 text-cyber-neon'
                                            : 'bg-cyber-yellow/20 text-cyber-yellow'
                                            }`}>{rule.status}</span>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                                        <span>EVALUATIONS: {rule.evaluations.toLocaleString()}</span>
                                        <span className="text-cyber-red">DENIALS: {rule.denials}</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-800 mt-2 rounded overflow-hidden">
                                        <div className="h-full bg-cyber-neon transition-all" style={{
                                            width: `${Math.max(2, 100 - (rule.denials / rule.evaluations * 100))}%`
                                        }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassExpand>

                {/* Decision Summary */}
                <GlassExpand title="DECISION ENGINE">
                    <div className="glass-panel p-5 rounded">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <CheckCircle size={16} className="text-cyber-neon" /> DECISION ENGINE
                        </h3>

                        {/* Big Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center p-4 border border-cyber-neon/30 rounded bg-cyber-neon/5">
                                <div className="text-3xl font-bold text-cyber-neon">{policyData?.permits ?? 0}</div>
                                <div className="text-[10px] text-gray-400 tracking-wider mt-1">PERMITS</div>
                            </div>
                            <div className="text-center p-4 border border-cyber-red/30 rounded bg-cyber-red/5">
                                <div className="text-3xl font-bold text-cyber-red">{policyData?.denies ?? 0}</div>
                                <div className="text-[10px] text-gray-400 tracking-wider mt-1">DENIALS</div>
                            </div>
                        </div>

                        {/* Recent Decisions */}
                        <h4 className="text-xs text-gray-400 mb-2 tracking-wider">RECENT DECISIONS</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {policyData?.recent_decisions?.map((d: any) => (
                                <div key={d.id} className="flex items-center gap-2 p-2 text-xs border-b border-cyber-slate/10">
                                    {d.decision === 'PERMIT'
                                        ? <CheckCircle size={12} className="text-cyber-neon flex-shrink-0" />
                                        : <XCircle size={12} className="text-cyber-red flex-shrink-0" />}
                                    <span className="text-gray-400 font-mono text-[10px] flex-shrink-0">{d.timestamp?.slice(11, 19)}</span>
                                    <span className="text-white">{d.actor}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-gray-300 truncate">{d.details}</span>
                                </div>
                            ))}
                            {(!policyData?.recent_decisions || policyData.recent_decisions.length === 0) && (
                                <div className="text-center text-gray-500 py-4">No decisions yet. Interact with the system.</div>
                            )}
                        </div>
                    </div>
                </GlassExpand>
            </div>
        </div>
    );
};
