import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Wifi, WifiOff, Battery, Compass, Camera, MapPin, CheckCircle, 
  ChevronRight, ChevronLeft, ArrowLeft, Eye, RefreshCw, LogOut, 
  Map as MapIcon, ClipboardList, Database, Plus, Trash2, Check, User 
} from 'lucide-react';
import { User as UserType, Afdeling, Blok, SurveySession, TreeSurvey } from '../types';

declare const L: any; // Leaflet globally available from CDN

interface MobileAppEmulatorProps {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  onSyncCompleted: () => void; // Trigger callback to refresh Admin Dashboard
}

// Simulated Face Avatar Presets for quick camera bypass
const SELFIE_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
];

// Simulated Damage Photo Presets for quick bypass
const DAMAGE_PRESETS = [
  "https://images.unsplash.com/photo-1602491453977-1b416fc95223?w=150&auto=format&fit=crop&q=80", // Mice damage/bark
  "https://images.unsplash.com/photo-1598514983318-29141990e9d9?w=150&auto=format&fit=crop&q=80", // Leaves damage
  "https://images.unsplash.com/photo-1505530902251-0a6230f80695?w=150&auto=format&fit=crop&q=80"  // Worm damage
];

export default function MobileAppEmulator({ isOnline, setIsOnline, onSyncCompleted }: MobileAppEmulatorProps) {
  // Device & Auth States
  const [screen, setScreen] = useState<'login' | 'sync_initial' | 'home' | 'rkh_pilih_afdeling' | 'rkh_pilih_blok' | 'rkh_selfie' | 'rkh_confirm' | 'rkh_survey_active' | 'lhm_upload'>('login');
  const [authSurveyor, setAuthSurveyor] = useState<UserType | null>(null);
  const [nikInput, setNikInput] = useState('123456');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sync Resource Master Data
  const [afdelings, setAfdelings] = useState<Afdeling[]>([]);
  const [blocks, setBlocks] = useState<Blok[]>([]);
  const [isDownloadingResources, setIsDownloadingResources] = useState(false);
  const [lastSyncedDate, setLastSyncedDate] = useState('24 Mei 2026 pukul 22.45');

  // RKH active session selections
  const [currentAfdelingIndex, setCurrentAfdelingIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selfiePhoto, setSelfiePhoto] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Active Survey States
  const [surveyTab, setSurveyTab] = useState<'peta' | 'form'>('form');
  const [surveySession, setSurveySession] = useState<SurveySession | null>(null);
  const [activeTrees, setActiveTrees] = useState<TreeSurvey[]>([]);
  const [activeRows, setActiveRows] = useState<Record<number, number[]>>({ 1: [1] });
  const [selectedSurveyTree, setSelectedSurveyTree] = useState<{ row: number; num: number; treeId?: string } | null>(null);
  const [isSurveyRunning, setIsSurveyRunning] = useState(false);
  
  // Individual Tree Edit Fields
  const [tikusAttack, setTikusAttack] = useState(false);
  const [tiratabaAttack, setTiratabaAttack] = useState(false);
  const [ulatApiAttack, setUlatApiAttack] = useState(false);
  const [ulatKantungAttack, setUlatKantungAttack] = useState(false);
  const [treePhoto, setTreePhoto] = useState<string | null>(null);
  const [treeLat, setTreeLat] = useState<number | null>(null);
  const [treeLng, setTreeLng] = useState<number | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // GPS Path simulation
  const [gpsPath, setGpsPath] = useState<[number, number][]>([]);
  const [simulatedDistance, setSimulatedDistance] = useState(0);
  const [simulatedTime, setSimulatedTime] = useState(0); // in seconds
  const [activeGpsInterval, setActiveGpsInterval] = useState<any>(null);

  // Bottom navigation tab state
  const [activeTab, setActiveTab] = useState<'beranda' | 'rkh' | 'lhm' | 'sinkron' | 'profil'>('beranda');

  // LHM list uploads (SQLite / localStorage simulation)
  const [localDrafts, setLocalDrafts] = useState<{ session: SurveySession; treeSurveys: TreeSurvey[] }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');

  // DOM Refs for maps and video
  const leafletMobileMapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load drafts on mount
  useEffect(() => {
    const drafts = localStorage.getItem('ews_local_drafts');
    if (drafts) {
      setLocalDrafts(JSON.parse(drafts));
    }
  }, []);

  // Save drafts helper
  const saveDraftsToStorage = (newDrafts: typeof localDrafts) => {
    setLocalDrafts(newDrafts);
    localStorage.setItem('ews_local_drafts', JSON.stringify(newDrafts));
  };

  // Fetch initial master data from database
  useEffect(() => {
    fetch('/api/sync/resources')
      .then(res => res.json())
      .then(data => {
        if (data.afdelings) setAfdelings(data.afdelings);
        if (data.blocks) setBlocks(data.blocks);
      })
      .catch(err => console.error("Could not fetch sync resources", err));
  }, []);

  // Timer counter for active survey
  useEffect(() => {
    let interval: any = null;
    if (isSurveyRunning) {
      interval = setInterval(() => {
        setSimulatedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSurveyRunning]);

  // Leaflet map renderer for small mobile tab view
  useEffect(() => {
    if (screen === 'rkh_survey_active' && surveyTab === 'peta' && mapContainerRef.current) {
      const activeAfd = afdelings[currentAfdelingIndex] || { centerLat: -1.258, centerLng: 101.425 };
      
      // Delay slightly for render bounding boxes
      setTimeout(() => {
        if (!mapContainerRef.current) return;
        
        // Remove existing map if any
        if (leafletMobileMapRef.current) {
          try { leafletMobileMapRef.current.remove(); } catch(e){}
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([activeAfd.centerLat, activeAfd.centerLng], 15);
        
        leafletMobileMapRef.current = map;

        // Offline Tile simulation or standard map stylesheet
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(map);

        // Draw boundaries for current block
        const block = blocks.find(b => b.id === selectedBlockId);
        if (block) {
          const center = [activeAfd.centerLat, activeAfd.centerLng];
          const offsetLat = 0.003;
          const offsetLng = 0.003;
          
          // Draw fake polygon bounds
          const polygonCoords = [
            [center[0] - offsetLat, center[1] - offsetLng],
            [center[0] + offsetLat, center[1] - offsetLng],
            [center[0] + offsetLat, center[1] + offsetLng],
            [center[0] - offsetLat, center[1] + offsetLng]
          ];

          L.polygon(polygonCoords, {
            color: '#84cc16',
            fillColor: '#84cc16',
            fillOpacity: 0.15,
            weight: 2
          }).addTo(map);
        }

        // Add GPS path line
        if (gpsPath.length > 1) {
          L.polyline(gpsPath, { color: '#ef4444', weight: 4, dashArray: '5, 8' }).addTo(map);
          // End tracker
          L.circleMarker(gpsPath[gpsPath.length - 1], {
            radius: 8,
            color: '#ffffff',
            fillColor: '#3b82f6',
            fillOpacity: 1,
            weight: 2
          }).addTo(map);
        }

        // Add tree markers with custom colors
        activeTrees.forEach(t => {
          let lat = t.gpsLatitude;
          let lng = t.gpsLongitude;

          if (!lat || !lng) {
            // Fake offset
            lat = activeAfd.centerLat + (t.rowNumber * 0.0003) - (t.treeNumber * 0.0001);
            lng = activeAfd.centerLng + (t.treeNumber * 0.0003) + (t.rowNumber * 0.0001);
          }

          const hasDamage = t.tikus || t.tirataba || t.ulatApi || t.ulatKantung;
          const color = hasDamage ? '#ef4444' : '#10b981';

          L.circle([lat, lng], {
            radius: 5,
            color: color,
            fillColor: color,
            fillOpacity: 0.8
          }).addTo(map)
            .bindPopup(`<b>Row ${t.rowNumber} - Tree ${t.treeNumber}</b><br/>Status: ${hasDamage ? 'Terserang' : 'Sehat'}`);
        });

      }, 150);
    }

    return () => {
      if (leafletMobileMapRef.current) {
        try { leafletMobileMapRef.current.remove(); leafletMobileMapRef.current = null; } catch(e){}
      }
    };
  }, [screen, surveyTab, gpsPath, activeTrees]);

  // LOGIN action with Express Backend
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: nikInput, password: passwordInput })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Autentikasi gagal!');
        return;
      }

      // Logged in successfully
      setAuthSurveyor({
        nik: data.nik,
        name: data.name,
        role: data.role
      });

      // Move to initial sync screen
      setScreen('sync_initial');

    } catch (err) {
      // Fallback offline login simulation if server is disconnected
      console.warn("Express server unreachable, using offline simulation:", err);
      // Let's allow access for demo NIKs offline directly
      if (nikInput === '123456' && passwordInput === 'admin123') {
        setAuthSurveyor({ nik: '123456', name: 'Budi Santoso', role: 'surveyor' });
        setScreen('sync_initial');
      } else {
        setLoginError('Koneksi server gagal & Akun offline tidak terdaftar!');
      }
    }
  };

  // Perform downloading resources download simulation
  const handleInitialResourcesDownload = () => {
    setIsDownloadingResources(true);
    let duration = 0;
    const interval = setInterval(() => {
      duration += 10;
      if (duration >= 100) {
        clearInterval(interval);
        setIsDownloadingResources(false);
        setScreen('home');
        setActiveTab('beranda');
        setLastSyncedDate(new Date().toLocaleString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }));
      }
    }, 150);
  };

  // Trigger resource update sync manually on Sync Tab click "Perbarui Data"
  const triggerManualSyncUpdate = () => {
    setIsDownloadingResources(true);
    let duration = 0;
    const interval = setInterval(() => {
      duration += 10;
      if (duration >= 100) {
        clearInterval(interval);
        setIsDownloadingResources(false);
        setLastSyncedDate(new Date().toLocaleString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }));
      }
    }, 200);
  };

  // CAMERA triggers helper
  const startCamera = async () => {
    setUseCamera(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Could not capture webcam, showing fast selfie presets instead.", err);
      setCameraError("Webcam browser diblokir. Pilih preset foto wajah di bawah ini.");
    }
  };

  const captureCameraPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirrored image
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        
        // Add watermark overlay
        ctx.scale(-1, 1);
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.fillText(`${new Date().toLocaleString('id-ID')}`, 10, canvas.height - 50);
        ctx.fillText(`GPS: -1.258123, 101.425121`, 10, canvas.height - 35);
        ctx.fillText(`AFD: ${afdelings[currentAfdelingIndex]?.id || 'A'} - BLK: ${selectedBlockId || 'J15'}`, 10, canvas.height - 20);

        setSelfiePhoto(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    } else {
      // Pick random preset
      selectSelfiePreset(0);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setUseCamera(false);
  };

  const selectSelfiePreset = (index: number) => {
    setSelfiePhoto(SELFIE_PRESETS[index]);
    setUseCamera(false);
  };

  // GPS Path Walking simulator
  const startGpsTrackingSimulation = (startLat: number, startLng: number) => {
    if (activeGpsInterval) clearInterval(activeGpsInterval);

    let path: [number, number][] = [[startLat, startLng]];
    setGpsPath(path);
    setSimulatedDistance(0);

    const interval = setInterval(() => {
      setGpsPath(prevPath => {
        const lastPt = prevPath[prevPath.length - 1] || [startLat, startLng];
        // Move slightly random
        const nextLat = lastPt[0] + (Math.random() - 0.45) * 0.0003;
        const nextLng = lastPt[1] + (Math.random() - 0.45) * 0.0003;
        const newPath = [...prevPath, [nextLat, nextLng] as [number, number]];

        // Update simulated distance
        setSimulatedDistance(prevDist => prevDist + Math.floor(15 + Math.random() * 10));
        return newPath;
      });
    }, 2500);

    setActiveGpsInterval(interval);
  };

  // INITIALIZE active survey session (After Selfie capture & Session Confirmation)
  const beginSurveySession = () => {
    const activeAfd = afdelings[currentAfdelingIndex];
    if (!activeAfd || !selectedBlockId) return;

    const block = blocks.find(b => b.id === selectedBlockId) || { luasHa: 20, totalTrees: 150 };

    const newSession: SurveySession = {
      id: `SES_${Date.now()}`,
      surveyorNik: authSurveyor?.nik || '123456',
      surveyorName: authSurveyor?.name || 'Budi Santoso',
      afdelingId: activeAfd.id,
      blockId: selectedBlockId,
      luasHa: block.luasHa,
      jumlahPokok: block.totalTrees,
      tanggal: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      waktuMulai: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      selfieUrl: selfiePhoto,
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    setSurveySession(newSession);
    setActiveTrees([]);
    setActiveRows({ 1: [1] });
    setSimulatedDistance(0);
    setSimulatedTime(0);
    setScreen('rkh_survey_active');
    setSurveyTab('form');
    setIsSurveyRunning(true);

    // Initial GPS coords
    startGpsTrackingSimulation(activeAfd.centerLat, activeAfd.centerLng);
  };

  // Form modification triggers: add new tree on current row / add new row of trees
  const addNewTreeToRow = (rowNumber: number) => {
    setActiveRows(prev => {
      const currentTrees = prev[rowNumber] || [];
      const nextNum = currentTrees.length > 0 ? Math.max(...currentTrees) + 1 : 1;
      return {
        ...prev,
        [rowNumber]: [...currentTrees, nextNum]
      };
    });
  };

  const addNewRow = () => {
    setActiveRows(prev => {
      const rowNumbers = Object.keys(prev).map(Number);
      const nextRow = rowNumbers.length > 0 ? Math.max(...rowNumbers) + 1 : 1;
      return {
        ...prev,
        [nextRow]: [1]
      };
    });
  };

  // Open pop-up to survey an individual trees node (Pokok)
  const openTreeSurveyPopup = (row: number, num: number) => {
    const existing = activeTrees.find(t => t.rowNumber === row && t.treeNumber === num);
    
    if (existing) {
      setTikusAttack(existing.tikus);
      setTiratabaAttack(existing.tirataba);
      setUlatApiAttack(existing.ulatApi);
      setUlatKantungAttack(existing.ulatKantung);
      setTreePhoto(existing.buktiFoto || null);
      setTreeLat(existing.gpsLatitude || null);
      setTreeLng(existing.gpsLongitude || null);
    } else {
      setTikusAttack(false);
      setTiratabaAttack(false);
      setUlatApiAttack(false);
      setUlatKantungAttack(false);
      setTreePhoto(null);
      setTreeLat(null);
      setTreeLng(null);
    }
    
    setSelectedSurveyTree({ row, num, treeId: existing?.id });
  };

  // Get Simulated GPS Coordinates
  const getSimulatedCoordinates = () => {
    setIsFetchingGps(true);
    setTimeout(() => {
      const activeAfd = afdelings[currentAfdelingIndex] || { centerLat: -1.258, centerLng: 101.425 };
      // Distribute around center slightly offset
      const latOffset = (selectedSurveyTree?.row || 1) * 0.0003 - (selectedSurveyTree?.num || 1) * 0.0001;
      const lngOffset = (selectedSurveyTree?.num || 1) * 0.0003 + (selectedSurveyTree?.row || 1) * 0.0001;
      
      setTreeLat(parseFloat((activeAfd.centerLat + latOffset).toFixed(6)));
      setTreeLng(parseFloat((activeAfd.centerLng + lngOffset).toFixed(6)));
      setIsFetchingGps(false);
    }, 600);
  };

  // Save specific tree feedback "Selesai Survey Pokok"
  const saveTreeSurveyDetails = () => {
    if (!selectedSurveyTree || !surveySession) return;

    const row = selectedSurveyTree.row;
    const num = selectedSurveyTree.num;
    const treeId = selectedSurveyTree.treeId || `TREE_${surveySession.id}_${row}_${num}`;

    // Auto-capture GPS coordinate if missing
    let finalLat = treeLat;
    let finalLng = treeLng;
    if (!finalLat || !finalLng) {
      const activeAfd = afdelings[currentAfdelingIndex];
      const latOffset = row * 0.0003 - num * 0.0001;
      const lngOffset = num * 0.0003 + row * 0.0001;
      finalLat = parseFloat((activeAfd.centerLat + latOffset).toFixed(6));
      finalLng = parseFloat((activeAfd.centerLng + lngOffset).toFixed(6));
    }

    const newTreeSurvey: TreeSurvey = {
      id: treeId,
      sessionId: surveySession.id,
      rowNumber: row,
      treeNumber: num,
      tikus: tikusAttack,
      tirataba: tiratabaAttack,
      ulatApi: ulatApiAttack,
      ulatKantung: ulatKantungAttack,
      buktiFoto: treePhoto || undefined,
      gpsLatitude: finalLat,
      gpsLongitude: finalLng,
      createdAt: new Date().toISOString()
    };

    setActiveTrees(prev => {
      const filtered = prev.filter(t => t.id !== treeId);
      return [...filtered, newTreeSurvey];
    });

    setSelectedSurveyTree(null);
  };

  // COMPLETE entire active survey session "Selesai" (Saves Draft locally)
  const finishActiveSurveySession = () => {
    if (!surveySession) return;

    if (activeGpsInterval) {
      clearInterval(activeGpsInterval);
      setActiveGpsInterval(null);
    }

    setIsSurveyRunning(false);

    // Assembly completion session
    const finalSession: SurveySession = {
      ...surveySession,
      gpsPath: gpsPath,
      jumlahPokok: activeTrees.length // Real surveyed pokok count
    };

    const newDraft = {
      session: finalSession,
      treeSurveys: activeTrees
    };

    saveDraftsToStorage([newDraft, ...localDrafts]);

    // Go back to RKH tab as defined in guidelines step 6
    setScreen('home');
    setActiveTab('rkh');
    setSurveySession(null);
  };

  // Cancel Survey entirely
  const cancelActiveSurvey = () => {
    if (confirm("Apakah anda yakin ingin membatalkan survey ini? Semua data yang belum dikonfirmasi akan hilang.")) {
      if (activeGpsInterval) {
        clearInterval(activeGpsInterval);
        setActiveGpsInterval(null);
      }
      setIsSurveyRunning(false);
      setSurveySession(null);
      setScreen('home');
      setActiveTab('rkh');
    }
  };

  // UPLOAD DRAFTS manually from LHM tab "Mulai Upload" to central API
  const uploadDraftsToServer = async () => {
    if (localDrafts.length === 0) return;

    if (!isOnline) {
      alert("⚠️ Koneksi luring! Silahkan aktifkan internet di atas smartphone untuk mensinkronkan data.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadMessage('Menyiapkan berkas rekap LHM...');

    const draftsToSync = [...localDrafts];
    let syncedSuccessCount = 0;

    for (let i = 0; i < draftsToSync.length; i++) {
      const draft = draftsToSync[i];
      setUploadProgress(20 + Math.floor((i / draftsToSync.length) * 50));
      setUploadMessage(`Mengupload Afdeling ${draft.session.afdelingId} - Blok ${draft.session.blockId} (${draft.treeSurveys.length} survey pokok, ${draft.treeSurveys.filter(t => t.buktiFoto).length} foto)...`);

      try {
        const response = await fetch('/api/sync/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session: draft.session,
            treeSurveys: draft.treeSurveys
          })
        });

        if (response.ok) {
          syncedSuccessCount++;
        } else {
          console.error("Server synchronization error code:", response.status);
        }
      } catch (err) {
        console.error("Sync uploaded error, assuming network block:", err);
      }
    }

    setUploadProgress(90);
    setUploadMessage('Menyelesaikan sinkronisasi server...');
    
    setTimeout(() => {
      setUploadProgress(100);
      setIsUploading(false);
      
      if (syncedSuccessCount === draftsToSync.length) {
        // Clear synced drafts
        saveDraftsToStorage([]);
        alert(`✅ Sukses! Berhasil mengunggah ${syncedSuccessCount} LHM rekap kerja ke database pusat!`);
      } else if (syncedSuccessCount > 0) {
        // Keep partial failed
        const remaining = draftsToSync.slice(syncedSuccessCount);
        saveDraftsToStorage(remaining);
        alert(`⚠️ Sinkronisasi sebagian: Berhasil mengupload ${syncedSuccessCount} dari ${draftsToSync.length} LHM.`);
      } else {
        alert("❌ Unggahan Gagal! Koneksi ke API error. Pastikan server lokal menyala.");
      }

      // Notify parent to refresh central map markers
      onSyncCompleted();
    }, 1200);
  };

  // LOGOUT
  const handleLogout = () => {
    if (confirm("Keluar dari akun survey?")) {
      setAuthSurveyor(null);
      setScreen('login');
    }
  };

  // Helper formatting clock timer
  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="smartphone-container" className="flex flex-col items-center select-none">
      {/* Network simulator controls at outer top layer */}
      <div className="w-full max-w-[340px] flex items-center justify-between p-2 rounded-t-2xl border-x-2 border-t-2 border-slate-700 bg-slate-900 shadow-lg text-xs text-slate-300">
        <label className="flex items-center gap-1 cursor-pointer font-medium text-[11px] select-none">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>Local Storage DB:</span>
          <span className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">
            {localDrafts.length} RKH Drafts
          </span>
        </label>
        
        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[11px] select-none">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
          <span>Ponsel Online:</span>
          <input 
            type="checkbox" 
            checked={isOnline} 
            onChange={(e) => setIsOnline(e.target.checked)}
            className="sr-only"
            id="network-checkbox"
          />
          <div className={`w-8 h-4 bg-slate-700 rounded-full p-0.5 transition-colors duration-200 relative ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${isOnline ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </label>
      </div>

      {/* Main Physical Phone Frame Body */}
      <div id="phone-shell" className="relative w-full max-w-[340px] h-[670px] bg-slate-950 border-4 border-slate-700 rounded-b-[40px] shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Notch Camera circle */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
        </div>

        {/* Dynamic Android Status Bar */}
        <div className="h-6 bg-slate-950 text-[10px] font-mono px-5 pt-1.5 flex items-center justify-between z-40 select-none">
          <span>09:53</span>
          <div className="flex items-center gap-1.5">
            {isOnline ? <Wifi className="w-3 h-3 text-white" /> : <WifiOff className="w-3 h-3 text-red-500" />}
            <Compass className="w-3 h-3 text-lime-400" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px]">98%</span>
              <Battery className="w-3.5 h-3.5 text-white fill-white stroke-none" />
            </div>
          </div>
        </div>

        {/* Content Screens Container */}
        <div id="phone-content" className="flex-1 overflow-y-auto bg-[#030712] flex flex-col relative pb-12">
          
          {/* SCREEN 1: LOGIN */}
          {screen === 'login' && (
            <div className="flex-1 flex flex-col justify-between px-6 py-8">
              <div className="flex-1 flex flex-col items-center justify-center pt-8">
                {/* Logo and green elements from screenshot 1 */}
                <div className="w-16 h-16 bg-[#030712] border-2 border-lime-500 rounded-full flex items-center justify-center mb-4">
                  <div className="w-10 h-10 flex flex-col justify-end gap-0.5 items-center">
                    <div className="w-1 h-8 bg-lime-400 rounded-t" />
                    <div className="flex gap-0.5">
                      <div className="w-1 h-4 bg-lime-500 rounded-t" />
                      <div className="w-1.5 h-5 bg-yellow-400 rounded-t" />
                      <div className="w-1 h-3 bg-lime-500 rounded-t" />
                    </div>
                  </div>
                </div>
                <h1 className="text-xl font-bold tracking-wider text-lime-400 text-center uppercase">EWS Survey</h1>
                <p className="text-[10px] tracking-widest text-slate-400 text-center uppercase font-bold mt-1">SURVEY SAWIT</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-2.5 bg-red-950/70 border border-red-500 text-red-200 text-xs rounded text-center">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">NIK</label>
                  <input 
                    type="text" 
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value)}
                    placeholder="Masukkan NIK Anda" 
                    required
                    className="w-full bg-[#111827] text-slate-100 text-sm px-4 py-3 rounded-lg border border-slate-800 focus:outline-none focus:border-lime-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PASSWORD</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Masukkan password" 
                      required
                      className="w-full bg-[#111827] text-slate-100 text-sm px-4 py-3 rounded-lg border border-slate-800 focus:outline-none focus:border-lime-500"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-lime-500 hover:bg-lime-600 active:scale-[0.98] transition-transform text-gray-950 font-bold uppercase tracking-widest text-xs py-3.5 rounded-lg mt-4 cursor-pointer"
                >
                  Masuk
                </button>
              </form>
              
              <div className="pt-6 text-center text-[10px] text-slate-500">
                Hubungi Admin untuk login NIK & Password
                <div className="mt-1 text-slate-400 font-mono">Demo: NIK 123456 / admin123</div>
              </div>
            </div>
          )}

          {/* SCREEN 2: INITIAL SYNC */}
          {screen === 'sync_initial' && (
            <div className="flex-1 flex flex-col justify-between px-6 py-10 items-center text-center">
              <div className="pt-20 space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  {/* Rotating spinner from screen screenshot 2 */}
                  <div className={`w-20 h-20 border-4 border-lime-500/20 border-t-lime-500 rounded-full ${isDownloadingResources ? 'animate-spin' : ''}`} />
                  <Database className="w-8 h-8 text-lime-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-slate-100">Menyinkronkan Data...</h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                    Mengunduh data afdeling, blok, dan jenis serangan untuk pertama kali dari server.
                  </p>
                </div>
              </div>

              <div className="space-y-3 w-full">
                {isDownloadingResources ? (
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-lime-500 h-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                ) : (
                  <button 
                    onClick={handleInitialResourcesDownload}
                    className="w-full bg-[#1e293b] hover:bg-[#334155] text-slate-200 font-medium py-3 rounded-lg text-xs tracking-wider"
                  >
                    Mulai Sinkronisasi Sesi
                  </button>
                )}

                <button 
                  onClick={() => { setScreen('home'); setActiveTab('beranda'); }}
                  className="w-full text-slate-400 hover:text-slate-300 text-[11px] hover:underline"
                >
                  Lewati dan Lanjutkan
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: TAB COVERS (HOME, RKH, LHM, SYNC, PROFILE) */}
          {(screen === 'home' || screen === 'rkh_pilih_afdeling') && (
            <div className="flex-1 flex flex-col">
              
              {/* TAB Header */}
              <div className="px-5 py-4 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">EWS SAWIT MOBILE</span>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Halo, {authSurveyor?.name || 'Surveyor'}</span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  title="Keluar Akun"
                  className="p-1 px-1.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 text-[10px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TAB CONTENT 1: BERANDA */}
              {activeTab === 'beranda' && (
                <div className="p-5 flex-1 space-y-4">
                  {/* Status Box */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-lime-400 uppercase">Status Survey</span>
                      <span className="text-[10px] bg-lime-500/15 text-lime-400 px-2 py-0.5 rounded-full font-bold">Aktif</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center pt-1">
                      <div className="p-2.5 bg-[#030712] rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Draft Lokal LHM</span>
                        <span className="text-lg font-mono font-bold text-white">{localDrafts.length}</span>
                      </div>
                      <div className="p-2.5 bg-[#030712] rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Ketersediaan Peta</span>
                        <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Tersedia Offline</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Instructions Links */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Menu Cepat</h3>
                    
                    <button 
                      onClick={() => { setActiveTab('rkh'); }}
                      className="w-full flex justify-between items-center p-3 bg-gradient-to-r from-lime-950/20 to-slate-900 border border-slate-800 hover:bg-slate-800/50 rounded-xl active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-lime-500/10 text-lime-400 rounded-lg">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block">Buat Sesi Survey RKH</span>
                          <span className="text-[10px] text-slate-400 block">Pilih afdeling & blok, mulai foto selfie</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button 
                      onClick={() => { setActiveTab('lhm'); }}
                      className="w-full flex justify-between items-center p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800/50 rounded-xl active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block font-sans">Riwayat Upload LHM</span>
                          <span className="text-[10px] text-slate-400 block">Sinkronisasi hasil survey ke DB Pusat</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button 
                      onClick={() => { setActiveTab('sinkron'); }}
                      className="w-full flex justify-between items-center p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800/50 rounded-xl active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block">Download Peta Penuh</span>
                          <span className="text-[10px] text-slate-400 block">Download asset peta secara offline</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-orange-400 uppercase block mb-1">💡 Pengingat Offline-First</span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Aplikasi ini didesain agar dapat bekerja sepenuhnya luring di kebun sawit. Data survey disimpan sementara di HP. Sangat direkomendasikan melakukan download peta di tab <b>Sinkron</b> sebelum berangkat ke lokasi.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 2: RKH (RENCANA KERJA HARIAN) */}
              {activeTab === 'rkh' && (
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-lime-400 uppercase block">RENCANA KERJA HARIAN</span>
                      <h3 className="text-sm font-bold text-white">Langkah 1 - Pilih Afdeling</h3>
                    </div>

                    {/* Slider Cards for Afdeling Selection */}
                    <div className="relative pt-2">
                      {afdelings.length > 0 ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 relative shadow-inner">
                          {/* Map Outline Simulation Illustration */}
                          <div className="w-24 h-24 border border-lime-500/20 bg-[#030712] rounded-xl flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-2 border border-dashed border-slate-800 rounded" />
                            {/* Abstract poly line shape matching screenshot */}
                            <svg className="w-16 h-16 text-slate-800" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                              <polygon points="20,30 80,10 90,60 50,90 10,70" strokeWidth="2" strokeDasharray="3" />
                            </svg>
                            <span className="absolute top-1 right-2 text-[9px] text-slate-500 uppercase font-mono">PETA AFD {afdelings[currentAfdelingIndex]?.id}</span>
                          </div>

                          <div>
                            <span className="bg-lime-500/10 text-lime-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">AFDELING</span>
                            <h2 className="text-3xl font-extrabold text-white mt-1.5">{afdelings[currentAfdelingIndex]?.name}</h2>
                          </div>

                          <div className="grid grid-cols-2 gap-4 w-full pt-2 border-t border-slate-800">
                            <div>
                              <span className="text-[9px] text-slate-400 block">TOTAL BLOK</span>
                              <span className="text-sm font-bold text-white font-mono">{afdelings[currentAfdelingIndex]?.totalBlocks} Blok</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block">TOTAL POKOK</span>
                              <span className="text-sm font-bold text-white font-mono">{afdelings[currentAfdelingIndex]?.totalTrees} Pokok</span>
                            </div>
                          </div>

                          {/* Navigation Buttons */}
                          <div className="flex items-center justify-between w-full pt-1">
                            <button 
                              onClick={() => setCurrentAfdelingIndex(p => Math.max(0, p - 1))}
                              disabled={currentAfdelingIndex === 0}
                              className="p-1 px-2.5 rounded-lg bg-[#030712] border border-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {currentAfdelingIndex + 1} / {afdelings.length}
                            </span>
                            <button 
                              onClick={() => setCurrentAfdelingIndex(p => Math.min(afdelings.length - 1, p + 1))}
                              disabled={currentAfdelingIndex === afdelings.length - 1}
                              className="p-1 px-2.5 rounded-lg bg-[#030712] border border-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-xl">
                          Memuat data afdeling...
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      // Move to step 2: choose block
                      const blockList = blocks.filter(b => b.afdelingId === afdelings[currentAfdelingIndex]?.id);
                      if (blockList.length > 0) {
                        setSelectedBlockId(blockList[0].id);
                      }
                      setScreen('rkh_pilih_blok');
                    }}
                    className="w-full bg-lime-500 hover:bg-lime-600 active:scale-[0.98] text-gray-950 text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl mt-6 cursor-pointer"
                  >
                    Mulai di {afdelings[currentAfdelingIndex]?.name || 'Afdeling A'}
                  </button>
                </div>
              )}

              {/* TAB CONTENT 3: LHM (LEMBER HASIL MINGGUAN / HISTORIC ARCHIVES) */}
              {activeTab === 'lhm' && (
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">RIWAYAT UPLOAD</span>
                      <h2 className="text-base font-bold text-white">LHM</h2>
                    </div>

                    {/* Upload progress state box */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Antrean Unggah</span>
                        <span className="font-mono font-bold text-white">{localDrafts.length} Sesi LHM</span>
                      </div>
                      
                      {isUploading ? (
                        <div className="space-y-1.5">
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-lime-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-[9px] text-lime-400/90 font-mono leading-tight">{uploadMessage}</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-slate-700 h-full" style={{ width: '0%' }} />
                          </div>
                          <span className="text-[9px] text-slate-500 block">Pending sinkronisasi ke server.</span>
                        </div>
                      )}
                    </div>

                    {/* Perlu Diupload Header with counter pill */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Perlu Diupload</span>
                        {localDrafts.length > 0 && (
                          <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px]">
                            {localDrafts.length}
                          </span>
                        )}
                      </div>

                      {localDrafts.length > 0 ? (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {localDrafts.map((draft, idx) => {
                            const damages = draft.treeSurveys.filter(t => t.tikus || t.tirataba || t.ulatApi || t.ulatKantung).length;
                            const photos = draft.treeSurveys.filter(t => t.buktiFoto).length + (draft.session.selfieUrl ? 1 : 0);
                            return (
                              <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-white">
                                    Afdeling {draft.session.afdelingId} - J15
                                  </h4>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-400">
                                    <span className="flex items-center gap-0.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                      Menunggu
                                    </span>
                                    <span>•</span>
                                    <span>{photos} foto</span>
                                    <span>•</span>
                                    <span className="text-red-400">{damages} Terserang</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => alert(`Detail Draft Sesi:\nTanggal: ${draft.session.tanggal}\nBlok: ${draft.session.blockId}\nLuas: ${draft.session.luasHa} Ha\nPokok Surveyed: ${draft.treeSurveys.length}`)}
                                    className="p-1 px-1.5 rounded bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (confirm(`Hapus draft survey Afdeling ${draft.session.afdelingId} - Blok ${draft.session.blockId}?`)) {
                                        const clean = localDrafts.filter((d, j) => idx !== j);
                                        saveDraftsToStorage(clean);
                                      }
                                    }}
                                    className="p-1 px-1.5 rounded bg-red-950/20 text-red-400 hover:text-red-200 hover:bg-red-900/30"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center border border-dashed border-slate-800 bg-slate-900/40 rounded-xl">
                          <CheckCircle className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                          <span className="text-[10px] text-slate-500">Semua LHM telah ter-upload dengan bersih!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={uploadDraftsToServer}
                    disabled={localDrafts.length === 0 || isUploading}
                    className="w-full bg-[#a3e635] hover:bg-lime-500 disabled:opacity-40 text-gray-950 text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl cursor-pointer select-none active:scale-95 transition-transform"
                  >
                    Mulai Upload
                  </button>
                </div>
              )}

              {/* TAB CONTENT 4: SINKRON (OFFLINE RESOURCES SYNC) */}
              {activeTab === 'sinkron' && (
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">DATA OFFLINE</span>
                      <h2 className="text-base font-bold text-white">Sinkronisasi</h2>
                    </div>

                    {/* Status Card */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 relative overflow-hidden">
                      <div className="absolute right-3 top-3 px-1.5 py-0.5 rounded-full text-[8.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Offline Ready
                      </div>
                      <span className="text-[10px] text-slate-400 block leading-none">Status Data Lokal</span>
                      <h3 className="text-xs font-bold text-white">Data tersedia offline</h3>
                      <p className="text-[9px] text-slate-500 font-mono pt-1">TERAKHIR DISINKRONKAN:<br/>{lastSyncedDate}</p>
                    </div>

                    {/* Section Description */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Download Data Afdeling</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Download semua data Afdeling dan Blok untuk digunakan secara offline. Data ini diperlukan agar aplikasi dapat berfungsi tanpa koneksi internet.
                      </p>
                    </div>

                    {/* Trigger button */}
                    <button 
                      onClick={triggerManualSyncUpdate}
                      disabled={isDownloadingResources}
                      className="w-full flex items-center justify-center gap-2 bg-lime-500 text-gray-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-lime-600 cursor-pointer active:scale-98 transition-transform"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDownloadingResources ? 'animate-spin' : ''}`} />
                      <span>{isDownloadingResources ? 'Memproses Data...' : 'Perbarui Data'}</span>
                    </button>

                    {/* Information static section */}
                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-300 uppercase block mb-1">📋 INFORMASI</span>
                      <ul className="space-y-1 text-[9.5px] text-slate-400 leading-normal pl-3 list-disc">
                        <li>Data akan tersimpan di perangkat HP survey Anda</li>
                        <li>Aplikasi dapat digunakan tanpa internet setelah download</li>
                        <li>Perbarui data secara berkala untuk update info terbaru</li>
                        <li>Data LHM akan terupload otomatis saat dilakukan manual sync</li>
                      </ul>
                    </div>
                  </div>

                  <div className="text-center text-[9px] text-slate-500">
                    EWS Sawit Mobile v1.4.2
                  </div>
                </div>
              )}

              {/* TAB CONTENT 5: PROFIL */}
              {activeTab === 'profil' && (
                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">AKUN SURVEYOR</span>
                    <h2 className="text-base font-bold text-white">Profil</h2>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-lime-500/10 border border-lime-500/20 text-lime-400 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{authSurveyor?.name || 'Budi Santoso'}</h3>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">NIK: {authSurveyor?.nik || '123456'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-bold bg-lime-500/15 text-lime-400 uppercase tracking-widest border border-lime-500/20">
                      SAWIT FIELD SURVEYOR
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kinerja Bulan Ini</span>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 bg-[#030712] rounded-lg">
                        <span className="text-[9px] text-slate-500 block">Selesai Survey</span>
                        <span className="text-sm font-bold text-white font-mono">14 Blok</span>
                      </div>
                      <div className="p-2 bg-[#030712] rounded-lg">
                        <span className="text-[9px] text-slate-500 block">Akurasi GPS</span>
                        <span className="text-sm font-bold text-green-400">98.5%</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full py-3 border border-red-900/40 text-red-400 bg-red-950/10 hover:bg-red-950/20 rounded-xl text-xs uppercase tracking-widest font-bold"
                  >
                    Keluar Sesi / Ganti User
                  </button>
                </div>
              )}

              {/* BOTTOM NAVIGATION TAB - 5 TABS matching screen screenshots */}
              <div id="phone-nav-bar" className="absolute bottom-0 inset-x-0 h-12 bg-slate-900 border-t border-slate-800 grid grid-cols-5 z-40">
                <button 
                  onClick={() => { setScreen('home'); setActiveTab('beranda'); }}
                  className={`flex flex-col items-center justify-center text-[9px] ${activeTab === 'beranda' ? 'text-lime-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Compass className="w-4 h-4 mb-0.5" />
                  <span>Beranda</span>
                </button>
                <button 
                  onClick={() => { setScreen('home'); setActiveTab('rkh'); }}
                  className={`flex flex-col items-center justify-center text-[9px] ${activeTab === 'rkh' ? 'text-lime-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <ClipboardList className="w-4 h-4 mb-0.5" />
                  <span>RKH</span>
                </button>
                <button 
                  onClick={() => { setScreen('home'); setActiveTab('lhm'); }}
                  className={`flex flex-col items-center justify-center text-[9px] relative ${activeTab === 'lhm' ? 'text-lime-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {localDrafts.length > 0 && (
                    <div className="absolute top-1 right-3 w-3.5 h-3.5 bg-yellow-500 text-[#030712] rounded-full text-[8px] font-bold flex items-center justify-center border border-slate-900">
                      {localDrafts.length}
                    </div>
                  )}
                  <Compass className="w-4 h-4 mb-0.5" />
                  <span>LHM</span>
                </button>
                <button 
                  onClick={() => { setScreen('home'); setActiveTab('sinkron'); }}
                  className={`flex flex-col items-center justify-center text-[9px] ${activeTab === 'sinkron' ? 'text-lime-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <RefreshCw className="w-4 h-4 mb-0.5" />
                  <span>Sinkron</span>
                </button>
                <button 
                  onClick={() => { setScreen('home'); setActiveTab('profil'); }}
                  className={`flex flex-col items-center justify-center text-[9px] ${activeTab === 'profil' ? 'text-lime-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <User className="w-4 h-4 mb-0.5" />
                  <span>Profil</span>
                </button>
              </div>

            </div>
          )}

          {/* SCREEN 4: RKH - PILIH BLOK */}
          {screen === 'rkh_pilih_blok' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setScreen('rkh_pilih_afdeling')} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[10px] text-lime-400 uppercase tracking-wider font-bold block leading-none">Pilih Blok - Langkah 2</span>
                    <h2 className="text-xs font-bold text-white mt-1">
                      {afdelings[currentAfdelingIndex]?.name}
                    </h2>
                  </div>
                </div>

                {/* Map Block simulation outline */}
                <div className="w-full h-32 border border-slate-800 bg-[#030712] rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-1.5 border border-dashed border-lime-500/10 rounded" />
                  {/* Visual Polygon outline */}
                  <svg className="w-20 h-20 text-lime-500/30" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                    <rect x="25" y="25" width="50" height="50" strokeWidth="2" strokeDasharray="2,2" />
                    <line x1="50" y1="25" x2="50" y2="75" strokeWidth="1" strokeDasharray="4" />
                    <line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="4" />
                  </svg>
                  <span className="absolute bottom-2 left-3 text-[9px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                    PETA: {afdelings[currentAfdelingIndex]?.name}
                  </span>
                </div>

                {/* Block Selector dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PILIH BLOK</label>
                  <select 
                    value={selectedBlockId}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                    className="w-full bg-[#111827] text-slate-100 text-xs px-4 py-3 rounded-lg border border-slate-800 focus:outline-none focus:border-lime-500 font-mono"
                  >
                    {blocks.filter(b => b.afdelingId === afdelings[currentAfdelingIndex]?.id).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BLOCK DETAILS CARD */}
                {selectedBlockId && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-[9px] font-bold text-lime-400 block uppercase tracking-widest">INFORMASI BLOK</span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-[#030712] rounded-lg">
                        <span className="text-[9px] text-slate-500 block">BLOK</span>
                        <span className="text-xs font-bold text-white font-mono">{selectedBlockId}</span>
                      </div>
                      <div className="p-2 bg-[#030712] rounded-lg">
                        <span className="text-[9px] text-slate-500 block font-sans">LUAS</span>
                        <span className="text-xs font-bold text-white font-mono">
                          {blocks.find(b => b.id === selectedBlockId)?.luasHa} Ha
                        </span>
                      </div>
                      <div className="p-2 bg-[#030712] rounded-lg">
                        <span className="text-[9px] text-slate-500 block">POKOK</span>
                        <span className="text-xs font-bold text-white font-mono">
                          {blocks.find(b => b.id === selectedBlockId)?.totalTrees}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5">
                <button 
                  onClick={() => {
                    // Go to Step 3: take selfie photo
                    setSelfiePhoto('');
                    setScreen('rkh_selfie');
                    startCamera();
                  }}
                  className="w-full bg-lime-500 hover:bg-lime-600 active:scale-[0.98] text-gray-950 font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl cursor-pointer"
                >
                  Ambil Selfie Verifikasi
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 5: CAMERA TAKE SELFIE */}
          {screen === 'rkh_selfie' && (
            <div className="flex-1 flex flex-col justify-between bg-slate-950 relative">
              
              {/* Header */}
              <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-5 pt-7 z-40 flex items-center gap-2">
                <button 
                  onClick={() => { stopCamera(); setScreen('rkh_pilih_blok'); }} 
                  className="p-1 rounded-full bg-black/40 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                <div>
                  <span className="text-[10px] text-lime-400 font-bold block uppercase leading-none">Persetujuan GPS</span>
                  <h3 className="text-xs font-bold text-slate-200">Pastikan wajah terlihat jelas</h3>
                </div>
              </div>

              {/* Viewport Camera Sim */}
              <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden mt-6">
                {useCamera ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : selfiePhoto ? (
                  <img 
                    src={selfiePhoto} 
                    referrerPolicy="no-referrer"
                    alt="captured surveyor" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-lime-500" />
                    <span>Lampu kamera mati. Silahkan fungsikan feed atau lewati di bawah.</span>
                  </div>
                )}

                {/* Overlaid timestamp and telemetry mock */}
                {selfiePhoto && (
                  <div className="absolute bottom-20 left-4 right-4 p-2 bg-black/60 rounded border border-slate-800 text-[10px] font-mono whitespace-pre-wrap">
                    📍 Lat: -1.25890 Lng: 101.42531<br/>
                    🕒 Waktu: {new Date().toLocaleTimeString()}<br/>
                    🌲 Lokasi: AFD {afdelings[currentAfdelingIndex]?.id} Blok {selectedBlockId}
                  </div>
                )}
              </div>

              {/* Presets and Captured controls */}
              <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-4">
                
                {cameraError && (
                  <p className="text-[10px] text-amber-400 text-center leading-normal">{cameraError}</p>
                )}

                {/* FAST SELFIE PRESETS FOR PREVIEW BYPASS */}
                {!selfiePhoto && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest text-center block">Cepat: Pilih template foto wajah</span>
                    <div className="flex justify-center gap-3">
                      {SELFIE_PRESETS.map((src, i) => (
                        <button 
                          key={i} 
                          onClick={() => selectSelfiePreset(i)}
                          className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-800 hover:border-lime-500 transition-colors"
                        >
                          <img src={src} alt="dummy face" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  {selfiePhoto ? (
                    <>
                      <button 
                        onClick={() => { setSelfiePhoto(''); startCamera(); }}
                        className="flex-1 py-3 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 font-bold uppercase tracking-wider text-[11px] rounded-lg"
                      >
                        Ambil Ulang
                      </button>
                      <button 
                        onClick={() => { stopCamera(); setScreen('rkh_confirm'); }}
                        className="flex-1 py-3 text-gray-950 bg-lime-500 hover:bg-lime-600 font-bold uppercase tracking-wider text-[11px] rounded-lg"
                      >
                        Gunakan Foto
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={captureCameraPhoto}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-lime-500 hover:bg-lime-600 text-gray-950 font-bold uppercase text-[11px] tracking-widest rounded-lg cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture & verifikasi</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 6: SESSION CONFIRMATION (KONFIRMASI SESI) */}
          {screen === 'rkh_confirm' && (
            <div className="flex-1 flex flex-col justify-between p-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setScreen('rkh_selfie')} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xs font-bold text-white">Konfirmasi Sesi</h2>
                </div>

                <div className="flex justify-between items-center bg-[#030712] p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 tracking-wider block font-bold uppercase">Ringkasan RKH</span>
                  <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase">BELUM DIMULAI</span>
                </div>

                {/* Items Information */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">AFDELING</span>
                    <span className="font-bold text-white">Afdeling {afdelings[currentAfdelingIndex]?.id}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-400">BLOK</span>
                    <span className="font-bold text-white font-mono">{selectedBlockId}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-400">LUAS</span>
                    <span className="font-bold text-white font-mono">
                      {blocks.find(b => b.id === selectedBlockId)?.luasHa} Ha
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-400">JUMLAH POKOK</span>
                    <span className="font-bold text-white font-mono">
                      {blocks.find(b => b.id === selectedBlockId)?.totalTrees} pokok
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-400">TANGGAL</span>
                    <span className="font-bold text-white text-right">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-400">WAKTU MULAI</span>
                    <span className="font-bold text-white font-mono">
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>

                  {/* Selfie Preview thumbnail */}
                  <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between">
                    <span className="text-slate-400">FOTO SELFIE</span>
                    {selfiePhoto ? (
                      <div className="w-10 h-10 rounded border border-slate-700 overflow-hidden shadow-sm">
                        <img src={selfiePhoto} alt="selfie thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <span className="text-red-400 text-[10px]">Foto Hilang</span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={beginSurveySession}
                className="w-full bg-lime-500 hover:bg-lime-600 font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl cursor-pointer select-none active:scale-95 transition-transform mt-4"
              >
                Mulai Survey
              </button>
            </div>
          )}

          {/* SCREEN 7: ACTIVE SURVEY INTERACTIVE INTERFACE (PETA VIEW & FORM VIEW) */}
          {screen === 'rkh_survey_active' && surveySession && (
            <div className="flex-1 flex flex-col h-full bg-[#030712]">
              
              {/* Dual Layout Toggles at Top (Peta, Form) */}
              <div className="p-3 bg-slate-900 grid grid-cols-2 gap-1 border-b border-slate-800 shadow-md">
                <button 
                  onClick={() => setSurveyTab('peta')}
                  className={`py-2 text-xs font-bold text-center rounded-lg cursor-pointer ${surveyTab === 'peta' ? 'bg-lime-500 text-[#030712]' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Peta
                </button>
                <button 
                  onClick={() => setSurveyTab('form')}
                  className={`py-2 text-xs font-bold text-center rounded-lg cursor-pointer ${surveyTab === 'form' ? 'bg-lime-500 text-[#030712]' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Form
                </button>
              </div>

              {/* Active Tab 1: PETA (Webview Leaflet interactive map) */}
              {surveyTab === 'peta' && (
                <div className="flex-1 flex flex-col relative min-h-[300px]">
                  
                  {/* Top floating metrics bar */}
                  <div className="absolute top-2 inset-x-2 bg-[#090d16]/90 border border-slate-800 rounded-lg p-2.5 z-40 grid grid-cols-3 gap-1 text-center text-xs shadow-md">
                    <div className="border-r border-slate-800/80">
                      <span className="text-[8px] text-slate-500 uppercase block tracking-wider font-sans">Jarak</span>
                      <span className="font-bold text-white font-mono">{(simulatedDistance / 1000).toFixed(1)} Km</span>
                    </div>
                    <div className="border-r border-slate-800/80">
                      <span className="text-[8px] text-slate-500 block uppercase tracking-wider">Waktu</span>
                      <span className="font-bold text-white font-mono">{formatTimer(simulatedTime)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase tracking-wider">Pokok</span>
                      <span className="font-bold text-lime-400 font-mono">{activeTrees.length}</span>
                    </div>
                  </div>

                  {/* LEAFLET CONTAINER */}
                  <div ref={mapContainerRef} className="flex-1 w-full h-[330px] bg-slate-950 z-30 relative" />

                  {/* Floating Controller overlay to test GPS movement and simulation */}
                  <div className="p-3 bg-slate-900/90 border-t border-slate-800 z-40 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-serif">Simulasi Perjalanan:</span>
                      <span className="text-[10px] bg-red-400/20 text-red-400 font-bold px-2 py-0.5 rounded-full animate-pulse">Running GPS</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Peta WebView Leaflet sedang merekam perjalanan Anda secara otomatis. Anda dapat menekan tombol di form untuk merekam titik pokok terserang.
                    </p>
                  </div>
                </div>
              )}

              {/* Active Tab 2: FORM MODE */}
              {surveyTab === 'form' && (
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  
                  {/* Active Header Block info summary */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white">Afdeling {surveySession.afdelingId}</h4>
                      <span className="text-[10px] text-slate-400 block font-mono">Blok {surveySession.blockId}</span>
                    </div>
                    <span className="text-[10px] bg-lime-500/10 text-lime-400 px-2.5 py-1 rounded border border-lime-500/20 font-bold font-mono">
                      Surveyed: {activeTrees.length} Pokok
                    </span>
                  </div>

                  {/* Row loops list dynamically */}
                  <div className="space-y-4">
                    {Object.keys(activeRows).map((rowKey) => {
                      const rowNumber = parseInt(rowKey);
                      const treeNumbers = activeRows[rowNumber] || [];
                      
                      return (
                        <div key={rowNumber} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest font-mono">
                            Baris {rowNumber}
                          </span>

                          {/* Loop single trees in this row */}
                          <div className="flex flex-wrap gap-2.5 items-center">
                            {treeNumbers.map((treeNum) => {
                              const existingSurvey = activeTrees.find(t => t.rowNumber === rowNumber && t.treeNumber === treeNum);
                              const isCompleted = !!existingSurvey;
                              const hasDamage = isCompleted && (existingSurvey!.tikus || existingSurvey!.tirataba || existingSurvey!.ulatApi || existingSurvey!.ulatKantung);
                              
                              return (
                                <button 
                                  key={treeNum}
                                  onClick={() => openTreeSurveyPopup(rowNumber, treeNum)}
                                  className={`w-9 h-9 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center border transition-all cursor-pointer ${
                                    isCompleted 
                                      ? hasDamage 
                                        ? 'bg-red-500/20 text-red-400 border-red-500' 
                                        : 'bg-green-500/15 text-green-400 border-green-500' 
                                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-500 hover:text-slate-100'
                                  }`}
                                  title={`Pokok ${treeNum}`}
                                >
                                  {treeNum}
                                </button>
                              );
                            })}

                            {/* "+" Button to add extra tree inside this row matching user guide screenshot 5 */}
                            <button 
                              onClick={() => addNewTreeToRow(rowNumber)}
                              className="w-9 h-9 border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-400 rounded-lg flex items-center justify-center cursor-pointer active:scale-90"
                              title="Tambah Pokok Baru"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* "+ Tambah Baris" button to add another row container */}
                  <button 
                    onClick={addNewRow}
                    className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-lime-500/20 bg-lime-500/5 hover:bg-lime-500/10 text-lime-400 rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>⁺ Tambah Baris</span>
                  </button>

                  <div className="flex gap-2 pt-2 pb-14">
                    <button 
                      onClick={cancelActiveSurvey}
                      className="flex-1 py-3 bg-red-950/20 border border-red-900/30 text-red-400 font-bold uppercase text-[10px] tracking-wider rounded-xl hover:bg-red-900/20 transition-colors"
                    >
                      X Batalkan Survey
                    </button>
                    <button 
                      onClick={finishActiveSurveySession}
                      className="flex-1 py-3 bg-[#a3e635] hover:bg-lime-500 text-gray-950 font-bold uppercase text-[10px] tracking-wider rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4.5 h-4.5 stroke-[3px]" />
                      <span>Selesai Survey</span>
                    </button>
                  </div>
                </div>
              )}

              {/* INDIVIDUAL TREE SURVEY INPUT POP-UP overlay/modal (Matches design elements of screen screenshot 6 & 7) */}
              {selectedSurveyTree && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-xs z-50 p-5 flex flex-col justify-end">
                  <div className="bg-[#0b1329] border border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[92%] overflow-y-auto shadow-2xl relative">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm text-lime-400 uppercase tracking-widest leading-none font-mono">
                        Pokok {selectedSurveyTree.num} - Baris {selectedSurveyTree.row}
                      </h3>
                      <button 
                        onClick={() => setSelectedSurveyTree(null)}
                        className="text-slate-400 hover:text-white font-bold p-1 rounded hover:bg-slate-800 text-xs"
                      >
                        Tutup
                      </button>
                    </div>

                    {/* Skenario Pokok Terserang checklist. Switches for TK, TR, UA, UK */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Kondisi Serangan Hama</span>
                      
                      <div className="space-y-1.5">
                        {/* Switch 1: TK (Tikus) */}
                        <label className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl hover:bg-slate-800/60 cursor-pointer select-none">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white block">TK</span>
                            <span className="text-[9px] text-slate-400">Kerusakan Gigitan Tikus</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={tikusAttack} 
                            onChange={(e) => setTikusAttack(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-9 h-5 bg-slate-800 rounded-full p-0.5 transition-colors ${tikusAttack ? 'bg-lime-500' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 bg-[#030712] rounded-full shadow transition-transform ${tikusAttack ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                          </div>
                        </label>

                        {/* Switch 2: TR (Tirataba) */}
                        <label className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl hover:bg-slate-800/60 cursor-pointer select-none">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white block">TR</span>
                            <span className="text-[9px] text-slate-400">Serangan Tirataba</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={tiratabaAttack} 
                            onChange={(e) => setTiratabaAttack(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-9 h-5 bg-slate-800 rounded-full p-0.5 transition-colors ${tiratabaAttack ? 'bg-lime-500' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 bg-[#030712] rounded-full shadow transition-transform ${tiratabaAttack ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                          </div>
                        </label>

                        {/* Switch 3: UA (Ulat Api) */}
                        <label className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl hover:bg-slate-800/60 cursor-pointer select-none">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white block">UA</span>
                            <span className="text-[9px] text-slate-400">Terjangkit Ulat Api</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={ulatApiAttack} 
                            onChange={(e) => setUlatApiAttack(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-9 h-5 bg-slate-800 rounded-full p-0.5 transition-colors ${ulatApiAttack ? 'bg-lime-500' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 bg-[#030712] rounded-full shadow transition-transform ${ulatApiAttack ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                          </div>
                        </label>

                        {/* Switch 4: UK (Ulat Kantung) */}
                        <label className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl hover:bg-slate-800/60 cursor-pointer select-none">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white block">UK</span>
                            <span className="text-[9px] text-slate-400">Serangan Ulat Kantung</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={ulatKantungAttack} 
                            onChange={(e) => setUlatKantungAttack(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-9 h-5 bg-slate-800 rounded-full p-0.5 transition-colors ${ulatKantungAttack ? 'bg-lime-500' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 bg-[#030712] rounded-full shadow transition-transform ${ulatKantungAttack ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* BUKTI FOTO */}
                    {(tikusAttack || tiratabaAttack || ulatApiAttack || ulatKantungAttack) && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">BUKTI FOTO SERANGAN</span>
                        
                        {treePhoto ? (
                          <div className="relative w-full h-[120px] rounded-xl overflow-hidden border border-slate-800 group shadow-md bg-slate-950">
                            <img src={treePhoto} alt="damage proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              onClick={() => setTreePhoto(null)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 hover:bg-red-700 text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[9px] text-amber-400 leading-tight">Bukti foto wajib dilampirkan jika tanaman sawit dinyatakan terserang penyakit.</p>
                            
                            {/* Preset Buttons */}
                            <div className="flex justify-center gap-2">
                              {DAMAGE_PRESETS.map((pUrl, pi) => (
                                <button 
                                  key={pi}
                                  onClick={() => setTreePhoto(pUrl)}
                                  className="w-12 h-12 rounded border border-slate-800 overflow-hidden hover:border-lime-500 transition-colors"
                                  title="Gunakan Preset Serangan"
                                >
                                  <img src={pUrl} alt="damage example" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </button>
                              ))}
                            </div>

                            <button 
                              onClick={() => setTreePhoto(DAMAGE_PRESETS[0])}
                              className="w-full flex items-center justify-center gap-1 bg-[#1e293b] text-slate-200 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Ambil Foto</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* KOORDINAT GPS (Ambil Koordinat button from screenshot 6 & 7) */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">KOORDINAT GPS</span>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={getSimulatedCoordinates}
                          disabled={isFetchingGps}
                          className="flex-1 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 font-bold text-[10px] uppercase tracking-wider rounded-lg text-slate-300 flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <MapPin className={`w-3.5 h-3.5 text-blue-400 ${isFetchingGps ? 'animate-spin' : ''}`} />
                          <span>{isFetchingGps ? 'Menghubungi Satelit...' : 'Ambil Koordinat'}</span>
                        </button>

                        <div className="flex-1 text-[10px] font-mono leading-tight bg-slate-950 p-2 rounded-lg text-slate-400 text-center select-all border border-slate-900">
                          {treeLat && treeLng ? (
                            <div>
                              <span>Lat: {treeLat}</span><br/>
                              <span>Lng: {treeLng}</span>
                            </div>
                          ) : (
                            <span className="text-amber-500 font-bold text-[8.5px]">Koordinat Kosong</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <button 
                      onClick={saveTreeSurveyDetails}
                      className="w-full bg-lime-500 hover:bg-lime-600 font-sans font-bold uppercase tracking-wider py-3.5 rounded-xl text-gray-950 text-xs text-center cursor-pointer active:scale-95 transition-transform"
                    >
                      ✓ Selesai Survey Pokok
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Dynamic Android Home visual swipe pill on bottom */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full z-40 pointer-events-none" />
      </div>
    </div>
  );
}
