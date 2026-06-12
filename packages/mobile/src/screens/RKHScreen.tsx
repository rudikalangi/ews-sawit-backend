import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const RKHScreen = ({ navigation }: any) => {
  const [currentAfdelingIndex, setCurrentAfdelingIndex] = useState(0);

  const mockAfdelings = [
    { id: 'A', name: 'Afdeling A', totalBlok: 5, totalPokok: 690 },
    { id: 'B', name: 'Afdeling B', totalBlok: 8, totalPokok: 1200 },
    { id: 'C', name: 'Afdeling C', totalBlok: 4, totalPokok: 500 },
  ];

  const currentAfdeling = mockAfdelings[currentAfdelingIndex];

  const handleNext = () => {
    if (currentAfdelingIndex < mockAfdelings.length - 1) {
      setCurrentAfdelingIndex(currentAfdelingIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentAfdelingIndex > 0) {
      setCurrentAfdelingIndex(currentAfdelingIndex - 1);
    }
  };

  const handleStart = () => {
    navigation.navigate('PilihBlok', { afdeling: currentAfdeling });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>RENCANA KERJA HARIAN</Text>
          <Text style={styles.title}>Langkah 1 - Pilih Afdeling</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>---- PETA AFD {currentAfdeling.id} ----</Text>
            <Ionicons name="map-outline" size={48} color="#334155" />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>AFDELING</Text>
          </View>

          <Text style={styles.afdelingName}>{currentAfdeling.name}</Text>

          <View style={styles.divider} />

          <View style={styles.statsContainer}>
            <View style={styles.statColumn}>
              <Text style={styles.statLabel}>TOTAL BLOK</Text>
              <Text style={styles.statValue}>{currentAfdeling.totalBlok} Blok</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statLabel}>TOTAL POKOK</Text>
              <Text style={styles.statValue}>{currentAfdeling.totalPokok} Pokok</Text>
            </View>
          </View>

          <View style={styles.pagination}>
            <TouchableOpacity style={styles.pageButton} onPress={handlePrev} disabled={currentAfdelingIndex === 0}>
              <Ionicons name="chevron-back" size={20} color={currentAfdelingIndex === 0 ? "#334155" : "#cbd5e1"} />
            </TouchableOpacity>
            <Text style={styles.pageText}>
              <Text style={{ color: '#3b82f6' }}>{currentAfdelingIndex + 1}</Text> / {mockAfdelings.length}
            </Text>
            <TouchableOpacity style={styles.pageButton} onPress={handleNext} disabled={currentAfdelingIndex === mockAfdelings.length - 1}>
              <Ionicons name="chevron-forward" size={20} color={currentAfdelingIndex === mockAfdelings.length - 1 ? "#334155" : "#cbd5e1"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>MULAI DI {currentAfdeling.name.toUpperCase()}</Text>
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
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    color: '#a3e635',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mapPlaceholder: {
    width: 160,
    height: 160,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  mapText: {
    color: '#3b82f6',
    fontSize: 10,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    color: '#a3e635',
    fontSize: 12,
    fontWeight: 'bold',
  },
  afdelingName: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    width: '100%',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statColumn: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pageText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    marginBottom: 80, // Extra margin to avoid tab bar
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
