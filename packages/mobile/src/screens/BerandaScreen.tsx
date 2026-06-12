import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const BerandaScreen = ({ navigation }: any) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat Datang,</Text>
            <Text style={styles.userName}>Surveyor 1</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => navigation.replace('Login')}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
            <Text style={styles.infoText}>{currentDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#94a3b8" />
            <Text style={styles.infoText}>Shift Pagi (07:00 - 15:00)</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="wifi-outline" size={20} color="#a3e635" />
            <Text style={[styles.infoText, { color: '#a3e635' }]}>Terhubung ke Server</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Target Hari Ini</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Indikator Hama (Afdeling A)</Text>
        <View style={styles.pestContainer}>
          
          <View style={styles.pestRow}>
            <View style={styles.pestLabelContainer}>
              <Text style={styles.pestName}>Ulat Api</Text>
              <Text style={styles.pestPercent}>35%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '35%', backgroundColor: '#ef4444' }]} />
            </View>
          </View>

          <View style={styles.pestRow}>
            <View style={styles.pestLabelContainer}>
              <Text style={styles.pestName}>Tikus</Text>
              <Text style={styles.pestPercent}>15%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '15%', backgroundColor: '#f59e0b' }]} />
            </View>
          </View>

          <View style={styles.pestRow}>
            <View style={styles.pestLabelContainer}>
              <Text style={styles.pestName}>Ulat Kantung</Text>
              <Text style={styles.pestPercent}>5%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '5%', backgroundColor: '#eab308' }]} />
            </View>
          </View>

        </View>

        <Text style={styles.sectionTitle}>Menu Utama</Text>
        
        <View style={styles.menuGrid}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('RKH')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={32} color="#a3e635" />
            </View>
            <Text style={styles.menuText}>Rencana Kerja</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('LHM')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={32} color="#a3e635" />
            </View>
            <Text style={styles.menuText}>Laporan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Sync')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="sync" size={32} color="#a3e635" />
            </View>
            <Text style={styles.menuText}>Sinkronisasi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="help-buoy" size={32} color="#a3e635" />
            </View>
            <Text style={styles.menuText}>Bantuan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#a3e635',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#0f172a',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#cbd5e1',
    marginLeft: 12,
    fontSize: 14,
  },
  pestContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pestRow: {
    marginBottom: 12,
  },
  pestLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pestName: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  pestPercent: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
