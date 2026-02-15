import { useState, useEffect } from 'react';
import { Radio, Send, Lock, MessageSquare } from 'lucide-react';
import { GlassExpand } from './GlassExpand';
import { config } from '../config';

interface Props { token: string; user: any; }

export const Communications = ({ token, user }: Props) => {
    const [data, setData] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [msgContent, setMsgContent] = useState('');
    const [msgChannel, setMsgChannel] = useState('COMMAND NET');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cResp, mResp] = await Promise.all([
                    fetch(`${config.gatewayUrl}/api/communications`),
                    fetch(`${config.gatewayUrl}/api/communications/messages`),
                ]);
                setData(await cResp.json());
                setMessages(await mResp.json());
            } catch (e) { console.error('Comms fetch error', e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [token]);

    const sendMessage = async () => {
        if (!msgContent.trim()) return;
        try {
            await fetch(`${config.gatewayUrl}/api/communications/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user?.username || 'UNKNOWN',
                    to: 'ALL',
                    channel: msgChannel,
                    content: msgContent,
                    classification: 'CONFIDENTIAL',
                })
            });
            setMsgContent('');
        } catch (e) { console.error('Send error', e); }
    };

    const getTypeColor = (t: string) =>
        t === 'HF' ? 'text-cyber-red' : t === 'VHF' ? 'text-cyber-neon' :
            t === 'UHF' ? 'text-cyber-blue' : t === 'SATCOM' ? 'text-cyber-yellow' : 'text-white';

    return (
        <div className="space-y-6">
            {/* Comms Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-neon">
                    <p className="text-[10px] text-gray-400 tracking-wider">MESSAGES (24H)</p>
                    <div className="text-xl font-bold text-cyber-neon">{data?.stats?.messages_24h?.toLocaleString()}</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-blue">
                    <p className="text-[10px] text-gray-400 tracking-wider">ENCRYPTED</p>
                    <div className="text-xl font-bold text-cyber-blue">{data?.stats?.encrypted_pct}%</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-yellow">
                    <p className="text-[10px] text-gray-400 tracking-wider">AVG LATENCY</p>
                    <div className="text-xl font-bold text-cyber-yellow">{data?.stats?.avg_latency_ms} ms</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-white">
                    <p className="text-[10px] text-gray-400 tracking-wider">BANDWIDTH</p>
                    <div className="text-xl font-bold text-white">{data?.stats?.bandwidth_utilization}%</div>
                </div>
                <div className="glass-panel p-4 rounded border-l-4 border-cyber-red">
                    <p className="text-[10px] text-gray-400 tracking-wider">FAILED TX</p>
                    <div className="text-xl font-bold text-cyber-red">{data?.stats?.failed_transmissions}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Channel Table */}
                <GlassExpand title="COMM CHANNELS">
                    <div className="glass-panel p-5 rounded lg:col-span-2">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Radio size={16} className="text-cyber-neon" /> ACTIVE COMM CHANNELS
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-gray-400 border-b border-cyber-slate/30">
                                        <th className="text-left p-2">CHANNEL</th>
                                        <th className="text-left p-2">TYPE</th>
                                        <th className="text-left p-2">FREQ</th>
                                        <th className="text-left p-2">CRYPTO</th>
                                        <th className="text-left p-2">USERS</th>
                                        <th className="text-left p-2">CLASS</th>
                                        <th className="text-left p-2">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.channels?.map((ch: any) => (
                                        <tr key={ch.id} className="border-b border-cyber-slate/10 hover:bg-cyber-neon/5 transition-colors">
                                            <td className="p-2 text-white font-bold">{ch.name}</td>
                                            <td className={`p-2 font-mono ${getTypeColor(ch.type)}`}>{ch.type}</td>
                                            <td className="p-2 text-gray-300 font-mono">{ch.frequency}</td>
                                            <td className="p-2 flex items-center gap-1 text-gray-300"><Lock size={10} className="text-cyber-neon" />{ch.encryption}</td>
                                            <td className="p-2 text-white">{ch.participants}</td>
                                            <td className="p-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded ${ch.classification === 'TOP_SECRET' ? 'bg-cyber-red/20 text-cyber-red' :
                                                    ch.classification === 'SECRET' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                                        ch.classification === 'CONFIDENTIAL' ? 'bg-cyber-blue/20 text-cyber-blue' :
                                                            'bg-gray-600/20 text-gray-400'
                                                    }`}>{ch.classification}</span>
                                            </td>
                                            <td className="p-2">
                                                <span className={`text-[10px] ${ch.status === 'ACTIVE' ? 'text-cyber-neon' : 'text-gray-500'}`}>
                                                    {ch.status === 'ACTIVE' && '● '}{ch.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Protocols */}
                        <div className="mt-4 flex gap-2 flex-wrap">
                            {data?.protocols?.map((p: string) => (
                                <span key={p} className="text-[10px] px-2 py-1 rounded bg-cyber-slate/30 text-gray-400 border border-cyber-slate/20">{p}</span>
                            ))}
                        </div>
                    </div>
                </GlassExpand>

                {/* Secure Messaging */}
                <GlassExpand title="SECURE COMMS">
                    <div className="glass-panel p-5 rounded flex flex-col">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <MessageSquare size={16} className="text-cyber-blue" /> SECURE COMMS
                        </h3>

                        {/* Messages */}
                        <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto mb-4 custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 text-xs py-8">No messages yet. Send one below.</div>
                            ) : messages.map((m: any) => (
                                <div key={m.id} className="p-2 border-b border-cyber-slate/10">
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span className="text-cyber-neon font-bold">{m.from}</span>
                                        <span>{m.timestamp?.slice(11, 19)}</span>
                                    </div>
                                    <div className="text-xs text-gray-300 mt-1">{m.content}</div>
                                    <div className="flex gap-2 mt-1 text-[10px]">
                                        <span className="text-gray-600">{m.channel}</span>
                                        {m.encrypted && <span className="text-cyber-neon">🔒 E2E</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Send */}
                        <div className="border-t border-cyber-slate/30 pt-3">
                            <select value={msgChannel} onChange={(e) => setMsgChannel(e.target.value)}
                                className="w-full mb-2 bg-black/60 border border-cyber-slate text-gray-300 px-3 py-1.5 rounded text-xs focus:border-cyber-neon focus:outline-none">
                                <option>COMMAND NET</option>
                                <option>TACTICAL NET</option>
                                <option>INTEL NET</option>
                            </select>
                            <div className="flex gap-2">
                                <input
                                    type="text" value={msgContent} onChange={(e) => setMsgContent(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    className="flex-1 bg-black/60 border border-cyber-slate text-white px-3 py-2 rounded text-xs font-mono focus:border-cyber-neon focus:outline-none"
                                    placeholder="Type secure message..."
                                />
                                <button onClick={sendMessage}
                                    className="px-3 py-2 bg-cyber-neon/10 border border-cyber-neon text-cyber-neon rounded hover:bg-cyber-neon/20 transition-all">
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </GlassExpand>
            </div>
        </div>
    );
};
