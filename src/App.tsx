import { useState } from 'react';
import { Smartphone, MonitorPlay, Activity, HelpCircle, BookOpen, HardDriveUpload } from 'lucide-react';
import MobileAppEmulator from './components/MobileAppEmulator';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncTrigger, setSyncTrigger] = useState(0);
  
  // Tab control on smaller viewports
  const [activeLayout, setActiveLayout] = useState<'mobile' | 'admin'>('mobile');

  // Callback whenever the mobile emulator uploads records to the server
  const handleSyncCompleted = () => {
    setSyncTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      
      {/* Top Banner Branding Grid */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-lime-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-lime-500/10">
            🌳
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">EWS Sawit Suite</h1>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Sensus Hama & Early Warning System (Offline-Ready)</p>
          </div>
        </div>

        {/* Small Screen Layout Switcher */}
        <div className="flex lg:hidden bg-slate-900 border border-slate-800 p-1 rounded-lg gap-1">
          <button 
            onClick={() => setActiveLayout('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${activeLayout === 'mobile' ? 'bg-lime-500 text-gray-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Ponsel Emulator</span>
          </button>
          
          <button 
            onClick={() => setActiveLayout('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${activeLayout === 'admin' ? 'bg-lime-500 text-gray-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Dashboard Pusat</span>
          </button>
        </div>

        {/* Desktop guide indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-lime-400">
            <Activity className="w-4 h-4 text-lime-400 animate-pulse" />
            <span>Simulasi Sinkronisasi Aktif</span>
          </div>
        </div>
      </header>

      {/* Main Working Area Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Mobile App Emulator */}
        <div className={`lg:col-span-4 flex flex-col items-center justify-center ${activeLayout === 'mobile' ? 'block' : 'hidden lg:block'}`}>
          <div className="w-full max-w-[340px] space-y-2 mb-4 text-center lg:text-left">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-lime-400">Ponsel Mandiri Surveyor</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Interaksikan simulator android di bawah untuk login, memilih afdeling, mengambil selfie, menginput serangan, dan mensinkronisasikan LHM.
            </p>
          </div>
          
          <MobileAppEmulator 
            isOnline={isOnline} 
            setIsOnline={setIsOnline} 
            onSyncCompleted={handleSyncCompleted} 
          />
        </div>

        {/* Right Column: Central Dashboard HQ Admin */}
        <div className={`lg:col-span-8 flex flex-col h-full ${activeLayout === 'admin' ? 'block' : 'hidden lg:block'}`}>
          <div className="mb-4 space-y-1">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-400">MONITOR SEKTOR PUSAT KORPORASI</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Menampilkan data sensus yang telah berhasil disinkronkan oleh surveyor lapangan ke pusat. Sensus diperbarui secara instan.
            </p>
          </div>

          <AdminPortal 
            isOnline={isOnline} 
            syncTrigger={syncTrigger} 
          />
        </div>

      </main>

      {/* Guide Documentation Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 px-6 text-slate-400">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white uppercase text-[10px] tracking-wider">
              <BookOpen className="w-4 h-4 text-lime-500" />
              <span>Pendekatan Sensus Luring (Offline)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Aplikasi dirancang dengan pendekatan <b>Offline-First</b>. Saat surveyor berada di dalam blok kebun sawit tanpa sinyal seluler, ponsel android menyimpan seluruh data RKH dan detail pohon sawit di database lokal.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white uppercase text-[10px] tracking-wider">
              <HardDriveUpload className="w-4 h-4 text-blue-400" />
              <span>Sinkronisasi Data Dua Arah</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Uji ketahanan luring ini dengan mematikan toggle <b>Ponsel Online</b>. Anda dapat melakukan survey penuh, merekam status, menyelesaikan sesi, lalu mengaktifkan kembali toggle internet untuk melakukan unggah ke portal pusat.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white uppercase text-[10px] tracking-wider">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Simulasi Kamera & Satelit GPS</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tekan tombol kamera untuk menguji tangkapan selfie / bukti foto daun sawit berpenyakit, atau pilih salah satu template wajah/hama yang disediakan jika akses webcam browser Anda diblokir.
            </p>
          </div>

        </div>

        <div className="pt-6 mt-6 border-t border-slate-800/60 max-w-7xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-500">
          <span>© 2026 EWS Sawit - Sistem Peringatan Dini Kebun Sawit Utama Nusantara. All rights reserved.</span>
          <span className="font-mono text-slate-600">Built with Express.js + React + Leaflet Map WebView</span>
        </div>
      </footer>

    </div>
  );
}
