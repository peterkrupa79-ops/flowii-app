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
  Info
} from 'lucide-react';

/**
 * Komponent pre stĺpcový graf vytvorený pomocou Tailwind CSS.
 */
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
                  className="w-full max-w-[44px] bg-blue-600 rounded-t-xl transition-all duration-500 ease-out group-hover:bg-blue-700 shadow-sm"
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

/**
 * Karta pre zobrazenie KPI metrík.
 */
const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group hover:border-blue-300 transition-all text-left">
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
    <div className="p-4 bg-slate-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

/**
 * Hlavný komponent dashboardu Flowii Stats.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug nastavenia
  const [urlPrefix, setUrlPrefix] = useState('api/'); 
  const [discoveryEndpoint, setDiscoveryEndpoint] = useState('partners/index');
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

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
      label: month, value: Math.floor(Math.random() * 10000) + 5000
    }));
    return {
      revenue: mockRev.reduce((acc, curr) => acc + curr.value, 0),
      activePartners: 142,
      openDeals: 15,
      unpaidInvoices: 4,
      monthlyRevenue: mockRev,
      monthlyDeals: mockRev.map(m => ({ label: m.label, value: Math.floor(m.value / 1000) }))
    };
  };

  /**
   * Spustenie testu pripojenia cez Debugger.
   */
  const runDiscovery = async () => {
    if (!apiKey) {
      setError("Najprv vložte API kľúč v nastaveniach.");
      return;
    }
    setDiscoveryLoading(true);
    setDiscoveryResult(null);

    try {
      const response = await fetch(`/api/proxy?endpoint=${discoveryEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prefix: urlPrefix,
          data: {}
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
        attemptedFullUrl: `https://api.flowii.com/${urlPrefix}${discoveryEndpoint}`
      });

    } catch (err) {
      setDiscoveryResult({ status: 'Error', success: false, payload: { error: err.message } });
    } finally {
      setDiscoveryLoading(false);
    }
  };

  /**
   * Načítanie reálnych dát z Flowii.
   */
  const fetchFlowiiData = async (key) => {
    if (!key || key === 'demo-key') {
      setDashboardData(generateMockData());
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
      const fetchRaw = async (endpoint) => {
        const res = await fetch(`/api/proxy?endpoint=${endpoint}`, { 
          method: 'POST', 
          headers, 
          body: JSON.stringify({ prefix: urlPrefix, data: {} }) 
        });
        return await res.json();
      };

      const [partners, invoices, opportunities] = await Promise.all([
        fetchRaw('partners/index').catch(() => ({ data: [] })),
        fetchRaw('invoices/index').catch(() => ({ data: [] })),
        fetchRaw('opportunities/index').catch(() => ({ data: [] }))
      ]);

      setDashboardData({
        revenue: (invoices.data || []).reduce((acc, inv) => acc + (parseFloat(inv.totalPrice) || 0), 0),
        activePartners: (partners.data || []).length,
        openDeals: (opportunities.data || []).length,
        unpaidInvoices: (invoices.data || []).filter(inv => inv.paymentStatus !== 'paid').length,
        monthlyRevenue: generateMockData().monthlyRevenue,
        monthlyDeals: generateMockData().monthlyDeals
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowiiData(apiKey);
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setShowSettings(false);
    fetchFlowiiData(apiKey);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Prehľad', icon: LayoutDashboard },
    { id: 'discovery', label: 'Debugger (Discovery)', icon: Bug },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-72 transform transition-transform duration-500 ease-in-out z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block border-r border-slate-800 shadow-2xl`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">FlowiiStats</span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X /></button>
        </div>

        <nav className="mt-8 px-6 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-800 hover:text-white text-slate-400'
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

      {/* HLAVNÝ OBSAH */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-left text-slate-900">
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2.5 bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(true)}><Menu className="text-slate-600" /></button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{menuItems.find(i => i.id === activeTab)?.label}</h1>
          </div>
          
          <button onClick={() => fetchFlowiiData(apiKey)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-50 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12 space-y-12">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-3xl flex items-start gap-6 shadow-sm">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div className="text-left">
                <h3 className="text-rose-900 font-black text-lg">Chyba synchronizácie</h3>
                <p className="text-rose-700 text-sm mt-1 font-semibold">{error}</p>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            {activeTab === 'dashboard' && (
              <div className="space-y-12 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <StatCard title="Celkové tržby" value={`${dashboardData.revenue.toLocaleString('sk-SK')} €`} icon={DollarSign} />
                  <StatCard title="Partneri" value={dashboardData.activePartners} icon={Users} />
                  <StatCard title="Obchody" value={dashboardData.openDeals} icon={Briefcase} />
                  <StatCard title="Nezaplatené" value={dashboardData.unpaidInvoices} icon={FileText} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="h-[450px]"><SimpleBarChart title="Mesačné tržby" data={dashboardData.monthlyRevenue} /></div>
                  <div className="h-[450px]"><SimpleBarChart title="Počet obchodov" data={dashboardData.monthlyDeals} /></div>
                </div>
              </div>
            )}

            {activeTab === 'discovery' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 text-left">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10"><Zap className="w-32 h-32 text-white" /></div>
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-4 tracking-tight text-white">Flowii API Debugger</h2>
                    <p className="text-slate-400 font-medium leading-relaxed mb-8 max-w-xl">
                      Overte presnú cestu k dátam podľa Flowii dokumentácie. Odporúčaný prefix je <code>api/</code>.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Globe className="w-3 h-3 text-slate-500"/> URL Prefix</label>
                        <select 
                           value={urlPrefix} 
                           onChange={(e) => setUrlPrefix(e.target.value)}
                           className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                        >
                          <option value="api/">api/ (Zjednodušený)</option>
                          <option value="api/v1/">api/v1/ (Štandardný)</option>
                          <option value="">Žiadny prefix</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 text-left"><Layers className="w-3 h-3 text-slate-500"/> Endpoint</label>
                        <input 
                          type="text"
                          value={discoveryEndpoint}
                          onChange={(e) => setDiscoveryEndpoint(e.target.value)}
                          className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                          placeholder="napr. partners/index"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={runDiscovery}
                      disabled={discoveryLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg active:scale-95 text-white uppercase text-xs tracking-widest"
                    >
                      {discoveryLoading ? <RefreshCw className="w-5 h-5 animate-spin text-white" /> : <Send className="w-5 h-5 text-white" />}
                      Otestovať Spojenie
                    </button>
                  </div>
                </div>

                {discoveryResult && (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm text-left">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4 text-left">
                        <div className={`p-3 rounded-2xl ${discoveryResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><Database className="w-6 h-6" /></div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold text-slate-900">Výsledok Odpovede</h3>
                          <p className="text-slate-400 text-xs font-mono">{discoveryResult.attemptedFullUrl}</p>
                        </div>
                      </div>
                      <div className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest ${discoveryResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>STATUS: {discoveryResult.status}</div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-tighter text-left"><Code className="w-4 h-4" /> Odpoveď zo Servera</div>
                      <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden shadow-2xl border border-slate-800">
                        {discoveryResult.isHtml ? (
                           <div className="space-y-4 text-left">
                              <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase"><Info className="w-3 h-3" /> HTML CHYBA (Zlé URL)</div>
                              <div className="text-slate-500 text-[10px] font-mono break-all opacity-50">{discoveryResult.payload?.raw}</div>
                           </div>
                        ) : (
                          <pre className="text-emerald-400 text-[11px] font-mono overflow-auto max-h-[500px] leading-relaxed text-left">
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
        </div>
      </main>

      {/* MODAL NASTAVENÍ */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 space-y-10 animate-in zoom-in-95 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nastavenia API</h3>
              <button onClick={() => setShowSettings(false)} className="p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-10 text-left">
              <div className="space-y-5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">Flowii API Token</label>
                <input
                  type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Vložte váš tajný kľúč..."
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono shadow-inner text-slate-900"
                />
              </div>
              <div className="flex flex-col gap-4 pt-4">
                <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all uppercase text-xs tracking-widest shadow-lg active:scale-95">Synchronizovať</button>
                <button type="button" onClick={() => fetchFlowiiData('demo-key')} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-center">Pokračovať v Demo režime</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}