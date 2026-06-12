import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db, getSurveysByStatus, SurveySession } from '../database';
import { syncAllPendingData } from '../services/sync.service';

export const LHMScreen = () => {
  const [reports, setReports] = useState<SurveySession[]>([]);
  const [stats, setStats] = useState({ pending: 0, synced: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = () => {
    try {
      const allSurveys = db.getAllSync('SELECT * FROM survey_sessions ORDER BY created_at DESC') as SurveySession[];
      setReports(allSurveys);
      setStats(getSurveysByStatus());
    } catch (e) {
      console.log('Error loading reports', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSyncAll = async () => {
    setIsSyncing(true);
    const success = await syncAllPendingData();
    setIsSyncing(false);
    if (success) {
      Alert.alert('Sukses', 'Data berhasil disinkronisasi');
      loadData();
    } else {
      Alert.alert('Gagal', 'Terjadi kesalahan saat sinkronisasi');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>LAPORAN HARIAN MANDOR</Text>
          <Text style={styles.title}>Riwayat Survey</Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.pending}</Text>
            <Text style={styles.summaryLabel}>Sesi Pending</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#a3e635' }]}>
            <Text style={[styles.summaryValue, { color: '#a3e635' }]}>{stats.synced}</Text>
            <Text style={styles.summaryLabel}>Sesi Synced</Text>
          </View>
        </View>

        {stats.pending > 0 && (
          <TouchableOpacity 
            style={styles.syncAllBtn}
            onPress={handleSyncAll}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.syncAllBtnText}>Sinkronisasi Semua Data Pending</Text>
            )}
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.listContainer}>
          {reports.map((item) => (
            <View key={item.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={16} color="#94a3b8" />
                  <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString('id-ID')}</Text>
                </View>
                {item.status === 'synced' ? (
                  <View style={[styles.badge, styles.badgeSuccess]}>
                    <Ionicons name="checkmark-circle" size={14} color="#0f172a" />
                    <Text style={styles.badgeTextSuccess}>Tersinkron</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Ionicons name="cloud-upload" size={14} color="#0f172a" />
                    <Text style={styles.badgeTextWarning}>Menunggu</Text>
                  </View>
                )}
              </View>

              <View style={styles.reportDetails}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>AFDELING</Text>
                  <Text style={styles.detailValue}>{item.afdeling_id}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>BLOK</Text>
                  <Text style={styles.detailValue}>{item.block_id}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>TANGGAL</Text>
                  <Text style={styles.detailValue}>{item.tanggal}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>POKOK SENSUS</Text>
                  <Text style={[styles.detailValue, { color: '#a3e635' }]}>
                    {item.jumlah_pokok}
                  </Text>
                </View>
              </View>

            </View>
          ))}
          {reports.length === 0 && (
            <Text style={{color: '#94a3b8', textAlign: 'center', marginTop: 20}}>Belum ada riwayat survey.</Text>
          )}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    paddingTop: 24,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  syncAllBtn: {
    backgroundColor: '#a3e635',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  syncAllBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  reportCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#a3e635',
  },
  badgeWarning: {
    backgroundColor: '#facc15',
  },
  badgeTextSuccess: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 4,
  },
  badgeTextWarning: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 4,
  },
  reportDetails: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailBox: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  actionButton: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
});
