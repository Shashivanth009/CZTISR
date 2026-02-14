import { useState, useMemo } from 'react';
import {
  Network, Shield, Activity, FileText, LogOut, User,
  Radio, Server, Eye, Flag, Crosshair, Lock
} from 'lucide-react';
import clsx from 'clsx';
import { LoginPage } from './pages/LoginPage';
import { CommanderDashboard } from './components/CommanderDashboard';
import { MissionControl } from './components/MissionControl';
import { InfrastructureView } from './components/InfrastructureView';
import { Communications } from './components/Communications';
import { SOCDashboard } from './components/SOCDashboard';
import { Intelligence } from './components/Intelligence';
import { SurveillanceRecon } from './components/SurveillanceRecon';
import { AuditLog } from './components/AuditLog';
import { PolicyEngine } from './components/PolicyEngine';

// ============================================================
//  RBAC — Role-Based Access Control Matrix
//  Maps tab IDs to the roles that are PERMITTED to view them.
//  Bell-LaPadula: No Read Up (a user cannot access data above
//  their clearance level).
// ============================================================
const RBAC_MATRIX: Record<string, string[]> = {
  'C1': ['COMMANDER'],                                // TOP_SECRET only
  'C2': ['COMMANDER'],                                // TOP_SECRET only — mission control
  'C3': ['COMMANDER', 'SOC_ANALYST'],                 // SECRET+ — infrastructure
  'C4': ['COMMANDER', 'SOC_ANALYST'],                 // SECRET+ — comms
  'C5': ['COMMANDER', 'SOC_ANALYST', 'RED_TEAM'],     // ALL — cyber defense
  'I': ['COMMANDER', 'SOC_ANALYST'],                 // SECRET+ — intel
  'SR': ['COMMANDER', 'RED_TEAM'],                    // recon & offensive ops
  'ZT': ['COMMANDER', 'SOC_ANALYST'],                 // SECRET+ — policy
  'AL': ['COMMANDER', 'SOC_ANALYST'],                 // SECRET+ — audit
};

// Tab definitions (all tabs, before RBAC filtering)
const ALL_TABS = [
  { id: 'C1', icon: Activity, label: 'C1 — COMMAND', group: 'C5', clearance: 'TOP_SECRET' },
  { id: 'C2', icon: Flag, label: 'C2 — CONTROL', group: 'C5', clearance: 'TOP_SECRET' },
  { id: 'C3', icon: Server, label: 'C3 — COMPUTERS', group: 'C5', clearance: 'SECRET' },
  { id: 'C4', icon: Radio, label: 'C4 — COMMS', group: 'C5', clearance: 'SECRET' },
  { id: 'C5', icon: Shield, label: 'C5 — CYBER DEF', group: 'C5', clearance: 'CONFIDENTIAL' },
  { id: 'I', icon: Eye, label: 'I — INTELLIGENCE', group: 'ISR', clearance: 'SECRET' },
  { id: 'SR', icon: Crosshair, label: 'S/R — SURV & RECON', group: 'ISR', clearance: 'CONFIDENTIAL' },
  { id: 'ZT', icon: Network, label: 'ZERO TRUST', group: 'ZTA', clearance: 'SECRET' },
  { id: 'AL', icon: FileText, label: 'AUDIT LOG', group: 'ZTA', clearance: 'SECRET' },
];

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('C1');
  const [deniedTab, setDeniedTab] = useState<string | null>(null);

  const handleLogin = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    // Set default tab based on role
    const role = userData?.role || '';
    if (role === 'COMMANDER') setActiveTab('C1');
    else if (role === 'SOC_ANALYST') setActiveTab('C5');
    else if (role === 'RED_TEAM') setActiveTab('C5');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setActiveTab('C1');
  };

  // RBAC: filter tabs to only those the user's role can access
  const userRole = user?.role || '';
  const allowedTabs = useMemo(() =>
    ALL_TABS.filter(tab => RBAC_MATRIX[tab.id]?.includes(userRole)),
    [userRole]
  );

  const deniedTabs = useMemo(() =>
    ALL_TABS.filter(tab => !RBAC_MATRIX[tab.id]?.includes(userRole)),
    [userRole]
  );

  if (!token) return <LoginPage onLogin={handleLogin} />;

  const c5Allowed = allowedTabs.filter(t => t.group === 'C5');
  const isrAllowed = allowedTabs.filter(t => t.group === 'ISR');
  const ztaAllowed = allowedTabs.filter(t => t.group === 'ZTA');

  const c5Denied = deniedTabs.filter(t => t.group === 'C5');
  const isrDenied = deniedTabs.filter(t => t.group === 'ISR');
  const ztaDenied = deniedTabs.filter(t => t.group === 'ZTA');

  const activeLabel = ALL_TABS.find(t => t.id === activeTab)?.label || '';

  const handleDeniedClick = (tabId: string) => {
    setDeniedTab(tabId);
    setTimeout(() => setDeniedTab(null), 2000);
  };

  return (
    <div className="flex h-screen w-screen bg-cyber-dark bg-grid text-cyber-neon font-mono">
      {/* Sidebar */}
      <div className="w-56 border-r border-cyber-neon/20 bg-black/60 backdrop-blur-sm flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-cyber-neon/20">
          <h1 className="text-lg font-bold tracking-[0.25em] text-glow">C5ISR</h1>
          <div className="text-[10px] tracking-[0.4em] text-cyber-neon/80">ZERO TRUST</div>
          <div className="mt-2 text-[10px] text-cyber-blue animate-pulse">● SYSTEM SECURE</div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {/* C5 Group */}
          <div className="text-[9px] text-gray-600 tracking-[0.3em] px-2 pt-2 pb-1">C5 — COMBAT SYSTEMS</div>
          {c5Allowed.map((tab) => (
            <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
          {c5Denied.map((tab) => (
            <DeniedTabButton key={tab.id} tab={tab} onClick={() => handleDeniedClick(tab.id)} flash={deniedTab === tab.id} />
          ))}

          {/* ISR Group */}
          <div className="text-[9px] text-gray-600 tracking-[0.3em] px-2 pt-4 pb-1">ISR — INTEL & RECON</div>
          {isrAllowed.map((tab) => (
            <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
          {isrDenied.map((tab) => (
            <DeniedTabButton key={tab.id} tab={tab} onClick={() => handleDeniedClick(tab.id)} flash={deniedTab === tab.id} />
          ))}

          {/* ZTA Group */}
          <div className="text-[9px] text-gray-600 tracking-[0.3em] px-2 pt-4 pb-1">ZTA — ZERO TRUST</div>
          {ztaAllowed.map((tab) => (
            <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
          {ztaDenied.map((tab) => (
            <DeniedTabButton key={tab.id} tab={tab} onClick={() => handleDeniedClick(tab.id)} flash={deniedTab === tab.id} />
          ))}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-cyber-neon/20">
          <div className="flex items-center gap-2 p-2 text-xs">
            <User size={14} className="text-cyber-blue" />
            <div>
              <div className="text-white text-[11px]">{user?.full_name ?? user?.username}</div>
              <div className="text-[10px] text-gray-500">{user?.role} • {user?.clearance}</div>
            </div>
          </div>
          {/* RBAC Badge */}
          <div className="mt-1 px-2 py-1 text-[9px] text-center rounded border border-cyber-neon/20 bg-cyber-neon/5">
            <span className="text-cyber-neon">{allowedTabs.length}</span>
            <span className="text-gray-500"> / {ALL_TABS.length} tabs authorized</span>
          </div>
          <button onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-[10px] text-gray-500 border border-cyber-slate/30 rounded hover:text-cyber-red hover:border-cyber-red/50 transition-all">
            <LogOut size={12} /> DISCONNECT
          </button>
        </div>
        <div className="p-2 border-t border-cyber-neon/20 text-[8px] text-center text-gray-600">
          AES-256-GCM :: mTLS 1.3
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center px-5 py-3 border-b border-cyber-neon/10 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white tracking-wider">{activeLabel}</h2>
            <p className="text-[10px] text-gray-500 tracking-wider">
              Clearance: {user?.clearance} // Role: {user?.role} // RBAC: {allowedTabs.length} tabs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-cyber-red block">THREAT LEVEL</span>
              <span className="text-sm font-bold text-cyber-red animate-pulse">ELEVATED</span>
            </div>
            <div className="h-8 w-8 border border-cyber-red rounded-full flex items-center justify-center bg-cyber-red/10 text-cyber-red text-xs font-bold animate-pulse">!</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5">
          {/* ACCESS DENIED banner */}
          {deniedTab && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-cyber-red/20 border border-cyber-red rounded-lg text-cyber-red text-xs font-bold tracking-wider flex items-center gap-2 animate-pulse backdrop-blur-sm">
              <Lock size={14} /> ACCESS DENIED — Requires {ALL_TABS.find(t => t.id === deniedTab)?.clearance} clearance
            </div>
          )}

          {activeTab === 'C1' && <CommanderDashboard token={token} />}
          {activeTab === 'C2' && <MissionControl token={token} />}
          {activeTab === 'C3' && <InfrastructureView token={token} />}
          {activeTab === 'C4' && <Communications token={token} user={user} />}
          {activeTab === 'C5' && <SOCDashboard token={token} />}
          {activeTab === 'I' && <Intelligence token={token} />}
          {activeTab === 'SR' && <SurveillanceRecon token={token} />}
          {activeTab === 'ZT' && <PolicyEngine token={token} />}
          {activeTab === 'AL' && <AuditLog token={token} />}
        </div>
      </div>
    </div>
  );
}

// Permitted tab button
const TabButton = ({ tab, active, onClick }: { tab: any; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-2 px-3 py-2 rounded border transition-all duration-200 text-[11px]",
      active
        ? "bg-cyber-neon/10 border-cyber-neon text-cyber-neon shadow-[0_0_10px_rgba(0,255,157,0.15)]"
        : "border-transparent text-gray-500 hover:text-cyber-neon hover:bg-cyber-neon/5"
    )}
  >
    <tab.icon size={14} />
    <span className="tracking-wider truncate">{tab.label}</span>
  </button>
);

// Denied tab button — visible but locked
const DeniedTabButton = ({ tab, onClick, flash }: { tab: any; onClick: () => void; flash: boolean }) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-2 px-3 py-2 rounded border transition-all duration-200 text-[11px] cursor-not-allowed opacity-40",
      flash
        ? "border-cyber-red/50 bg-cyber-red/10 text-cyber-red"
        : "border-transparent text-gray-600"
    )}
    title={`Requires ${tab.clearance} clearance`}
  >
    <Lock size={12} className="text-gray-700" />
    <span className="tracking-wider truncate line-through">{tab.label}</span>
    <span className="ml-auto text-[8px] text-gray-700">{tab.clearance?.slice(0, 3)}</span>
  </button>
);

export default App;
