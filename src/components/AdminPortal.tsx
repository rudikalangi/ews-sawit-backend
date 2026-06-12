import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, RefreshCw, MapPin, Eye, FileSpreadsheet, Layers, 
  Map as MapIcon, BarChart3, AlertTriangle, ShieldAlert, CheckCircle, Usb, Sliders, Info
} from 'lucide-react';
import { DashboardStats } from '../types';

declare const L: any; // Leaflet globally available from CDN

interface AdminPortalProps {
  isOnline: boolean;
  syncTrigger: number; // Trigger reload when mobile sync is completed
}

export default function AdminPortal({ isOnline, syncTrigger }: AdminPortalProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'reports' | 'config'>('overview');
  const [selectedMappingFilter, setSelectedMappingFilter] = useState<'all' | 'unhealthy' | 'healthy'>('all');
  const [focusedMarker, setFocusedMarker] = useState<any>(null);

  const leafletAdminMapRef = useRef<any>(null);
  const adminMapContainerRef = useRef<HTMLDivElement | null>(null);

  const [afdelings, setAfdelings] = useState<any[]>([]);

  // Fetch Dashboard Stats from Express Backend
  const fetchDashboardStats = () => {
    setIsLoading(true);
    
    // Fetch stats
    fetch('https://ews-sawit-backend.onrender.com/api/admin/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data);
      })
      .catch(err => {
        console.error("Gagal menjangkau API Admin Dashboard:", err);
      });

    // Fetch resources
    fetch('https://ews-sawit-backend.onrender.com/api/sync/resources')
      .then(res => res.json())
      .then(data => {
        if (data.afdelings) {
          setAfdelings(data.afdelings);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal menjangkau API Resources:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [syncTrigger]);

  // Handle Map Initialization and updating markers
  useEffect(() => {
    if (activeTab === 'map' && adminMapContainerRef.current && stats) {
      setTimeout(() => {
        if (!adminMapContainerRef.current) return;

        // Clean up previous map if any
        if (leafletAdminMapRef.current) {
          try { leafletAdminMapRef.current.remove(); } catch (e) {}
        }

        // Center map around general afdeling centers
        const lat = -1.258;
        const lng = 101.425;

        const map = L.map(adminMapContainerRef.current).setView([lat, lng], 14);
        leafletAdminMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        // Dynamic boundaries polygons for Afdelings
        const colors = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#8b5cf6'];
        
        // Draw boundaries for all Afdelings as overlay indicators
        afdelings.forEach((afd, index) => {
          const color = colors[index % colors.length];
          const c = [afd.centerLat || -1.258, afd.centerLng || 101.425];
          const latOffset = 0.004;
          const lngOffset = 0.004;
          
          const coords = [
            [c[0] - latOffset, c[1] - lngOffset],
            [c[0] + latOffset, c[1] - lngOffset],
            [c[0] + latOffset, c[1] + lngOffset],
            [c[0] - latOffset, c[1] + lngOffset]
          ];

          L.polygon(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '3, 4'
          }).addTo(map).bindPopup(`<b>${afd.name}</b> Boundary`);
        });

        // Filter and add tree markers
        const markersList = stats.treeMarkers || [];
        
        let counter = 0;
        markersList.forEach(m => {
          const isHealthy = !m.hasDamage;
          
          if (selectedMappingFilter === 'unhealthy' && isHealthy) return;
          if (selectedMappingFilter === 'healthy' && !isHealthy) return;

          const color = isHealthy ? '#10b981' : '#ef4444';
          const symbolIcon = isHealthy ? '✓' : '⚠️';

          // Visual Custom popup content with image if attached
          const imageHtml = m.buktiFoto 
            ? `<div class="mt-2 text-center">
                 <img src="${m.buktiFoto}" alt="damage proof" style="max-height: 80px; max-width: 130px; object-fit: cover; border-radius: 4px;" referrerPolicy="no-referrer" />
               </div>`
            : `<p class="text-xs text-slate-400 mt-1 style="font-style: italic;">Lampiran bukti foto: Kosong</p>`;

          const customPopup = `
            <div style="font-family: inherit; width: 140px;">
              <h5 style="margin: 0; font-size: 11px; font-weight: bold; color: #0f172a;">
                Row ${m.rowNumber} - Pokok ${m.treeNumber}
              </h5>
              <p style="margin: 1px 0; font-size: 9px; color: #64748b; font-family: monospace;"><b>Block:</b> ${m.blockId}</p>
              <p style="margin: 1px 0; font-size: 9px; color: ${isHealthy ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                ${symbolIcon} ${isHealthy ? 'Tanaman Sehat' : 'Tanaman Terserang'}
              </p>
              ${m.hasDamage ? `<p style="margin: 1px 0; font-size: 9px; color: #475569;"><b>Hama:</b> ${m.damageSummary.join(', ')}</p>` : ''}
              ${imageHtml}
              <p style="margin: 3px 0 0; font-size: 8px; color: #94a3b8; font-family: monospace;">GPS: ${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}</p>
            </div>
          `;

          const pinMarker = L.circleMarker([m.lat, m.lng], {
            radius: isHealthy ? 6 : 8,
            fillColor: color,
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 0.95
          }).addTo(map).bindPopup(customPopup);

          counter++;

          // Focus single marker if selected
          if (focusedMarker && focusedMarker.id === m.id) {
            map.setView([m.lat, m.lng], 16);
            pinMarker.openPopup();
          }
        });

      }, 150);
    }
  }, [activeTab, stats, selectedMappingFilter, focusedMarker, afdelings]);

  const triggerZoomOnMapMarker = (markerInfo: any) => {
    setFocusedMarker(markerInfo);
    setSelectedMappingFilter('all');
    setActiveTab('map');
  };

  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4 flex-1">
        <RefreshCw className="w-8 h-8 text-lime-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Mengkalkulasikan data survey pusat...</p>
      </div>
    );
  }

  // Calculate percentage of healthy vs damaged trees
  const healthyTreesCount = stats.totalTreesSurveyed - (stats.attackCounts.tikus + stats.attackCounts.tirataba + stats.attackCounts.ulatApi + stats.attackCounts.ulatKantung);
  const healthRatio = stats.totalTreesSurveyed > 0 
    ? Math.max(0, Math.min(100, Math.round((healthyTreesCount / stats.totalTreesSurveyed) * 100))) 
    : 100;

  // Layout color badges
  const damageTypes = [
    { label: 'Tikus (TK)', val: stats.attackCounts.tikus, color: 'bg-red-500', desc: 'Gigitan pelepah & buah' },
    { label: 'Tirataba (TR)', val: stats.attackCounts.tirataba, color: 'bg-amber-500', desc: 'Ulat pemakan bunga' },
    { label: 'Ulat Api (UA)', val: stats.attackCounts.ulatApi, color: 'bg-orange-500', desc: 'Ulat pengikis daun' },
    { label: 'Ulat Kantung (UK)', val: stats.attackCounts.ulatKantung, color: 'bg-purple-500', desc: 'Daun berlubang kering' }
  ];

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-200 shadow-xs flex flex-col flex-1 overflow-hidden h-[670px] font-sans">
      
      {/* Dashboard Top Header Navigation tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-lime-100 text-lime-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">EWS Survey Admin</span>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-[10px] text-slate-400 font-mono">Telemetry: Online</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Portal Pemantauan Pusat Kebun</h1>
        </div>

        {/* Tab Switch buttons */}
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200 shrink-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>Kinerja</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('map'); setFocusedMarker(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <MapIcon className="w-4 h-4 text-blue-500" />
            <span>Peta Plotting</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Rekap LHM</span>
          </button>

          <button 
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'config' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Config DB</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB BODY */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        
        {/* TAB 1: OVERVIEW STATISTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Realtime KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-0.5">Sesi Survey Synced</span>
                <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalSurveys}</div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span>Sinkronisasi Aktif</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-0.5">Blok Dipetakan</span>
                <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalBlocksSurveyed}</div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <span>Sensus intensitas hama</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-0.5">Total Pokok Dinilai</span>
                <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalTreesSurveyed}</div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <span className="font-sans">Sesuai sampling koordinat</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-0.5">Health Ratio Sawit</span>
                <div className="text-2xl font-black text-slate-900 font-mono text-emerald-600">
                  {healthRatio}%
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <span className="font-sans">Tanaman sehat tanpa serangan</span>
                </div>
              </div>
            </div>

            {/* Main charts and breakdown columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Damage distribution block */}
              <div className="lg:col-span-1 p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span>Breakdown Serangan Hama</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal pt-1 mb-4">
                    Statistik akumulasi infeksi pelepah sawit di kebun yang dilaporkan para surveyor.
                  </p>
                </div>

                <div className="space-y-3.5 flex-1">
                  {damageTypes.map((t, idx) => {
                    const ratio = stats.totalTreesSurveyed > 0 ? (t.val / stats.totalTreesSurveyed) : 0;
                    const percent = Math.min(100, Math.round(ratio * 100));
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{t.label}</span>
                            <span className="text-[9px] text-slate-400 block leading-tight">{t.desc}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">{t.val} pokok ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`${t.color} h-full transition-all duration-300`} style={{ width: `${percent || 4}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] leading-normal text-slate-500 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>Prioritaskan penanganan pada blok dengan tingkat serangan ulat api melebihi ambang batas ekonomi kebun 5%.</span>
                </div>
              </div>

              {/* Graphic Daily trend with standard premium SVG lines (Extremely robust under React 19) */}
              <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-lime-600" />
                    <span>Tren Perkembangan Serangan</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal pt-1">
                    Insidensi harian serangan Tikus, Tirataba, dan Ulat Api selama 7 hari pencatatan terakhir.
                  </p>
                </div>

                {/* SVG Chart construction */}
                <div className="h-[220px] w-full pt-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Chart Paths */}
                    {/* Tick trend path: Tikus (Red) */}
                    <path 
                      d={`M ${stats.attackTrend.map((t, i) => `${40 + i * 70}, ${170 - (t.tikus * 8)}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="2" 
                    />
                    {stats.attackTrend.map((t, i) => (
                      <circle key={`tikus-${i}`} cx={40 + i * 70} cy={170 - (t.tikus * 8)} r="3" fill="#ef4444" />
                    ))}

                    {/* Tirataba trend path (Orange) */}
                    <path 
                      d={`M ${stats.attackTrend.map((t, i) => `${40 + i * 70}, ${170 - (t.tirataba * 8)}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="2" 
                    />
                    {stats.attackTrend.map((t, i) => (
                      <circle key={`tr-${i}`} cx={40 + i * 70} cy={170 - (t.tirataba * 8)} r="3" fill="#f59e0b" />
                    ))}

                    {/* Ulat Api trend path (Purple) */}
                    <path 
                      d={`M ${stats.attackTrend.map((t, i) => `${40 + i * 70}, ${170 - (t.ulatApi * 8)}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="2" 
                    />
                    {stats.attackTrend.map((t, i) => (
                      <circle key={`ua-${i}`} cx={40 + i * 70} cy={170 - (t.ulatApi * 8)} r="3" fill="#a855f7" />
                    ))}
                  </svg>

                  {/* SVG Legends and X-Axis labels */}
                  <div className="absolute inset-x-0 bottom-0 px-2 flex justify-between text-[8px] font-mono text-slate-400 pl-[40px] pr-[15px]">
                    {stats.attackTrend.map((t, i) => (
                      <span key={i}>{t.date}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 justify-center items-center text-[10px] pt-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-slate-600 font-sans">Tikus (TK)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600 font-sans">Tirataba (TR)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-slate-600 font-sans">Ulat Api (UA)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GEOLOCATION / MAP PLOTTING OF SYNCED TREES */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white border border-slate-200 rounded-xl gap-2 text-xs">
              <div className="flex gap-2 items-center">
                <Layers className="w-4.5 h-4.5 text-blue-500" />
                <span className="font-bold text-slate-800">Filter Visualisasi Pokok:</span>
              </div>
              
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                  onClick={() => setSelectedMappingFilter('all')}
                  className={`px-3 py-1 rounded font-medium ${selectedMappingFilter === 'all' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Semua Pokok ({stats.treeMarkers.length})
                </button>
                <button 
                  onClick={() => setSelectedMappingFilter('unhealthy')}
                  className={`px-3 py-1 rounded font-medium ${selectedMappingFilter === 'unhealthy' ? 'bg-red-500 text-white shadow-3xs' : 'text-slate-500 hover:text-red-500'}`}
                >
                  Serangan ({stats.treeMarkers.filter(m => m.hasDamage).length})
                </button>
                <button 
                  onClick={() => setSelectedMappingFilter('healthy')}
                  className={`px-3 py-1 rounded font-medium ${selectedMappingFilter === 'healthy' ? 'bg-emerald-600 text-white shadow-3xs' : 'text-slate-500 hover:text-emerald-600'}`}
                >
                  Sehat ({stats.treeMarkers.filter(m => !m.hasDamage).length})
                </button>
              </div>
            </div>

            {/* LEAFLET HTML CONTAINER */}
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-100">
              <div ref={adminMapContainerRef} className="w-full h-[450px]" style={{ zIndex: 1 }} />
              
              {/* Map Floating instructions corner */}
              <div className="absolute bottom-4 right-4 bg-white/95 border border-slate-200 rounded-lg p-3 shadow-md max-w-[200px] text-[10px] leading-relaxed z-10 text-slate-600">
                <span className="font-bold text-slate-900 block mb-1">Panduan Peta:</span>
                • Bulatan <span className="text-red-500 font-bold">Merah</span> menandakan kelapa sawit terjangkit hama.<br/>
                • Bulatan <span className="text-green-600 font-bold">Hijau</span> menandakan sampel sawit sehat.<br/>
                • Klik marker untuk melihat bukti foto, baris tanaman, dan koordinat satelit yang dicatat.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VERIFIED LHM SHEETS TABLE REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest block">Daftar Lembar Hasil Mingguan (LHM)</span>
              <span className="bg-lime-100 text-lime-800 font-bold px-2.5 py-1 rounded text-[10px] uppercase">
                {stats.recentSurveys.length} Dokumen Synced
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold">
                    <th className="p-4 uppercase">ID Sesi</th>
                    <th className="p-4 uppercase">Surveyor</th>
                    <th className="p-4 uppercase">Afdeling</th>
                    <th className="p-4 uppercase">Blok</th>
                    <th className="p-4 uppercase">Tanggal</th>
                    <th className="p-4 uppercase">Tanaman Positif Hama</th>
                    <th className="p-4 uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 leading-normal text-slate-700">
                  {stats.recentSurveys.length > 0 ? (
                    stats.recentSurveys.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">{s.id.substring(0, 12)}...</td>
                        <td className="p-4 font-semibold text-slate-900 flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-slate-100 text-slate-600 border border-slate-200 rounded-full flex items-center justify-center font-bold text-[10px]">
                            {s.surveyorName[0]}
                          </div>
                          <span>{s.surveyorName}</span>
                        </td>
                        <td className="p-4 font-bold">{s.afdelingName}</td>
                        <td className="p-4 font-mono">{s.blockName}</td>
                        <td className="p-4 text-slate-500">{s.tanggal}</td>
                        <td className="p-4">
                          {s.damageCount > 0 ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-black font-mono">
                              {s.damageCount} POKOK TERSERANG
                            </span>
                          ) : (
                            <span className="bg-[#f0fdf4] text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                              Sehat/Bersih
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => {
                              // Focus tree and draw
                              const associatedTree = stats.treeMarkers.find(t => t.blockId === s.blockName);
                              if (associatedTree) {
                                triggerZoomOnMapMarker(associatedTree);
                              } else {
                                setActiveTab('map');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg hover:text-blue-800 font-bold transition-all active:scale-[0.98]"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Plot Peta</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Belum ada rekap LHM kelapa sawit yang diunggah ke server.
                        Silahkan klik 'Mulai Upload' pada handphone emulator.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE CONFIGURATOR & CLOUD SETUP GUIDE */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Database className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Koneksi Database PostgreSQL & Storage R2</h3>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Aplikasi ini mendukung koneksi data ril ke <b>PostgreSQL (Neon DB)</b> untuk struktur database dan <b>Cloudflare R2 (S3 API)</b> untuk penyimpanan instan foto pelepah/selfie surveyor di sasis Cloud Run.
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-slate-900 text-slate-300 rounded-lg space-y-2 text-xs font-mono">
                  <div className="font-bold text-lime-400"># TELEMETRI SERVER SAAT INI</div>
                  <div>DATABASE_FALLBACK : <span className="text-amber-500 font-bold">{(!stats.totalSurveys && !process.env.DATABASE_URL) ? 'ACTIVE (File JSON database_fallback.json)' : 'INACTIVE (Running PG)'}</span></div>
                  <div>NEON_POSTGRESQL : <span className={process.env.DATABASE_URL ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{process.env.DATABASE_URL ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
                  <div>CLOUDFLARE_R2   : <span className={process.env.R2_BUCKET_NAME ? 'text-green-400 font-bold' : 'text-slate-400'}>{process.env.R2_BUCKET_NAME ? 'CONNECTED' : 'NOT CONFIGURED (Using Local Storage /uploads/)'}</span></div>
                </div>

                <div className="space-y-2 text-xs leading-normal text-slate-600">
                  <span className="font-bold text-slate-800 block">Langkah Menghubungkan Neon DB & R2:</span>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-500">
                    <li>Dapatkan <b>Connection String</b> dari dashboard PostgreSQL Neon DB milik Anda.</li>
                    <li>Dapatkan <b>Access Keys, Bucket Name, and Endpoint URL</b> dari portal Cloudflare R2 Storage.</li>
                    <li>Buka menu <b>Secrets/Settings Panel</b> di pojok kanan atas layar panel AI Studio.</li>
                    <li>Masukkan variable <code>DATABASE_URL</code> dan parameter <code>R2_BUCKET_NAME</code>... dll.</li>
                    <li>Server backend Express.js akan otomatis menginisialisasi migrasi tabel relasi SQL dan beralih dari database demo ke database ril Anda tanpa restart server!</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-start gap-2.5 rounded-xl text-xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Integrasi Migrasi Tabel Otomatis</span>
                <p className="text-emerald-700/95 leading-normal mt-0.5">
                  Express backend kami dilengkapi modul DDL parser otomatis yang langsung mendeteksi ketiadaan tabel di database Neon DB Anda pada detak pertama koneksi, lalu memicu pembentukan query <code>CREATE TABLE IF NOT EXISTS</code> untuk surveyor, afdeling, blok, sesi survey, dan data pokok sawit secara mulus.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
