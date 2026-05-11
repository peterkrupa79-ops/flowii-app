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
  Terminal
} from 'lucide-react';

// --- KOMPONENTY PRE GRAFY ---

const SimpleBarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow text-center">
      <h3 className="text-lg font-bold text-slate-800 mb-6">{title}</h3>
      <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto">
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
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group hover:border-blue-300 transition-all">
    <div className="space-y-3">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 tracking-tight text-left">{value}</h4>
      {trend && (
        <div className={`flex items-center text-sm font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
    <div className="p-4 bg-slate-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
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

  // --- DEBUG NASTAVENIA ---
  const [proxyUrl, setProxyUrl] = useState('/api/proxy');
  const [authPrefix, setAuthPrefix] = useState('Bearer ');

  const [discoveryEndpoint, setDiscoveryEndpoint] = useState('partners');
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const [rawData, setRawData] = useState({
    partners: null,
    invoices: null,
    opportunities: null
  });

  const [dashboardData, setDashboardData] = useState({
    revenue: 0,
    activePartners: 0,
    openDeals: 0,
    unpaidInvoices: 0,
    monthlyRevenue: [],
    monthlyDeals: []
  });

  const generateMockData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    const mockRev = months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map(month => ({
      label: month, value: Math.floor(Math.random() * 10000) + 2000
    }));
    return {
      revenue: 0, activePartners: 0, openDeals: 0, unpaidInvoices: 0,
      monthlyRevenue: mockRev,
      monthlyDeals: mockRev.map(m => ({ label: m.label, value: Math.floor(m.value / 1000) }))
    };
  };

  /**
   * Helper pre správne poskladanie URL.
   */
  const getEndpointUrl = (baseUrl, endpoint) => {
    let base = baseUrl.trim();
    if (base.endsWith('/api/proxy') || base === 'api/proxy') {
      return `${base}?endpoint=${endpoint}`;
    }
    if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }
    return base.includes('?endpoint=') ? `${base}${endpoint}` : `${base}/${endpoint}`;
  };

  const runDiscovery = async () => {
    if (!apiKey) {
      setError("Najprv vložte API kľúč v nastaveniach.");
      return;
    }
    setDiscoveryLoading(true);
    setDiscoveryResult(null);

    const targetUrl = getEndpointUrl(proxyUrl, discoveryEndpoint);

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'Authorization': `${authPrefix}${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      const status = response.status;
      const contentType = response.headers.get("content-type");
      const text = await response.text();
      let payload;
      
      try {
        payload = JSON.parse(text);
      } catch (e) {
        payload = { rawResponse: text, parseError: "Odpoveď nie je platný JSON" };
      }

      setDiscoveryResult({
        status,
        success: response.ok,
        payload: payload,
        contentType: contentType,
        timestamp: new Date().toLocaleTimeString(),
        attemptedUrl: targetUrl,
        attemptedAuth: `${authPrefix}***`
      });

    } catch (err) {
      setDiscoveryResult({
        status: 'Network Error',
        success: false,
        payload: { error: err.message },
        timestamp: new Date().toLocaleTimeString(),
        attemptedUrl: targetUrl
      });
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const fetchFlowiiData = async (key) => {
    if (!key) return;
    setLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `${authPrefix}${key}`, 'Accept': 'application/json' };
      
      const fetchRaw = async (endpoint) => {
        const url = getEndpointUrl(proxyUrl, endpoint);
        const res = await fetch(url, { headers });
        const result = await res.json();
        if (!res.ok) throw new Error(`${endpoint}: ${result.message || result.error || res.status}`);
        return result;
      };

      const [partners, invoices, opportunities] = await Promise.all([
        fetchRaw('partners').catch(e => ({ error: true, message: e.message })),
        fetchRaw('invoices').catch(e => ({ error: true, message: e.message })),
        fetchRaw('opportunities').catch(e => ({ error: true, message: e.message }))
      ]);

      setRawData({ partners, invoices, opportunities });

      const partnersList = partners.data || [];
      const invoicesList = invoices.data || [];

      setDashboardData({
        revenue: invoicesList.reduce((acc, inv) => acc + (parseFloat(inv.totalPrice) || 0), 0),
        activePartners: partnersList.length,
        openDeals: (opportunities.data || []).length,
        unpaidInvoices: invoicesList.filter(inv => inv.paymentStatus !== 'paid').length,
        monthlyRevenue: generateMockData().monthlyRevenue,
        monthlyDeals: generateMockData().monthlyDeals
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setShowSettings(false);
    fetchFlowiiData(apiKey);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Prehľad', icon: LayoutDashboard },
    { id: 'discovery', label: 'API Discovery (Debugger)', icon: Bug },
    { id: 'invoices', label: 'Faktúry', icon: FileText },
    { id: 'partners', label: 'Partneri', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-72 transform transition-transform duration-500 ease-in-out z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block border-r border-slate-800 shadow-2xl`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">FlowiiStats</span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X /></button>
        </div>

        <nav className="mt-8 px-6 space-y-2 text-left">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl translate-x-1' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-bold tracking-tight text-left">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-10 w-full px-6 text-center">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Nastavenia API</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden text-left">
        
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 shrink-0 text-center">
          <button className="md:hidden p-2.5 bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(true)}><Menu /></button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight text-left">{menuItems.find(i => i.id === activeTab)?.label}</h1>
          
          <div className="flex items-center gap-6">
            {!apiKey ? (
              <div className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-black border border-amber-100">KONFIGURÁCIA</div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-100 tracking-widest uppercase">Live</div>
            )}
            <button onClick={() => fetchFlowiiData(apiKey)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-50 transition-colors shadow-sm">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12 space-y-12">
          
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-3xl flex items-start gap-6 shadow-sm text-left">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div className="text-left">
                <h3 className="text-rose-900 font-black text-lg">Chyba synchronizácie</h3>
                <p className="text-rose-700 text-sm mt-1 font-semibold">{error}</p>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto animate-in fade-in duration-700 text-left">
            
            {activeTab === 'dashboard' && (
              <div className="space-y-12 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <StatCard title="Celkové tržby" value={`${dashboardData.revenue.toLocaleString('sk-SK')} €`} icon={DollarSign} />
                  <StatCard title="Partneri" value={dashboardData.activePartners} icon={Users} />
                  <StatCard title="Obchody" value={dashboardData.openDeals} icon={Briefcase} />
                  <StatCard title="Nezaplatené" value={dashboardData.unpaidInvoices} icon={FileText} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-center">
                  <div className="h-[450px] text-center"><SimpleBarChart title="Mesačné tržby" data={dashboardData.monthlyRevenue} /></div>
                  <div className="h-[450px] text-center"><SimpleBarChart title="Počet obchodov" data={dashboardData.monthlyDeals} /></div>
                </div>
              </div>
            )}

            {activeTab === 'discovery' && (
              <div className="space-y-8 text-left">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 p-12 opacity-10"><Search className="w-32 h-32 text-white" /></div>
                  <div className="relative z-10 text-left">
                    <h2 className="text-3xl font-black mb-4 tracking-tight text-white">Debugger Pripojenia</h2>
                    <p className="text-slate-400 font-medium leading-relaxed mb-8 max-w-2xl text-left">
                      Ak váš Proxy server vracia <b>Chybu 500</b>, problém je pravdepodobne v kóde <code>proxy.js</code>. Skúste zmeniť metódu alebo otestujte existenciu endpointu.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Globe className="w-3 h-3 text-slate-500"/> Proxy Metóda</label>
                        <select 
                           value={proxyUrl} 
                           onChange={(e) => setProxyUrl(e.target.value)}
                           className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                        >
                          <option value="/api/proxy">Proxy Skript (/api/proxy.js)</option>
                          <option value="/api/flowii">Vercel Rewrite (/api/flowii/)</option>
                        </select>
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Lock className="w-3 h-3 text-slate-500"/> Formát kľúča</label>
                        <select 
                           value={authPrefix} 
                           onChange={(e) => setAuthPrefix(e.target.value)}
                           className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                        >
                          <option value="Bearer ">Bearer [kľúč]</option>
                          <option value="">Iba [kľúč]</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 text-left">
                      <div className="flex-1 relative text-left">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-bold uppercase tracking-tighter">api/v1/</span>
                        <input 
                          type="text"
                          value={discoveryEndpoint}
                          onChange={(e) => setDiscoveryEndpoint(e.target.value.toLowerCase())}
                          className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 pl-20 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-white shadow-inner"
                          placeholder="názov endpointu (napr. partners)..."
                        />
                      </div>
                      <button 
                        onClick={runDiscovery}
                        disabled={discoveryLoading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/30 active:scale-95 text-sm uppercase text-white"
                      >
                        {discoveryLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Otestovať
                      </button>
                    </div>
                  </div>
                </div>

                {discoveryResult && (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm animate-in slide-in-from-bottom-4 duration-500 text-left">
                    <div className="flex items-center justify-between mb-8 text-left">
                      <div className="flex items-center gap-4 text-left">
                        <div className={`p-3 rounded-2xl ${discoveryResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          <Database className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold">Analýza Odpovede</h3>
                          <p className="text-slate-400 text-sm font-medium">Požiadavka odoslaná o {discoveryResult.timestamp}</p>
                        </div>
                      </div>
                      <div className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest ${discoveryResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        STAV: {discoveryResult.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 text-left">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 text-left">Použitá URL</p>
                          <p className="text-xs font-mono break-all text-left text-slate-600">{discoveryResult.attemptedUrl}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 text-left">Typ obsahu (Header)</p>
                          <p className="text-xs font-mono text-left text-slate-600">{discoveryResult.contentType || "Neznámy"}</p>
                       </div>
                    </div>

                    {discoveryResult.status === 500 && (
                      <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-left">
                        <div className="flex gap-4 items-start text-left">
                          <Terminal className="w-6 h-6 text-rose-600 shrink-0" />
                          <div className="text-left">
                            <h4 className="text-rose-900 font-bold mb-1 text-left">Diagnostika Chyby 500</h4>
                            <p className="text-rose-700 text-xs leading-relaxed text-left">
                              Váš <b>Proxy Server zlyhal</b> ešte predtým, než dostal dáta od Flowii. Skontrolujte súbor <code>api/proxy.js</code>. Najčastejšie chýba knižnica <code>node-fetch</code> (ak používate staršiu verziu Node.js) alebo je problém v URL adrese Flowii.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 text-left">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-tighter text-left">
                        <Code className="w-4 h-4 text-slate-400" /> JSON / RAW Odpoveď
                      </div>
                      <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden shadow-2xl text-left">
                        <pre className="text-emerald-400 text-[11px] font-mono overflow-auto max-h-[500px] leading-relaxed text-left">
                          {JSON.stringify(discoveryResult.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'invoices' || activeTab === 'partners') && (
              <div className="bg-white rounded-[40px] border border-slate-100 p-24 text-center space-y-8 shadow-sm">
                 <LayoutDashboard className="w-12 h-12 text-slate-200 mx-auto" />
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center text-slate-900">Sekcia {menuItems.find(i => i.id === activeTab)?.label}</h2>
                 <p className="text-slate-400 max-w-sm mx-auto font-bold leading-relaxed text-lg text-center">Tabuľky sa zobrazia po úspešnom prepojení v Debuggeri.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 space-y-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight text-slate-900 text-left">Nastavenia API</h3>
                <p className="text-slate-400 font-bold text-sm mt-1 text-left">Vložte váš tajný token</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 text-center"><X className="text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-10 text-left">
              <div className="space-y-5 text-left">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest text-left">Flowii API Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Vložte váš kľúč..."
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