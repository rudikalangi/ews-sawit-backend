import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, StatusBar, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveTreeSurvey } from '../database';

export const SurveyFormScreen = ({ navigation, route }: any) => {
  const [activeTab, setActiveTab] = useState('form'); // 'peta' | 'form'
  const [pokoks, setPokoks] = useState<number[]>([1]); // Array of recorded pokok numbers for Baris 1
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPokok, setSelectedPokok] = useState<number | null>(null);
  
  // Form state
  const [formTikus, setFormTikus] = useState(false);
  const [formTirataba, setFormTirataba] = useState(false);
  const [formUlatApi, setFormUlatApi] = useState(false);
  const [formUlatKantung, setFormUlatKantung] = useState(false);

  const afdeling = route?.params?.afdeling || { id: 'A', name: 'Afdeling A' };
  const blok = route?.params?.blok || 'J15';
  const sessionId = route?.params?.sessionId || 'SES_TEST';

  const handleAddPokok = () => {
    setPokoks([...pokoks, pokoks.length + 1]);
  };

  const handlePokokPress = (pokokNumber: number, isLast: boolean) => {
    if (isLast) {
      handleAddPokok();
    } else {
      setSelectedPokok(pokokNumber);
      setFormTikus(false);
      setFormTirataba(false);
      setFormUlatApi(false);
      setFormUlatKantung(false);
      setModalVisible(true);
    }
  };

  const handleSaveTree = () => {
    if (selectedPokok === null) return;
    
    saveTreeSurvey({
      id: `TR_${Date.now()}_${selectedPokok}`,
      session_id: sessionId,
      row_number: 1,
      tree_number: selectedPokok,
      tikus: formTikus,
      tirataba: formTirataba,
      ulat_api: formUlatApi,
      ulat_kantung: formUlatKantung,
      bukti_foto: null, // Placeholder for actual camera photo
      created_at: new Date().toISOString()
    });

    setModalVisible(false);
  };

  const handleCancel = () => {
    navigation.navigate('Main');
  };

  const handleFinish = () => {
    // Session is already saved, tree data is saved per tree.
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'peta' && styles.activeTab]}
            onPress={() => setActiveTab('peta')}
          >
            <Ionicons name="map" size={20} color={activeTab === 'peta' ? "#0f172a" : "#94a3b8"} />
            <Text style={[styles.tabText, activeTab === 'peta' && styles.activeTabText]}>Peta</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'form' && styles.activeTab]}
            onPress={() => setActiveTab('form')}
          >
            <Ionicons name="list" size={20} color={activeTab === 'form' ? "#0f172a" : "#94a3b8"} />
            <Text style={[styles.tabText, activeTab === 'form' && styles.activeTabText]}>Form</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.infoTitle}>{afdeling.name}, Blok {blok}</Text>
          <Text style={styles.infoSubtitle}>Surveyed: {pokoks.length - 1} Pokok</Text>
        </View>
        <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
      </View>

      <View style={styles.container}>
        {activeTab === 'form' ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.barisHeader}>
              <Text style={styles.barisTitle}>BARIS 1</Text>
            </View>

            <View style={styles.pokokRow}>
              {pokoks.map((p, index) => {
                const isLast = index === pokoks.length - 1;
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.pokokCircle, !isLast && styles.pokokCircleFilled]}
                    onPress={() => handlePokokPress(p, isLast)}
                  >
                    {isLast ? (
                      <Ionicons name="add" size={24} color="#f8fafc" />
                    ) : (
                      <Text style={styles.pokokText}>{p}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity style={styles.addBarisButton}>
              <Ionicons name="add" size={20} color="#a3e635" />
              <Text style={styles.addBarisText}>TAMBAH BARIS</Text>
            </TouchableOpacity>

          </ScrollView>
        ) : (
          <View style={styles.mapContainer}>
            <Text style={styles.mapPlaceholderText}>Peta Offline Area Blok {blok}</Text>
            <Ionicons name="map-outline" size={64} color="#334155" />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close" size={20} color="#f8fafc" style={{ marginRight: 8 }} />
          <Text style={styles.cancelButtonText}>KEMBALI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Ionicons name="checkmark" size={20} color="#0f172a" style={{ marginRight: 8 }} />
          <Text style={styles.finishButtonText}>SELESAI SURVEY</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Form Hama */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Pokok {selectedPokok}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Tikus</Text>
              <Switch value={formTikus} onValueChange={setFormTikus} trackColor={{ false: "#334155", true: "#3b82f6" }} />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Tirataba</Text>
              <Switch value={formTirataba} onValueChange={setFormTirataba} trackColor={{ false: "#334155", true: "#3b82f6" }} />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Ulat Api</Text>
              <Switch value={formUlatApi} onValueChange={setFormUlatApi} trackColor={{ false: "#334155", true: "#3b82f6" }} />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Ulat Kantung</Text>
              <Switch value={formUlatKantung} onValueChange={setFormUlatKantung} trackColor={{ false: "#334155", true: "#3b82f6" }} />
            </View>

            <TouchableOpacity style={styles.fotoButton}>
              <Ionicons name="camera" size={24} color="#f8fafc" style={{ marginRight: 8 }} />
              <Text style={styles.fotoButtonText}>AMBIL FOTO BUKTI</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTree}>
              <Text style={styles.saveButtonText}>SIMPAN DATA POKOK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#a3e635',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#0f172a',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  barisHeader: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  barisTitle: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pokokRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  pokokCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  pokokCircleFilled: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  pokokText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBarisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addBarisText: {
    color: '#a3e635',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#64748b',
    marginTop: 16,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 14,
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#a3e635',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  finishButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  formLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fotoButton: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  fotoButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  saveButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
