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
  ShieldAlert
} from 'lucide-react';

// --- KOMPONENTY PRE GRAFY ---

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

  // Discovery state (v11)
  const [urlPrefix, setUrlPrefix] = useState('api/v1/'); 
  const [discoveryEndpoint, setDiscoveryEndpoint] = useState('partners/index');
  const [authStyle, setAuthStyle] = useState('X-Flowii-Api-Key');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    revenue: 0, activePartners: 0, openDeals: 0, unpaidInvoices: 0,
    monthlyRevenue: [], monthlyDeals: []
  });

  const getCleanApiKey = (key) => key ? key.trim().replace(/[^\x00-\x7F]/g, "") : "";

  /**
   * Run Discovery v11 - Ultra Diagnostic
   */
  const runDiscovery = async () => {
    if (!apiKey) {
      setError("Najprv vložte API kľúč v nastaveniach.");
      return;
    }
    setDiscoveryLoading(true);
    setDiscoveryResult(null);

    const cleanKey = getCleanApiKey(apiKey);
    const headers = { 'Content-Type': 'application/json' };

    if (authStyle === 'X-Flowii-Api-Key') headers['X-FLOWII-API-KEY'] = cleanKey;
    else if (authStyle === 'Api-Key-Plain') headers['Api-Key'] = cleanKey;
    else if (authStyle === 'Authorization-Bearer') headers['Authorization'] = `Bearer ${cleanKey}`;

    // Vyčistenie URL od možných dvojitých lomítok
    const sanitizedEndpoint = discoveryEndpoint.startsWith('/') ? discoveryEndpoint.substring(1) : discoveryEndpoint;
    const sanitizedPrefix = urlPrefix.endsWith('/') ? urlPrefix : `${urlPrefix}/`;
    
    try {
      const response = await fetch(`/api/proxy?endpoint=${sanitizedEndpoint}`, {
        method: 'POST', // Proxy vždy prijíma POST, aby mohlo preposlať nastavenia
        headers: headers,
        body: JSON.stringify({
          prefix: sanitizedPrefix,
          method: httpMethod, // Toto povie proxy serveru, akú metódu má použiť voči Flowii
          data: { apiKey: cleanKey }
        })
      });
      
      const status = response.status;
      const data = await response.json();
      const isHtml = data && data.raw && (data.raw.includes('<!DOCTYPE') || data.raw.includes('<html'));

      setDiscoveryResult({
        status,
        success: response.ok && !isHtml,
        payload: data,
        isHtml: isHtml,
        timestamp: new Date().toLocaleTimeString(),
        attemptedFullUrl: `https://api.flowii.com/${sanitizedPrefix}${sanitizedEndpoint}`,
        methodUsed: httpMethod,
        authUsed: authStyle
      });

    } catch (err) {
      setDiscoveryResult({ status: 'Error', success: false, payload: { error: err.message } });
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const generateMockData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
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
      const fetchRaw = async (endpoint) => {
        const res = await fetch(`/api/proxy?endpoint=${endpoint}`, { 
          method: 'POST', 
          headers: { 'X-FLOWII-API-KEY': cleanKey, 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ prefix: 'api/v1/', data: { apiKey: cleanKey } }) 
        });
        return await res.json();
      };
      const [partners, invoices] = await Promise.all([
        fetchRaw('partners/index').catch(() => ({ data: [] })),
        fetchRaw('invoices/index').catch(() => ({ data: [] }))
      ]);
      setDashboardData({
        revenue: (invoices.data || []).reduce((acc, inv) => acc + (parseFloat(inv.totalPrice) || 0), 0),
        activePartners: (partners.data || []).length,
        openDeals: 0,
        unpaidInvoices: (invoices.data || []).filter(inv => inv.paymentStatus !== 'paid').length,
        monthlyRevenue: generateMockData().monthlyRevenue,
        monthlyDeals: generateMockData().monthlyDeals
      });
    } catch (err) {
      setError(err.message);
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
        <div className="p-8 flex items-center justify-between text-white">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg border border-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">FlowiiStats</span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X /></button>
        </div>

        <nav className="mt-8 px-6 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-bold tracking-tight">Prehľad</span>
          </button>
          <button onClick={() => setActiveTab('discovery')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'discovery' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Bug className="w-5 h-5" />
            <span className="font-bold tracking-tight">Debugger (v11)</span>
          </button>
        </nav>

        <div className="absolute bottom-10 w-full px-6 text-center">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Nastavenia API</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden text-left text-slate-900">
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 text-left">
            <button className="md:hidden p-2.5 bg-slate-50 rounded-xl text-slate-600" onClick={() => setMobileMenuOpen(true)}><Menu /></button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight text-left">{activeTab === 'dashboard' ? 'Dashboard' : 'Discovery Debugger'}</h1>
          </div>
          <button onClick={() => fetchFlowiiData(apiKey)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-50 transition-colors shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12 space-y-12 text-left">
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
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-12 opacity-10"><Terminal className="w-32 h-32 text-white" /></div>
                <div className="relative z-10 text-left">
                  <h2 className="text-3xl font-black mb-4 tracking-tight text-white text-left">Ultra Discovery v11</h2>
                  <p className="text-slate-400 font-medium leading-relaxed mb-8 max-w-2xl text-left">
                    Ak 404 pretrváva, Flowii server filtruje požiadavky na úrovni firewallu. Skúsme "najľahší" možný endpoint a metódu GET.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mb-10 text-left">
                     <button 
                       onClick={() => { setDiscoveryEndpoint('user/me'); setHttpMethod('GET'); setUrlPrefix('api/v1/'); }}
                       className="px-5 py-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center gap-2"
                     >
                        <ShieldCheck className="w-4 h-4"/> 1. Skúsiť "user/me" (GET)
                     </button>
                     <button 
                       onClick={() => { setDiscoveryEndpoint('partners/index'); setHttpMethod('POST'); setUrlPrefix('api/v1/'); }}
                       className="px-5 py-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-xs font-black hover:bg-blue-600 transition-all flex items-center gap-2"
                     >
                        <Layers className="w-4 h-4"/> 2. Skúsiť "partners/index" (POST)
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 text-left">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 text-left"><Fingerprint className="w-3 h-3 text-slate-500"/> Hlavička</label>
                      <select value={authStyle} onChange={(e) => setAuthStyle(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500">
                        <option value="X-Flowii-Api-Key">X-FLOWII-API-KEY</option>
                        <option value="Api-Key-Plain">Api-Key</option>
                        <option value="Authorization-Bearer">Auth: Bearer</option>
                      </select>
                    </div>
                    <div className="space-y-2 text-left text-left">
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 text-left"><Globe className="w-3 h-3 text-slate-500"/> Prefix</label>
                      <select value={urlPrefix} onChange={(e) => setUrlPrefix(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500 text-left">
                        <option value="api/v1/">api/v1/</option>
                        <option value="api/v2/">api/v2/</option>
                        <option value="api/">api/</option>
                        <option value="">žiadny</option>
                      </select>
                    </div>
                    <div className="space-y-2 text-left text-left">
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 text-left"><Activity className="w-3 h-3 text-slate-500"/> Metóda</label>
                      <select value={httpMethod} onChange={(e) => setHttpMethod(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500 text-left">
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                      </select>
                    </div>
                    <div className="space-y-2 text-left text-left">
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 text-left text-left text-left text-left"><Layers className="w-3 h-3 text-slate-500 text-left"/> Endpoint</label>
                      <input type="text" value={discoveryEndpoint} onChange={(e) => setDiscoveryEndpoint(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500 text-left" placeholder="partners/index" />
                    </div>
                  </div>

                  <button 
                    onClick={runDiscovery} disabled={discoveryLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg active:scale-95 text-white uppercase text-xs tracking-widest text-left"
                  >
                    {discoveryLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Vykonať Diagnostiku
                  </button>
                </div>
              </div>

              {discoveryResult && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-8 text-left text-left">
                    <div className="flex items-center gap-4 text-left text-left">
                      <div className={`p-3 rounded-2xl ${discoveryResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><Database className="w-6 h-6" /></div>
                      <div className="text-left text-left">
                        <h3 className="text-xl font-bold text-slate-900 text-left text-left">Výsledok Odpovede</h3>
                        <p className="text-slate-400 text-xs font-mono text-left text-left">{discoveryResult.attemptedFullUrl}</p>
                      </div>
                    </div>
                    <div className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest ${discoveryResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>STATUS: {discoveryResult.status}</div>
                  </div>

                  {discoveryResult.isHtml && (
                    <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex gap-5 items-start">
                        <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0" />
                        <div className="text-left">
                            <h4 className="text-rose-900 font-bold mb-1">Diagnóza: Odmietnutie Firewallom</h4>
                            <p className="text-rose-700 text-xs leading-relaxed">
                                Server Flowii túto adresu <code>{discoveryResult.methodUsed} {discoveryResult.attemptedFullUrl}</code> nevidí alebo blokuje. 
                                Skúste kliknúť na zelené tlačidlo <b>"Skúsiť user/me (GET)"</b>. Ak nepomôže ani to, váš API kľúč nemusí mať povolený prístup cez API modul.
                            </p>
                        </div>
                    </div>
                  )}

                  <div className="space-y-4 text-left text-left text-left">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-tighter text-left text-left"><Code className="w-4 h-4 text-left text-left" /> Raw Output</div>
                    <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden shadow-2xl border border-slate-800 text-left">
                      {discoveryResult.isHtml ? (
                         <div className="space-y-4 text-left text-left text-left">
                            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase text-left text-left text-left text-left text-left text-left"><Info className="w-3 h-3 text-left" /> HTML 404 (IIS Server Error)</div>
                            <div className="text-slate-500 text-[10px] font-mono break-all opacity-50 text-left text-left text-left text-left">{discoveryResult.payload?.raw}</div>
                         </div>
                      ) : (
                        <pre className="text-emerald-400 text-[11px] font-mono overflow-auto max-h-[500px] leading-relaxed text-left text-left text-left text-left">
                          {JSON.stringify(discoveryResult.payload, null, 2)}
                        </pre>
                      )}
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
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 space-y-10 animate-in zoom-in-95 text-left text-left">
            <div className="flex items-center justify-between text-left text-left text-left text-left text-left">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight text-left text-left text-left text-left">Nastavenia API</h3>
              <button onClick={() => setShowSettings(false)} className="p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-left text-left text-left text-left"><X className="text-left text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-10 text-left text-left text-left">
              <div className="space-y-5 text-left text-left text-left text-left">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest text-left text-left text-left text-left">Flowii API Token</label>
                <input
                  type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Vložte váš tajný kľúč..."
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono shadow-inner text-slate-900 text-left text-left text-left text-left"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all uppercase text-xs tracking-widest shadow-lg active:scale-95 text-white text-left text-left text-left text-left text-left text-left text-left">Synchronizovať</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}