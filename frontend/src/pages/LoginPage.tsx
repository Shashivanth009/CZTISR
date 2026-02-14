import { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, Fingerprint, Key, Smartphone } from 'lucide-react';

interface LoginPageProps {
    onLogin: (token: string, user: any) => void;
}

type AuthStep = 'CREDENTIALS' | 'MFA' | 'TRUST_EVAL' | 'COMPLETE';

export const LoginPage = ({ onLogin }: LoginPageProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<AuthStep>('CREDENTIALS');

    // Data from Step 1
    const [sessionToken, setSessionToken] = useState('');
    const [deviceTrust, setDeviceTrust] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [countdown, setCountdown] = useState(120);

    // Countdown timer for MFA session expiry
    useEffect(() => {
        if (step !== 'MFA') return;
        if (countdown <= 0) {
            setError('MFA session expired. Start over.');
            resetToStep1();
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [step, countdown]);

    const resetToStep1 = () => {
        setStep('CREDENTIALS');
        setMfaCode('');
        setSessionToken('');
        setDeviceTrust(null);
        setUserInfo(null);
        setCountdown(120);
    };

    // STEP 1: Submit credentials
    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const resp = await fetch('http://localhost:8001/auth/step1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.detail || 'Authentication failed');
            }

            const data = await resp.json();
            setSessionToken(data.session_token);
            setDeviceTrust(data.device_trust);
            setUserInfo({ username: data.username, full_name: data.full_name, role: data.role, clearance: data.clearance });
            setCountdown(data.expires_in || 120);

            // Show trust evaluation briefly, then move to MFA
            setStep('TRUST_EVAL');
            setTimeout(() => setStep('MFA'), 2500);

        } catch (err: any) {
            setError(err.message || 'AUTHENTICATION FAILED');
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Submit TOTP code
    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const resp = await fetch('http://localhost:8001/auth/step2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    mfa_code: mfaCode,
                    session_token: sessionToken,
                }),
            });

            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.detail || 'MFA verification failed');
            }

            const data = await resp.json();
            setStep('COMPLETE');

            // Use user data directly from Step 2 response
            setTimeout(() => {
                onLogin(data.access_token, data.user);
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'MFA VERIFICATION FAILED');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 'CREDENTIALS', label: 'CREDENTIALS', icon: Key },
        { id: 'TRUST_EVAL', label: 'DEVICE TRUST', icon: Fingerprint },
        { id: 'MFA', label: 'MFA VERIFY', icon: Shield },
        { id: 'COMPLETE', label: 'AUTHORIZED', icon: CheckCircle },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
        <div className="h-screen w-screen bg-cyber-dark bg-grid flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-neon/5 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-blue/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyber-neon/10 rounded-full animate-radar"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyber-blue/10 rounded-full animate-radar" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* Login Card */}
            <div className="glass-panel p-8 rounded-lg w-[460px] relative z-10 border-glow">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-3">
                        <div className="w-14 h-14 border-2 border-cyber-neon rounded-full flex items-center justify-center bg-cyber-neon/10 animate-pulse">
                            <Shield size={28} className="text-cyber-neon" />
                        </div>
                    </div>
                    <h1 className="text-xl font-bold tracking-[0.3em] text-white text-glow">C5ISR</h1>
                    <h2 className="text-xs tracking-[0.5em] text-cyber-neon mt-1">ZERO TRUST AUTHENTICATION</h2>
                </div>

                {/* Step Progress Bar */}
                <div className="flex items-center justify-between mb-6 px-2">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${i < currentStepIndex ? 'bg-cyber-neon/20 border-cyber-neon text-cyber-neon' :
                                    i === currentStepIndex ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue animate-pulse' :
                                        'border-gray-700 text-gray-700'
                                    }`}>
                                    {i < currentStepIndex ? <CheckCircle size={14} /> : <s.icon size={14} />}
                                </div>
                                <span className={`text-[8px] mt-1 tracking-wider ${i <= currentStepIndex ? 'text-gray-400' : 'text-gray-700'
                                    }`}>{s.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-8 h-[1px] mx-1 mb-4 transition-all duration-500 ${i < currentStepIndex ? 'bg-cyber-neon' : 'bg-gray-800'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 border border-cyber-red/50 bg-cyber-red/10 rounded flex items-center gap-2 text-cyber-red text-xs">
                        <AlertTriangle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                {/* STEP 1: CREDENTIALS */}
                {step === 'CREDENTIALS' && (
                    <form onSubmit={handleStep1} className="space-y-4">
                        <div className="text-[10px] text-gray-400 tracking-wider text-center mb-2">
                            STEP 1 OF 3 — IDENTITY VERIFICATION
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block tracking-wider">OPERATOR ID</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/60 border border-cyber-slate text-white px-4 py-3 rounded font-mono text-sm focus:border-cyber-neon focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,157,0.3)] transition-all"
                                placeholder="Enter callsign..." required />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block tracking-wider">PASSPHRASE</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/60 border border-cyber-slate text-white px-4 py-3 rounded font-mono text-sm focus:border-cyber-neon focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,157,0.3)] transition-all"
                                placeholder="••••••••" required />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-cyber-neon/10 border border-cyber-neon text-cyber-neon rounded font-bold tracking-widest hover:bg-cyber-neon/20 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2"><Lock size={14} className="animate-spin" /> VERIFYING...</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2"><Key size={14} /> VERIFY IDENTITY</span>
                            )}
                        </button>
                        <div className="text-center text-[10px] text-gray-600 mt-2">
                            Credentials: commander / analyst / redteam — password: <span className="text-gray-500">password</span>
                        </div>
                    </form>
                )}

                {/* STEP 1.5: DEVICE TRUST EVALUATION */}
                {step === 'TRUST_EVAL' && deviceTrust && (
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-400 tracking-wider text-center mb-2">
                            STEP 2 OF 3 — DEVICE TRUST EVALUATION
                        </div>
                        <div className="text-center mb-4">
                            <Fingerprint size={32} className="text-cyber-blue animate-pulse mx-auto mb-2" />
                            <div className="text-xs text-gray-400">Evaluating device trust context...</div>
                        </div>

                        {/* Trust Score */}
                        <div className="text-center">
                            <div className={`text-3xl font-bold ${deviceTrust.score >= 70 ? 'text-cyber-neon' :
                                deviceTrust.score >= 40 ? 'text-cyber-yellow' : 'text-cyber-red'
                                }`}>{deviceTrust.score}/100</div>
                            <div className={`text-xs ${deviceTrust.risk_level === 'LOW' ? 'text-cyber-neon' :
                                deviceTrust.risk_level === 'MEDIUM' ? 'text-cyber-yellow' : 'text-cyber-red'
                                }`}>Risk: {deviceTrust.risk_level}</div>
                        </div>

                        {/* Factors */}
                        <div className="space-y-1">
                            {deviceTrust.factors?.map((f: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-[10px] px-3 py-1.5 rounded bg-black/30 border border-cyber-slate/20">
                                    <span className="text-gray-400 flex items-center gap-1">
                                        {f.status === 'PASS' ? <CheckCircle size={10} className="text-cyber-neon" /> :
                                            f.status === 'WARN' ? <AlertTriangle size={10} className="text-cyber-yellow" /> :
                                                <Fingerprint size={10} className="text-gray-500" />}
                                        {f.factor}
                                    </span>
                                    <span className={f.status === 'PASS' ? 'text-cyber-neon' : f.status === 'WARN' ? 'text-cyber-yellow' : 'text-gray-500'}>
                                        {f.impact}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: MFA — TOTP AUTHENTICATOR */}
                {step === 'MFA' && (
                    <form onSubmit={handleStep2} className="space-y-4">
                        <div className="text-[10px] text-gray-400 tracking-wider text-center mb-2">
                            STEP 3 OF 3 — MULTI-FACTOR AUTHENTICATION
                        </div>

                        {/* User identity confirmed */}
                        <div className="p-3 rounded bg-cyber-neon/5 border border-cyber-neon/20 flex items-center gap-3">
                            <CheckCircle size={16} className="text-cyber-neon" />
                            <div>
                                <div className="text-xs text-white">{userInfo?.full_name}</div>
                                <div className="text-[10px] text-gray-500">{userInfo?.role} • {userInfo?.clearance}</div>
                            </div>
                            {deviceTrust && (
                                <div className="ml-auto text-right">
                                    <div className="text-[10px] text-gray-500">Trust</div>
                                    <div className={`text-xs font-bold ${deviceTrust.score >= 70 ? 'text-cyber-neon' : 'text-cyber-yellow'}`}>
                                        {deviceTrust.score}%
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Authenticator App Info */}
                        <div className="p-3 rounded bg-cyber-blue/5 border border-cyber-blue/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Smartphone size={12} className="text-cyber-blue" />
                                <span className="text-[10px] text-cyber-blue tracking-wider font-bold">TOTP AUTHENTICATOR VERIFICATION</span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                                Open your <span className="text-white">Authenticator App</span> and enter the 6-digit code for <span className="text-cyber-neon">C5ISR Zero Trust ({userInfo?.username})</span>.
                            </div>
                            <div className="mt-2 text-[9px] text-gray-600 italic">
                                Code rotates every 30 seconds • RFC 6238 compliant
                            </div>
                        </div>

                        {/* Countdown */}
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 flex items-center gap-1"><Lock size={10} /> RFC 6238 TOTP</span>
                            <span className={countdown <= 30 ? 'text-cyber-red animate-pulse' : 'text-gray-500'}>
                                Session: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                            </span>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block tracking-wider">ENTER TOTP CODE</label>
                            <input type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)}
                                className="w-full bg-black/60 border border-cyber-slate text-white px-4 py-3 rounded font-mono text-center text-xl tracking-[0.5em] focus:border-cyber-blue focus:outline-none focus:shadow-[0_0_10px_rgba(0,217,249,0.3)] transition-all"
                                placeholder="000000" maxLength={6} required autoFocus />
                        </div>

                        <button type="submit" disabled={loading || mfaCode.length !== 6}
                            className="w-full py-3 bg-cyber-blue/10 border border-cyber-blue text-cyber-blue rounded font-bold tracking-widest hover:bg-cyber-blue/20 hover:shadow-[0_0_20px_rgba(0,217,249,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2"><Lock size={14} className="animate-spin" /> VERIFYING MFA...</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2"><Shield size={14} /> VERIFY & AUTHENTICATE</span>
                            )}
                        </button>

                        <button type="button" onClick={resetToStep1} className="w-full text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                            ← Back to credentials
                        </button>
                    </form>
                )}

                {/* STEP 3: COMPLETE */}
                {step === 'COMPLETE' && (
                    <div className="text-center py-6 space-y-4">
                        <CheckCircle size={48} className="text-cyber-neon mx-auto animate-pulse" />
                        <div className="text-lg font-bold text-cyber-neon tracking-wider text-glow">ACCESS GRANTED</div>
                        <div className="text-xs text-gray-400">Identity verified • TOTP confirmed • Trust evaluated</div>
                        <div className="text-[10px] text-gray-600">Establishing secure session...</div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-cyber-slate/30 text-center">
                    <p className="text-[10px] text-gray-600 tracking-wider">AES-256-GCM :: mTLS 1.3 :: RFC 6238 TOTP</p>
                    <p className="text-[9px] text-gray-700 mt-1">3-Step Zero Trust Authentication Pipeline</p>
                </div>
            </div>
        </div>
    );
};
