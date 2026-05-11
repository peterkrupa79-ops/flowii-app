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
  Menu
} from 'lucide-react';

// --- KOMPONENTY PRE GRAFY ---

const SimpleBarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">{title}</h3>
      <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto">
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="relative flex justify-center w-full h-full items-end">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                  {item.value.toLocaleString('sk-SK')} €
                </div>
                {/* Bar */}
                <div 
                  className="w-full max-w-[40px] bg-blue-500 rounded-t-md transition-all duration-500 ease-out group-hover:bg-blue-600"
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                ></div>
              </div>
              <span className="text-xs text-slate-500 mt-2 rotate-45 origin-left md:rotate-0 md:origin-center">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      {trend && (
        <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
          <span>{trendValue} oproti min. mesiacu</span>
        </div>
      )}
    </div>
    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// --- HLAVNÁ APLIKÁCIA ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stav pre dáta
  const [dashboardData, setDashboardData] = useState({
    revenue: 0,
    activePartners: 0,
    openDeals: 0,
    unpaidInvoices: 0,
    monthlyRevenue: [],
    monthlyDeals: []
  });

  // Generovanie mock dát pre ukážku
  const generateMockData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    
    const mockMonthlyRevenue = months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map(month => ({
      label: month,
      value: Math.floor(Math.random() * 15000) + 5000
    }));

    const mockMonthlyDeals = months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map(month => ({
      label: month,
      value: Math.floor(Math.random() * 20) + 5
    }));

    return {
      revenue: mockMonthlyRevenue.reduce((acc, curr) => acc + curr.value, 0),
      activePartners: Math.floor(Math.random() * 500) + 100,
      openDeals: Math.floor(Math.random() * 50) + 10,
      unpaidInvoices: Math.floor(Math.random() * 15) + 2,
      monthlyRevenue: mockMonthlyRevenue,
      monthlyDeals: mockMonthlyDeals
    };
  };

  // Funkcia pre načítanie reálnych dát z Flowii API (cez našu novú serverless funkciu)
  const fetchFlowiiData = async (key) => {
    if (!key) return;
    
    setLoading(true);
    setError(null);

    // Ak ide o demo kľúč, rovno nahráme mock dáta
    if (key === 'demo-key') {
      setTimeout(() => {
        setDashboardData(generateMockData());
        setLoading(false);
      }, 500);
      return;
    }
    
    try {
      const headers = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Využívame našu novú vlastnú Vercel Serverless funkciu zo zložky /api/
      // URL vyzerá takto: /api/proxy?endpoint=partners
      
      const [partnersRes, invoicesRes, dealsRes] = await Promise.all([
        fetch(`/api/proxy?endpoint=partners`, { headers }),
        fetch(`/api/proxy?endpoint=invoices`, { headers }),
        fetch(`/api/proxy?endpoint=opportunities`, { headers })
      ]);

      if (!partnersRes.ok || !invoicesRes.ok || !dealsRes.ok) {
        throw new Error(`Chyba API. Skontrolujte prosím, či je váš API kľúč platný a či máte práva.`);
      }

      const partners = await partnersRes.json();
      const invoices = await invoicesRes.json();
      const deals = await dealsRes.json();

      // Flowii štandardne ukladá zoznamy do poľa "data"
      const partnersList = partners.data || [];
      const invoicesList = invoices.data || [];
      const dealsList = deals.data || [];

      // Spočítanie reálnych tržieb (z faktúr)
      const totalRevenue = invoicesList.reduce((acc, inv) => acc + (parseFloat(inv.totalPrice) || 0), 0);
      // Spočítanie neuhradených faktúr
      const unpaid = invoicesList.filter(inv => inv.paymentStatus !== 'paid').length;

      setDashboardData({
        revenue: totalRevenue || generateMockData().revenue, // fallback ak sú dáta prázdne
        activePartners: partnersList.length || generateMockData().activePartners,
        openDeals: dealsList.length || generateMockData().openDeals,
        unpaidInvoices: unpaid || generateMockData().unpaidInvoices,
        monthlyRevenue: generateMockData().monthlyRevenue, // Tieto dáta zatiaľ používajú mock
        monthlyDeals: generateMockData().monthlyDeals      
      });
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Nastala neznáma chyba pri komunikácii so serverom.');
      // Ak nastane chyba, ukážeme aspoň demo dáta, aby neostala prázdna obrazovka
      setDashboardData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Načítanie demo dát pri prvom štarte
    fetchFlowiiData('demo-key');
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setShowSettings(false);
    fetchFlowiiData(apiKey || 'demo-key');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Prehľad', icon: LayoutDashboard },
    { id: 'invoices', label: 'Faktúry', icon: FileText },
    { id: 'partners', label: 'Partneri', icon: Users },
    { id: 'deals', label: 'Obchody', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* SIDEBAR (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-64 transform transition-transform duration-300 ease-in-out z-20 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-wide">Flowii<span className="font-light">Stats</span></span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <button 
            onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Nastavenia API</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY PRE MOBILNÉ MENU */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* HLAVNÝ OBSAH */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold capitalize text-slate-800">
              {menuItems.find(i => i.id === activeTab)?.label || 'Prehľad'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {!apiKey && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Ukážkové dáta
              </span>
            )}
            {apiKey && (
               <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200">
               <CheckCircle2 className="w-3.5 h-3.5" />
               API Pripojené
             </span>
            )}
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              TJ
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-red-800 font-medium">Chyba pri načítaní dát</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-500">Načítavam dáta z Flowii...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              
              {activeTab === 'dashboard' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                      title="Celkové tržby (vybrané obdobie)" 
                      value={`${dashboardData.revenue.toLocaleString('sk-SK')} €`} 
                      icon={DollarSign}
                      trend="up"
                      trendValue="+12%"
                    />
                    <StatCard 
                      title="Aktívni partneri" 
                      value={dashboardData.activePartners} 
                      icon={Users}
                      trend="up"
                      trendValue="+3%"
                    />
                    <StatCard 
                      title="Otvorené obchody" 
                      value={dashboardData.openDeals} 
                      icon={Briefcase}
                      trend="down"
                      trendValue="-2%"
                    />
                    <StatCard 
                      title="Nezaplatené faktúry" 
                      value={dashboardData.unpaidInvoices} 
                      icon={FileText}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80">
                      <SimpleBarChart 
                        title="Vývoj tržieb (Faktúry)" 
                        data={dashboardData.monthlyRevenue} 
                      />
                    </div>
                    <div className="h-80">
                      <SimpleBarChart 
                        title="Nové obchodné príležitosti" 
                        data={dashboardData.monthlyDeals} 
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab !== 'dashboard' && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <LayoutDashboard className="w-10 h-10 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Sekcia {menuItems.find(i => i.id === activeTab)?.label}</h2>
                  <p className="text-slate-500 max-w-md">
                    Táto sekcia bude obsahovať detailné tabuľky a špecifické grafy pre danú agendu z Flowii.
                    Zatiaľ je prístupný hlavný prehľad.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Nastavenie Flowii API</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1">
                    API Kľúč
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Vložte váš Flowii API kľúč"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Kľúč zostáva bezpečne uložený vo vašom prehliadači a komunikuje cez Vercel server.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Uložiť a načítať dáta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}