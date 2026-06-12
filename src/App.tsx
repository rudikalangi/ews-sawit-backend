import { useState } from 'react';
import { Activity, BookOpen, HardDriveUpload } from 'lucide-react';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncTrigger, setSyncTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      
      {/* Top Banner Branding Grid */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-lime-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-lime-500/10">
            🌳
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">EWS Sawit Admin</h1>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Portal Pemantauan Pusat Kebun</p>
          </div>
        </div>

        {/* Desktop guide indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-lime-400">
            <Activity className="w-4 h-4 text-lime-400 animate-pulse" />
            <span>Sistem Pemantauan Aktif</span>
          </div>
        </div>
      </header>

      {/* Main Working Area Panel */}
      <main className="flex-1 w-full p-4 lg:p-6 flex flex-col items-center">
        {/* Central Dashboard HQ Admin */}
        <div className="w-full flex flex-col h-full max-w-[1400px]">
          <div className="mb-4 space-y-1 text-center lg:text-left">
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
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white uppercase text-[10px] tracking-wider">
              <BookOpen className="w-4 h-4 text-lime-500" />
              <span>Pendekatan Sensus Luring (Offline)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Aplikasi mobile Android dirancang dengan pendekatan <b>Offline-First</b>. Saat surveyor berada di dalam blok kebun sawit tanpa sinyal seluler, ponsel android menyimpan seluruh data dan foto di penyimpanan lokal sebelum disinkronkan.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white uppercase text-[10px] tracking-wider">
              <HardDriveUpload className="w-4 h-4 text-blue-400" />
              <span>Sinkronisasi Data Realtime</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Admin Portal ini terhubung langsung dengan backend pusat. Setiap kali surveyor melakukan sinkronisasi dari aplikasi mobile Android, data dan foto hama akan langsung muncul di panel ini.
            </p>
          </div>

        </div>

        <div className="pt-6 mt-6 border-t border-slate-800/60 max-w-7xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-500">
          <span>© 2026 EWS Sawit - Sistem Peringatan Dini Kebun Sawit Utama Nusantara. All rights reserved.</span>
          <span className="font-mono text-slate-600">Built with Express.js + React + Leaflet Map</span>
        </div>
      </footer>

    </div>
  );
}
