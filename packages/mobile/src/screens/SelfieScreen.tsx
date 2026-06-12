import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';

export const SelfieScreen = ({ route, navigation }: any) => {
  const { afdeling, blok } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');

      if (locationStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUsePhoto = async () => {
    // In a real app, we would take a picture and pass the URI.
    // For now, we just pass mock data.
    navigation.navigate('KonfirmasiSesi', { 
      afdeling, 
      blok,
      location,
      time: currentTime.toISOString()
    });
  };

  if (hasPermission === null) {
    return <View style={styles.centerContainer}><Text style={styles.text}>Requesting permissions...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.centerContainer}><Text style={styles.text}>No access to camera or location</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERSETUJUAN GPS</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.instruction}>Pastikan wajah terlihat jelas</Text>
        
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing="front"
            ref={cameraRef}
          >
            <View style={styles.overlay}>
              <View style={styles.gpsInfo}>
                <Ionicons name="location" size={16} color="#ef4444" style={styles.gpsIcon} />
                <View>
                  <Text style={styles.gpsText}>
                    Lat: {location ? location.coords.latitude.toFixed(6) : 'Loading...'}
                  </Text>
                  <Text style={styles.gpsText}>
                    Lng: {location ? location.coords.longitude.toFixed(6) : 'Loading...'}
                  </Text>
                  <Text style={styles.gpsText}>
                    Waktu: {currentTime.toLocaleTimeString('id-ID')}
                  </Text>
                  <Text style={styles.gpsText}>
                    Lokasi: AFD {afdeling.id} / BLOK {blok}
                  </Text>
                </View>
              </View>
            </View>
          </CameraView>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.retakeButton} onPress={() => {}}>
            <Text style={styles.retakeButtonText}>AMBIL ULANG</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.useButton} onPress={handleUsePhoto}>
            <Text style={styles.useButtonText}>GUNAKAN FOTO</Text>
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
  centerContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#f8fafc',
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
    alignItems: 'center',
  },
  instruction: {
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 24,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginBottom: 32,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  gpsInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    margin: 16,
    borderRadius: 12,
  },
  gpsIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  gpsText: {
    color: '#a3e635',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  retakeButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  useButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  useButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
