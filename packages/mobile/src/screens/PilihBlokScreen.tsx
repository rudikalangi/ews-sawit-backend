import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PilihBlokScreen = ({ route, navigation }: any) => {
  const { afdeling } = route.params;
  const [selectedBlok, setSelectedBlok] = useState('J15');

  // Placeholder data for blocks in the Afdeling
  const blocks = ['J14', 'J15', 'J16', 'K14', 'K15'];

  const handleNext = () => {
    navigation.navigate('Selfie', { afdeling, blok: selectedBlok });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PILIH BLOK - LANGKAH 2</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>---- PETA AFD {afdeling.id} ----</Text>
          <Ionicons name="map-outline" size={48} color="#334155" />
          <Text style={styles.mapSubText}>Pilih Blok pada peta atau dropdown di bawah</Text>
        </View>

        <Text style={styles.label}>PILIH BLOK</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownText}>{selectedBlok}</Text>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoTitle}>INFORMASI BLOK</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blok</Text>
            <Text style={styles.infoValue}>{selectedBlok}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Luas</Text>
            <Text style={styles.infoValue}>21.92 Ha</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pokok</Text>
            <Text style={styles.infoValue}>150</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>AMBIL SELFIE VERIFIKASI</Text>
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
  mapPlaceholder: {
    width: '100%',
    height: 180,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1e293b',
  },
  mapText: {
    color: '#3b82f6',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  mapSubText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  dropdownText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    width: '100%',
    marginVertical: 4,
  },
  footer: {
    marginTop: 24,
    marginBottom: 40,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
