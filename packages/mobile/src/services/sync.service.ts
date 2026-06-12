import { getPendingSessions, getTreeSurveysBySession, markSessionSynced, insertMockAfdelingData } from '../database';
import { CONFIG } from '../config';

export const syncAllPendingData = async (): Promise<boolean> => {
  try {
    const pendingSessions = getPendingSessions();
    
    if (pendingSessions.length === 0) {
      console.log('No pending surveys to sync');
      return true;
    }

    console.log(`Syncing ${pendingSessions.length} sessions to ${CONFIG.API_URL}...`);

    for (const session of pendingSessions) {
      const dbTreeSurveys = getTreeSurveysBySession(session.id);
      
      // Map SQLite snake_case to Backend camelCase expected payload
      const mappedSession = {
        id: session.id,
        surveyorNik: session.surveyor_nik,
        surveyorName: session.surveyor_name,
        afdelingId: session.afdeling_id,
        blockId: session.block_id,
        luasHa: session.luas_ha,
        jumlahPokok: session.jumlah_pokok,
        tanggal: session.tanggal,
        waktuMulai: session.waktu_mulai,
        selfieUrl: session.selfie_url,
        status: session.status,
        gpsPath: session.gps_path ? JSON.parse(session.gps_path) : []
      };

      const mappedTreeSurveys = dbTreeSurveys.map(t => ({
        id: t.id,
        sessionId: t.session_id,
        rowNumber: t.row_number,
        treeNumber: t.tree_number,
        tikus: Boolean(t.tikus),
        tirataba: Boolean(t.tirataba),
        ulatApi: Boolean(t.ulat_api),
        ulatKantung: Boolean(t.ulat_kantung),
        buktiFoto: t.bukti_foto,
        gpsLatitude: t.gps_latitude,
        gpsLongitude: t.gps_longitude
      }));
      
      const payload = {
        session: mappedSession,
        treeSurveys: mappedTreeSurveys
      };

      const response = await fetch(`${CONFIG.API_URL}/api/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Upload failed for session ${session.id}: ${response.statusText}`);
      }

      // Mark as synced locally
      markSessionSynced(session.id);
    }
    
    console.log('Sync complete');
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
};

export const downloadOfflineData = async (): Promise<boolean> => {
  try {
    console.log('Downloading afdeling and map data...');
    // Simulated delay for downloading data (can implement real fetch later)
    return new Promise((resolve) => {
      setTimeout(() => {
        insertMockAfdelingData();
        console.log('Download complete');
        resolve(true);
      }, 2000);
    });
  } catch (error) {
    console.error('Download offline data failed:', error);
    return false;
  }
};
