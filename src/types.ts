export interface User {
  nik: string;
  name: string;
  role: 'admin' | 'surveyor';
  passwordHash?: string;
}

export interface Afdeling {
  id: string;
  name: string;
  totalBlocks: number;
  totalTrees: number;
  centerLat: number;
  centerLng: number;
  boundaryCoordinates?: [number, number][]; // Polygon coordinates
}

export interface Blok {
  id: string;
  afdelingId: string;
  name: string; // e.g. J15
  luasHa: number;
  totalTrees: number;
  boundaryCoordinates?: [number, number][]; // Polygon coordinates
}

export interface SurveySession {
  id: string;
  surveyorNik: string;
  surveyorName: string;
  afdelingId: string;
  blockId: string;
  luasHa: number;
  jumlahPokok: number;
  tanggal: string; // e.g. "Kamis, 7 Mei 2026"
  waktuMulai: string; // e.g. "10:16 WIB"
  selfieUrl: string; // Local storage dataURL or full R2 URL
  status: 'draft' | 'synced';
  gpsPath?: [number, number][]; // Array of GPS tracking coordinates
  createdAt: string;
}

export interface TreeSurvey {
  id: string;
  sessionId: string;
  rowNumber: number;
  treeNumber: number;
  tikus: boolean; // TK
  tirataba: boolean; // TR
  ulatApi: boolean; // UA
  ulatKantung: boolean; // UK
  buktiFoto?: string; // photo dataURL or full R2 URL
  gpsLatitude?: number;
  gpsLongitude?: number;
  createdAt: string;
}

export interface SyncStatus {
  lastSyncedAt?: string;
  localDraftCount: number;
  isOnline: boolean;
}

// Stats format for Admin Dashboard
export interface DashboardStats {
  totalSurveys: number;
  totalBlocksSurveyed: number;
  totalTreesSurveyed: number;
  attackCounts: {
    tikus: number;
    tirataba: number;
    ulatApi: number;
    ulatKantung: number;
  };
  attackTrend: {
    date: string;
    tikus: number;
    tirataba: number;
    ulatApi: number;
    ulatKantung: number;
  }[];
  recentSurveys: {
    id: string;
    surveyorName: string;
    afdelingName: string;
    blockName: string;
    tanggal: string;
    damageCount: number;
    hasSelfie: boolean;
  }[];
  treeMarkers: {
    id: string;
    afdelingId: string;
    blockId: string;
    rowNumber: number;
    treeNumber: number;
    lat: number;
    lng: number;
    hasDamage: boolean;
    damageSummary: string[];
    buktiFoto?: string;
  }[];
}
