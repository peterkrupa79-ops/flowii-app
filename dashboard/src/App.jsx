import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Briefcase, 
  Settings, 
  LayoutDashboard, 
  FileText, 
  TrendingUp,
  AlertCircle,
  X, 
  CheckCircle2,
  Menu,
  Database,
  Search,
  Send,
  Code,
  RefreshCw,
  Bug,
  Globe,
  Lock,
  Terminal,
  Layers,
  Zap,
  ShieldCheck,
  Fingerprint,
  Key,
  Info,
  Activity,
  ArrowRight,
  ShieldAlert,
  Server,
  LifeBuoy,
  ClipboardList,
  ZapOff,
  Sparkles,
  Link,
  Scan,
  Loader2,
  Settings2,
  Wrench
} from 'lucide-react';

// --- KOMPONENTY PRE GRAFY (Tailwind CSS) ---

const SimpleBarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow text-center">
      <h3 className="text-lg font-bold text-slate-800 mb-6">{title}</h3>
      <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto text-center">
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="relative flex justify-center w-full h-full items-end">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10 font-bold">
                  {item.value.toLocaleString('sk-SK')} €
                </div>
                <div 
                  className="w-full max-w-[44px] bg-blue-500 rounded-t-xl transition-all duration-500 ease-out group-hover:bg-blue-600 shadow-sm"
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group hover:border-blue-300 transition-all text-left text-slate-900">
    <div className="space-y-3">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
      {trend && (
        <div className={`flex items-center text-sm font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
    <div className="p-4 bg-slate-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-slate-100">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// --- HLAVNÁ APLIKÁCIA ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Discovery state (v18 - The Final Diagnostic)
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [customEndpoint, setCustomEndpoint] = useState('partners/index');
  const [customPrefix, setCustomPrefix] = useState('api/v1/');

  const [dashboardData, setDashboardData] = useState({
    revenue: 0, activePartners: 0, openDeals: 0, unpaidInvoices: 0,
    monthlyRevenue: [], monthlyDeals: []
  });

  const getCleanApiKey = (key) => key ? key.trim().replace(/[^\x00-\x7F]/g, "") : "";

  /**
   * Hĺbkový skener kombinácií
   */
  const runSystemDiagnostic = async () => {
    if (!apiKey) {
      setError("Najprv vložte API kľúč v nastaveniach.");
      return;
    }
    
    setIsScanning(true);
    setDiscoveryResult(null);
    const cleanKey = getCleanApiKey(apiKey);
    
    const diagnosticTests = [
      { name: "Standard REST", prefix: "api/v1/", method: "POST", endpoint: "partners/index", auth: "Authorization-Bearer" },
      { name: "Slovak SaaS Style", prefix: "api/", method: "POST", endpoint: "partners/index", auth: "X-FLOWII-API-KEY" },
      { name: "Direct No-V1", prefix: "api/", method: "POST", endpoint: "partners/index", auth: "Api-Key" },
      { name: "Query Parameter Auth", prefix: "api/v1/", method: "POST", endpoint: `partners/index?apiKey=${cleanKey}`, auth: "None" },
      { name: "Raw Proxy Pass", prefix: "", method: "POST", endpoint: "partners/index", auth: "Authorization-Bearer" },
      { name: "Legacy GET Test", prefix: "api/v1/", method: "GET", endpoint: "partners", auth: "Authorization-Bearer" }
    ];

    for (let i = 0; i < diagnosticTests.length; i++) {
      const t = diagnosticTests[i];
      setScanProgress(`Preverujem stav ${i + 1}/${diagnosticTests.length}: ${t.name}...`);
      
      try {
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (t.auth === 'X-FLOWII-API-KEY') headers['X-FLOWII-API-KEY'] = cleanKey;
        else if (t.auth === 'Api-Key') headers['Api-Key'] = cleanKey;
        else if (t.auth === 'Authorization-Bearer') headers['Authorization'] = `Bearer ${cleanKey}`;

        const response = await fetch(`/api/proxy?endpoint=${t.endpoint}`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            prefix: t.prefix,
            method: t.method,
            data: t.method === 'POST' ? { apiKey: cleanKey } : {}
          })
        });

        const data = await response.json();
        const isHtml = data && data.raw && (data.raw.includes('<!DOCTYPE') || data.raw.includes('<html'));

        if (response.ok && !isHtml) {
          setDiscoveryResult({
            status: response.status,
            success: true,
            payload: data,
            config: t,
            timestamp: new Date().toLocaleTimeString()
          });
          setIsScanning(false);
          return;
        }
      } catch (err) {
        console.error("Diagnostický krok zlyhal", err);
      }
    }

    setScanProgress("Všetky známe komunikačné kanály sú zablokované (404).");
    setIsScanning(false);
    setDiscoveryResult({ status: 404, success: false, payload: { error: "Server Flowii neodpovedá na žiadnu z testovaných ciest." } });
  };

  const generateMockData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    const mockRev = months.slice(-6).map(month => ({
      label: month, value: Math.floor(Math.random() * 10000) + 5000
    }));
    return {
      revenue: mockRev.reduce((acc, curr) => acc + curr.value, 0),
      activePartners: 142, openDeals: 15, unpaidInvoices: 4,
      monthlyRevenue: mockRev,
      monthlyDeals: mockRev.map(m => ({ label: m.label, value: Math.floor(m.value / 1000) }))
    };
  };

  const fetchFlowiiData = async (key) => {
    if (!key || key === 'demo-key') {
      setDashboardData(generateMockData());
      return;
    }
    setLoading(true);
    const cleanKey = getCleanApiKey(key);
    try {
      // Skúšame defaultný predpoklad pre dashboard
      const res = await fetch(`/api/proxy?endpoint=partners/index`, { 
        method: 'POST', 
        headers: { 'X-FLOWII-API-KEY': cleanKey, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ prefix: 'api/v1/', data: { apiKey: cleanKey } }) 
      });
      const partners = await res.json();
      
      setDashboardData({
        revenue: 0,
        activePartners: (partners.data || []).length,
        openDeals: 0,
        unpaidInvoices: 0,
        monthlyRevenue: generateMockData().monthlyRevenue,
        monthlyDeals: generateMockData().monthlyDeals
      });
    } catch (err) {
      setError(err.message);
      setDashboardData(generateMockData());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchFlowiiData(apiKey); }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setShowSettings(false);
    fetchFlowiiData(apiKey);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-72 transform transition-transform duration-500 ease-in-out z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block border-r border-slate-800 shadow-2xl text-left`}>
        <div className="p-8 flex items-center justify-between text-white text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg border border-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">FlowiiStats</span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X /></button>
        </div>

        <nav className="mt-8 px-6 space-y-2 text-left">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-bold tracking-tight">Prehľad</span>
          </button>
          <button onClick={() => setActiveTab('discovery')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'discovery' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Bug className="w-5 h-5" />
            <span className="font-bold tracking-tight">Inšpektor (v18)</span>
          </button>
        </nav>

        <div className="absolute bottom-10 w-full px-6 text-center">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide text-left">Nastavenia API</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden text-left text-slate-900">
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 text-left">
            <button className="md:hidden p-2.5 bg-slate-50 rounded-xl text-slate-600" onClick={() => setMobileMenuOpen(true)}><Menu /></button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight text-left">{activeTab === 'dashboard' ? 'Dashboard' : 'Systémový Inšpektor'}</h1>
          </div>
          <button onClick={() => fetchFlowiiData(apiKey)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-50 transition-colors shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12 space-y-12">
          {activeTab === 'dashboard' ? (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Celkové tržby" value={`${dashboardData.revenue.toLocaleString('sk-SK')} €`} icon={DollarSign} />
                <StatCard title="Partneri" value={dashboardData.activePartners} icon={Users} />
                <StatCard title="Otvorené faktúry" value={dashboardData.unpaidInvoices} icon={FileText} />
                <StatCard title="Zdroj" value="Flowii API" icon={Activity} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="h-[450px]"><SimpleBarChart title="Mesačné tržby" data={dashboardData.monthlyRevenue} /></div>
                <div className="h-[450px]"><SimpleBarChart title="Trend obchodov" data={dashboardData.monthlyDeals} /></div>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 text-left">
              
              {/* INSPECTOR HEADER */}
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden text-left border-4 border-slate-800">
                <div className="absolute top-0 right-0 p-12 opacity-10"><Wrench className="w-32 h-32 text-white" /></div>
                <div className="relative z-10 text-left">
                  <h2 className="text-3xl font-black mb-4 tracking-tight text-white">System Inspector v18</h2>
                  <p className="text-slate-400 font-bold leading-relaxed mb-8 max-w-2xl text-left">
                    Ak zlyhali všetky cesty, skúsime preveriť samotnú komunikáciu s IIS serverom. Spustite hĺbkový sken alebo si upravte URL ručne.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-left">
                     <button 
                       onClick={runSystemDiagnostic}
                       disabled={isScanning}
                       className="px-8 py-5 bg-blue-600 text-white rounded-3xl text-sm font-black hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50"
                     >
                        {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Scan className="w-6 h-6" />}
                        {isScanning ? "SKENUJEM PROTOKOLY..." : "SPUSTIŤ HĹBKOVÝ SKEN"}
                     </button>
                  </div>
                  {isScanning && (
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-blue-400">
                       {scanProgress}
                    </p>
                  )}
                </div>
              </div>

              {/* MANUAL OVERRIDE */}
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm text-left">
                <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Settings2 className="w-4 h-4"/> Manuálne ladenie (Manual Override)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                   <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Cesta (Prefix)</label>
                      <input 
                        type="text" value={customPrefix} onChange={(e) => setCustomPrefix(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                        placeholder="napr. api/v1/"
                      />
                   </div>
                   <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Endpoint (Súbor)</label>
                      <input 
                        type="text" value={customEndpoint} onChange={(e) => setCustomEndpoint(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                        placeholder="napr. partners/index"
                      />
                   </div>
                </div>
                <p className="mt-4 text-[10px] text-slate-400 font-bold">
                   Tip: Skúste vymazať prefix a do endpointu napísať celú cestu: <code>api/v1/partners/index</code>
                </p>
              </div>

              {discoveryResult && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm text-left animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-8 text-left">
                    <div className="flex items-center gap-4 text-left">
                      <div className={`p-4 rounded-2xl ${discoveryResult.success ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-rose-500 text-white shadow-rose-200 shadow-lg'}`}><Database className="w-6 h-6" /></div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-slate-900">Analýza Protokolu</h3>
                        <p className="text-slate-400 text-xs font-mono">{discoveryResult.success ? "SPOJENIE AKTÍVNE" : "SPOJENIE BLOKOVANÉ"}</p>
                      </div>
                    </div>
                    <div className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest ${discoveryResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>STATUS: {discoveryResult.status}</div>
                  </div>

                  {discoveryResult.success ? (
                    <div className="mb-8 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] text-left text-slate-900">
                       <div className="flex items-start gap-4 mb-6">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                          <div className="text-left">
                             <h4 className="text-emerald-900 font-black text-xl mb-1">Cesta je voľná!</h4>
                             <p className="text-emerald-700 text-sm font-bold">Inšpektor našiel konfiguráciu, ktorá prešla cez IIS firewall:</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                          <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Mód</p>
                             <p className="text-xs font-bold text-slate-900">{discoveryResult.config.name}</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Prefix</p>
                             <p className="text-xs font-bold text-slate-900">{discoveryResult.config.prefix || "null"}</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Hlavička</p>
                             <p className="text-xs font-bold text-slate-900">{discoveryResult.config.auth}</p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="mb-8 p-8 bg-rose-50 border-2 border-rose-100 rounded-[2rem] text-left text-slate-900">
                       <div className="flex items-start gap-4">
                          <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
                          <div className="text-left">
                             <h4 className="text-rose-900 font-black text-xl mb-1">TOTÁLNA 404</h4>
                             <p className="text-rose-700 text-sm font-bold leading-relaxed">
                                Ani jedna z 6 kombinácií neprešla. Toto sa stáva, ak je API kľúč nesprávny alebo 
                                ak váš hosting (Vercel) nemá povolený prístup k serveru Flowii. 
                                Skontrolujte vo Flowii v časti <b>Správa firmy {`→`} API</b>, či tam nemáte 
                                obmedzenie na IP adresy.
                             </p>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-tighter"><Code className="w-4 h-4" /> Server Response Raw</div>
                    <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden shadow-2xl border border-slate-800 text-left">
                        <pre className="text-emerald-400 text-[11px] font-mono overflow-auto max-h-[400px] leading-relaxed text-left">
                          {JSON.stringify(discoveryResult.payload, null, 2)}
                        </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* SETTINGS */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 space-y-10 animate-in zoom-in-95 text-left text-slate-900">
            <div className="flex items-center justify-between text-left">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nastavenia API</h3>
              <button onClick={() => setShowSettings(false)} className="p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400"><X className="text-left text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-10">
              <div className="space-y-5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest text-left">Flowii API Token</label>
                <input
                  type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Vložte váš tajný kľúč..."
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono shadow-inner text-slate-900"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all uppercase text-xs tracking-widest shadow-lg active:scale-95 text-white">Synchronizovať</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}