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
  const [useV1, setUseV1] = useState(false); 
  
  // Discovery tool state
  const [discoveryEndpoint, setDiscoveryEndpoint] = useState('partners/index');
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    revenue: 0, activePartners: 0, openDeals: 0, unpaidInvoices: 0,
    monthlyRevenue: [], monthlyDeals: []
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

  const runDiscovery = async () => {
    if (!apiKey) {
      setError("Najprv vložte API kľúč v nastaveniach.");
      return;
    }
    setDiscoveryLoading(true);
    setDiscoveryResult(null);

    const targetUrl = proxyUrl.includes('?') ? `${proxyUrl.split('?')[0]}?endpoint=${discoveryEndpoint}` : `${proxyUrl}?endpoint=${discoveryEndpoint}`;

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          useV1: useV1
        })
      });
      
      const status = response.status;
      const text = await response.text();
      let payload;
      let isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
      
      try { 
        payload = JSON.parse(text); 
      } catch (e) { 
        payload = { raw: text, parseError: "Odpoveď nie je JSON" }; 
      }

      setDiscoveryResult({
        status,
        success: response.ok,
        payload: payload,
        isHtml: isHtml,
        timestamp: new Date().toLocaleTimeString(),
        attemptedUrl: targetUrl,
        v1Status: useV1 ? "ZAPNUTÉ" : "VYPNUTÉ"
      });

    } catch (err) {
      setDiscoveryResult({ status: 'Error', success: false, payload: { error: err.message } });
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const fetchFlowiiData = async (key) => {
    if (!key) return;
    setLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
      const fetchRaw = async (endpoint) => {
        const url = `${proxyUrl}?endpoint=${endpoint}`;
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ useV1: false }) });
        const result = await res.json();
        if (!res.ok) throw new Error(`${endpoint}: ${res.status}`);
        return result;
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
      
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-72 transform transition-transform duration-500 ease-in-out z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block border-r border-slate-800 shadow-2xl`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg"><BarChart3 className="w-6 h-6" /></div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">FlowiiStats</span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X /></button>
        </div>

        <nav className="mt-8 px-6 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-bold tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-10 w-full px-6 text-center">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:bg-slate-800">
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Nastavenia API</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden text-left">
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 shrink-0">
          <button className="md:hidden p-2.5 bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(true)}><Menu /></button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{menuItems.find(i => i.id === activeTab)?.label}</h1>
          <button onClick={() => fetchFlowiiData(apiKey)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-50">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 text-left">
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
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-12 opacity-10"><Zap className="w-32 h-32 text-white" /></div>
                <div className="relative z-10 text-left">
                  <h2 className="text-3xl font-black mb-4 tracking-tight text-white text-left">Flowii API Debugger v2</h2>
                  <p className="text-slate-400 font-medium leading-relaxed mb-8 max-w-xl text-left">
                    Ak dostávate 500 s chybou "Unexpected token", Flowii vracia HTML chybu. Naše nové proxy to už nezrúti.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left text-left">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Globe className="w-3 h-3 text-slate-500 text-left"/> API Verzia</label>
                      <select 
                         value={useV1.toString()} 
                         onChange={(e) => setUseV1(e.target.value === "true")}
                         className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                      >
                        <option value="false">Štandardná (Bez /v1/)</option>
                        <option value="true">Verziovaná (Pridať /v1/)</option>
                      </select>
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 text-left text-left"><Layers className="w-3 h-3 text-slate-500 text-left"/> Endpoint</label>
                      <input 
                        type="text"
                        value={discoveryEndpoint}
                        onChange={(e) => setDiscoveryEndpoint(e.target.value)}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500 text-left"
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
                    Spustiť Test Pripojenia
                  </button>
                </div>
              </div>

              {discoveryResult && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 text-left">
                      <div className={`p-3 rounded-2xl ${discoveryResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><Database className="w-6 h-6" /></div>
                      <div className="text-left text-left">
                        <h3 className="text-xl font-bold text-left">Výsledok Odpovede</h3>
                        <p className="text-slate-400 text-sm font-medium text-left">Verzia v1: {discoveryResult.v1Status}</p>
                      </div>
                    </div>
                    <div className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest ${discoveryResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>STATUS: {discoveryResult.status}</div>
                  </div>

                  {(discoveryResult.status === 500 || discoveryResult.payload.parseError) && (
                    <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-100 rounded-[2rem] overflow-hidden text-left">
                       <div className="flex gap-4 items-start mb-4 text-left">
                          <Terminal className="w-8 h-8 text-amber-600 shrink-0 text-left" />
                          <div className="text-left text-left">
                             <h4 className="text-amber-900 font-black text-xl text-left">Proxy Server Havaroval (Záchrana)</h4>
                             <p className="text-amber-700 text-sm leading-relaxed text-left">
                               Váš skript <code>api/proxy.js</code> spadol, pretože sa snažil čítať chybové HTML od Flowii ako JSON. Prepíšte ho týmto odolnejším kódom:
                             </p>
                          </div>
                       </div>
                       <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden text-left">
                          <pre className="text-blue-300 text-[10px] font-mono leading-relaxed overflow-auto max-h-[300px] text-left">
{`export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;
  const { useV1 } = req.body || {};
  
  const baseUrl = useV1 ? 'https://api.flowii.com/api/v1/' : 'https://api.flowii.com/api/';
  const url = \`\${baseUrl}\${endpoint}\`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    let data;
    try { 
      data = JSON.parse(text); 
    } catch (e) { 
      data = { raw: text, error: 'Target returned non-JSON' }; 
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Proxy Fatal Error', message: error.message });
  }
}`}
                          </pre>
                       </div>
                    </div>
                  )}

                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-tighter text-left"><Code className="w-4 h-4 text-left" /> Odpoveď (JSON alebo HTML)</div>
                    <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden shadow-2xl text-left border border-slate-800">
                      {discoveryResult.isHtml ? (
                         <div className="space-y-4 text-left">
                            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase text-left text-left"><Info className="w-3 h-3 text-left" /> Pozor: Toto je HTML kód chyby, nie dáta!</div>
                            <div className="text-slate-500 text-[10px] font-mono break-all opacity-50 text-left">{discoveryResult.payload.raw}</div>
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
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 space-y-10 animate-in zoom-in-95 text-left text-left">
            <div className="flex items-center justify-between text-left">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight text-left text-left">Nastavenia API</h3>
              <button onClick={() => setShowSettings(false)} className="p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-left"><X className="text-left text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-10 text-left text-left">
              <div className="space-y-5 text-left text-left text-left">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest text-left text-left text-left text-left">Flowii API Token</label>
                <input
                  type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Vložte tajný kľúč..."
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono shadow-inner text-slate-900 text-left"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all uppercase text-xs tracking-widest shadow-lg active:scale-95 text-white text-left">Synchronizovať</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}