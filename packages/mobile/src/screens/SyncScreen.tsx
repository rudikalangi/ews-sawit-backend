import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadOfflineData } from '../services/sync.service';

export const SyncScreen = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await downloadOfflineData();
    setIsSyncing(false);
    if (success) {
      Alert.alert('Sukses', 'Data offline berhasil diperbarui.');
    } else {
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengunduh data.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>DATA OFFLINE</Text>
          <Text style={styles.title}>Sinkronisasi</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBox}>
              <Ionicons name="server-outline" size={24} color="#a3e635" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Status Data Lokal</Text>
              <Text style={styles.cardDesc}>Data tersedia offline</Text>
            </View>
          </View>
          <View style={styles.lastSyncBox}>
            <Text style={styles.lastSyncLabel}>TERAKHIR DISINKRONKAN</Text>
            <Text style={styles.lastSyncValue}>Belum pernah disinkronkan</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Download Data Afdeling</Text>
        <Text style={styles.sectionDesc}>
          Download semua data Afdeling dan Blok untuk digunakan secara offline. Data ini diperlukan agar aplikasi dapat berfungsi tanpa koneksi internet.
        </Text>

        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={20} color="#0f172a" style={styles.btnIcon} />
              <Text style={styles.syncButtonText}>Perbarui Data</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>INFORMASI</Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>Data akan tersimpan di perangkat Anda</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>Aplikasi dapat digunakan tanpa internet setelah download</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>Perbarui data secara berkala untuk mendapatkan informasi terbaru</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>Data RKH akan otomatis terkirim saat online</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#94a3b8',
  },
  lastSyncBox: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
  },
  lastSyncLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    letterSpacing: 1,
  },
  lastSyncValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 24,
  },
  syncButton: {
    backgroundColor: '#a3e635',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  btnIcon: {
    marginRight: 8,
  },
  syncButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#94a3b8',
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
