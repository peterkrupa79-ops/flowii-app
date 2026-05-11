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
  Code
} from 'lucide-react';

// --- KOMPONENTY PRE GRAFY ---

const SimpleBarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
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

  // Sem si uložíme úplne všetko, čo nám Flowii pošle (na kontrolu)
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
      revenue: 12500, activePartners: 142, openDeals: 12, unpaidInvoices: 5,
      monthlyRevenue: mockRev,
      monthlyDeals: mockRev.map(m => ({ label: m.label, value: Math.floor(m.value / 1000) }))
    };
  };

  const fetchFlowiiData = async (key) => {
    if (!key) return;
    
    setLoading(true);
    setError(null);

    try {
      const headers = {
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json'
      };

      // Zmenil som URL na /api/proxy?endpoint=... pretože vercel.json ste zmazali
      const fetchRaw = async (endpoint) => {
        const response = await fetch(`/api/proxy?endpoint=${endpoint}`, { headers });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Chyba pri načítaní ${endpoint}`);
        return result;
      };

      // Stiahneme VŠETKO naraz
      const [partners, invoices, opportunities] = await Promise.all([
        fetchRaw('partners'),
        fetchRaw('invoices'),
        fetchRaw('opportunities')
      ]);

      // Uložíme si surové dáta, aby sme ich videli v "Prieskumníkovi"
      setRawData({ partners, invoices, opportunities });

      // Tu spracujeme stiahnuté dáta pre dashboard
      const partnersList = partners.data || [];
      const invoicesList = invoices.data || [];
      const dealsList = opportunities.data || [];

      const totalRevenue = invoicesList.reduce((acc, inv) => acc + (parseFloat(inv.totalPrice) || 0), 0);
      const unpaidCount = invoicesList.filter(inv => inv.paymentStatus !== 'paid').length;

      setDashboardData({
        revenue: totalRevenue,
        activePartners: partnersList.length,
        openDeals: dealsList.length,
        unpaidInvoices: unpaidCount,
        monthlyRevenue: generateMockData().monthlyRevenue, // Zatiaľ mock, kým neuvidíme formát dátumov
        monthlyDeals: generateMockData().monthlyDeals
      });
      
    } catch (err) {
      console.error(err);
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
    { id: 'explorer', label: 'Prieskumník dát', icon: Database },
    { id: 'invoices', label: 'Faktúry', icon: FileText },
    { id: 'partners', label: 'Partneri', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-72 transform transition-transform duration-500 ease-in-out z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block border-r border-slate-800 shadow-2xl`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2.5 bg-blue-600 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">Flowii<span className="text-blue-500 not-italic">Stats</span></span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X /></button>
        </div>

        <nav className="mt-8 px-6 space-y-2">
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
              <span className="font-bold tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-10 w-full px-6">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-800/40 text-slate-300 border border-slate-700/50">
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Nastavenia API</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 shrink-0">
          <button className="md:hidden p-2.5 bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(true)}><Menu /></button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{menuItems.find(i => i.id === activeTab)?.label}</h1>
          
          <div className="flex items-center gap-6">
            {!apiKey ? (
              <div className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-black border border-amber-100 animate-pulse">DEMO</div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-100 tracking-widest">LIVE</div>
            )}
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-blue-600 font-black shadow-sm">TJ</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12 space-y-12">
          
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-3xl flex items-start gap-6 shadow-sm">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-rose-900 font-black text-lg">Chyba synchronizácie</h3>
                <p className="text-rose-700 text-sm mt-1 font-semibold">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-16 h-16 border-[6px] border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm animate-pulse">Sťahujem Flowii dáta...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
              
              {activeTab === 'dashboard' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard title="Celkové tržby" value={`${dashboardData.revenue.toLocaleString('sk-SK')} €`} icon={DollarSign} trend="up" trendValue="+12.5%" />
                    <StatCard title="Partneri" value={dashboardData.activePartners} icon={Users} trend="up" trendValue="+24" />
                    <StatCard title="Obchody" value={dashboardData.openDeals} icon={Briefcase} trend="down" trendValue="-3" />
                    <StatCard title="Nezaplatené" value={dashboardData.unpaidInvoices} icon={FileText} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="h-[450px]"><SimpleBarChart title="Trend tržieb" data={dashboardData.monthlyRevenue} /></div>
                    <div className="h-[450px]"><SimpleBarChart title="Príležitosti" data={dashboardData.monthlyDeals} /></div>
                  </div>
                </div>
              )}

              {activeTab === 'explorer' && (
                <div className="space-y-8">
                  <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
                    <h2 className="text-2xl font-black mb-2">Surové dáta z Flowii</h2>
                    <p className="opacity-90">Tu vidíte presne to, čo nám posiela server. Pomôže nám to správne spárovať políčka do grafov.</p>
                  </div>
                  
                  {Object.entries(rawData).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Code className="w-5 h-5" /></div>
                        <h3 className="text-xl font-bold capitalize">Modul: {key}</h3>
                      </div>
                      <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden">
                        <pre className="text-emerald-400 text-xs font-mono overflow-auto max-h-[400px]">
                          {value ? JSON.stringify(value, null, 2) : "// Dáta nie sú načítané. Vložte API kľúč v nastaveniach."}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(activeTab === 'invoices' || activeTab === 'partners') && (
                <div className="bg-white rounded-[40px] border border-slate-100 p-24 text-center space-y-8 shadow-sm">
                   <LayoutDashboard className="w-12 h-12 text-slate-200 mx-auto" />
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sekcia {menuItems.find(i => i.id === activeTab)?.label}</h2>
                   <p className="text-slate-400 max-w-sm mx-auto font-bold leading-relaxed text-lg">Tu sa čoskoro zobrazia tabuľky.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-12 space-y-12 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nastavenia API</h3>
                <p className="text-slate-400 font-bold text-sm mt-1">Vložte svoj kľúč a aktivujte Prieskumníka</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100"><X /></button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-10">
              <div className="space-y-5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">Flowii API Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Vložte token..."
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 uppercase text-xs tracking-widest">Aktivovať spojenie</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}