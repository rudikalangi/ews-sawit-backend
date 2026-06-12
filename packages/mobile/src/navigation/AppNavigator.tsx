import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { BerandaScreen } from '../screens/BerandaScreen';
import { SyncScreen } from '../screens/SyncScreen';
import { RKHScreen } from '../screens/RKHScreen';
import { LHMScreen } from '../screens/LHMScreen';
import { SurveyFormScreen } from '../screens/SurveyFormScreen';
import { PilihBlokScreen } from '../screens/PilihBlokScreen';
import { SelfieScreen } from '../screens/SelfieScreen';
import { KonfirmasiSesiScreen } from '../screens/KonfirmasiSesiScreen';
import { View, Text } from 'react-native';

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#fff', fontSize: 20 }}>{name} Screen</Text>
  </View>
);

const ProfileScreen = () => <PlaceholderScreen name="Profile" />;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.2,
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#a3e635',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'RKH') iconName = focused ? 'location' : 'location-outline';
          else if (route.name === 'LHM') iconName = focused ? 'clipboard' : 'clipboard-outline';
          else if (route.name === 'Sync') iconName = focused ? 'cloud-download' : 'cloud-download-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={BerandaScreen} options={{ tabBarLabel: 'Beranda' }} />
      <Tab.Screen name="RKH" component={RKHScreen} />
      <Tab.Screen name="LHM" component={LHMScreen} />
      <Tab.Screen name="Sync" component={SyncScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        
        {/* RKH Workflow Screens */}
        <Stack.Screen name="PilihBlok" component={PilihBlokScreen} />
        <Stack.Screen name="Selfie" component={SelfieScreen} />
        <Stack.Screen name="KonfirmasiSesi" component={KonfirmasiSesiScreen} />
        <Stack.Screen name="SurveyForm" component={SurveyFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
