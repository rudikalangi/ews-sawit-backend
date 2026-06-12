import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveSurveySession } from '../database';

export const KonfirmasiSesiScreen = ({ route, navigation }: any) => {
  const { afdeling, blok, location, time, selfieUrl } = route.params || {};

  const handleStartSurvey = () => {
    // Generate simple ID
    const sessionId = `SES_${Date.now()}`;
    
    // Save to DB
    saveSurveySession({
      id: sessionId,
      surveyor_nik: '123456', // Hardcoded for now or fetch from context
      surveyor_name: 'Budi Santoso', // Hardcoded for now
      afdeling_id: afdeling?.id || 'A',
      block_id: blok || 'J15',
      luas_ha: 21.92,
      jumlah_pokok: 150,
      tanggal: new Date(time || Date.now()).toISOString().split('T')[0],
      waktu_mulai: new Date(time || Date.now()).toLocaleTimeString('id-ID'),
      selfie_url: selfieUrl || null,
      status: 'pending',
      gps_path: location ? JSON.stringify([location]) : '[]',
      created_at: new Date().toISOString()
    });

    navigation.navigate('SurveyForm', { afdeling, blok, sessionId });
  };

  const currentDate = new Date(time).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const currentTime = new Date(time).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konfirmasi Sesi</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Ringkasan RKH</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Belum Dimulai</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Afdeling</Text>
            <Text style={styles.detailValue}>{afdeling.name}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Blok</Text>
            <Text style={styles.detailValue}>{blok}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Luas</Text>
            <Text style={styles.detailValue}>21.92 Ha</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jumlah Pokok</Text>
            <Text style={styles.detailValue}>150</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal</Text>
            <Text style={styles.detailValue}>{currentDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Waktu Mulai</Text>
            <Text style={styles.detailValue}>{currentTime}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>FOTO SELFIE VERIFIKASI</Text>
        <View style={styles.selfieCard}>
          <View style={styles.selfiePlaceholder}>
            <Ionicons name="person" size={40} color="#64748b" />
          </View>
          <View style={styles.selfieInfo}>
            <Text style={styles.selfieInfoTitle}>Data GPS Terekam</Text>
            <Text style={styles.selfieInfoDetail}>
              Lat: {location ? location.coords.latitude.toFixed(6) : '-'}
            </Text>
            <Text style={styles.selfieInfoDetail}>
              Lng: {location ? location.coords.longitude.toFixed(6) : '-'}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#a3e635" />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartSurvey}>
            <Text style={styles.startButtonText}>MULAI SURVEY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#854d0e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  detailValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    width: '100%',
    marginVertical: 4,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selfieCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selfiePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selfieInfo: {
    flex: 1,
  },
  selfieInfoTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selfieInfoDetail: {
    color: '#94a3b8',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  startButton: {
    backgroundColor: '#84cc16',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
