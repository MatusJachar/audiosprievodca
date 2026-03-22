import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BackgroundWrapper from '../components/BackgroundWrapper';

export default function TravelInfo() {
  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  };

  const handleOpenMaps = (destination: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps');
    });
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleOpenGPS = () => {
    // GPS: 48°59.98956'N, 20°46.08196'E
    const url = 'https://www.google.com/maps/search/?api=1&query=48.999826,20.768033';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps');
    });
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>How to Get Back</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Location & GPS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={24} color="#4A90D9" />
              <Text style={styles.sectionTitle}>Castle Location</Text>
            </View>
            <Text style={styles.address}>Spišské Podhradie</Text>
            <Text style={styles.addressDetail}>053 04, Slovakia</Text>
            
            <View style={styles.gpsBox}>
              <Ionicons name="navigate" size={18} color="#4CAF50" />
              <Text style={styles.gpsText}>GPS: 48°59.98956'N, 20°46.08196'E</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={handleOpenGPS}
            >
              <Ionicons name="navigate" size={20} color="#000" />
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Opening Hours */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={24} color="#4A90D9" />
              <Text style={styles.sectionTitle}>Opening Hours</Text>
            </View>
            <View style={styles.hoursContainer}>
              <View style={styles.hoursRow}>
                <View style={styles.seasonLabel}>
                  <Text style={styles.seasonIcon}>☀️</Text>
                  <Text style={styles.hoursDay}>Summer (Jun - Sep)</Text>
                </View>
                <Text style={styles.hoursTime}>9:00 - 18:00</Text>
              </View>
              <View style={styles.hoursRow}>
                <View style={styles.seasonLabel}>
                  <Text style={styles.seasonIcon}>🍂</Text>
                  <Text style={styles.hoursDay}>Spring/Autumn (Apr, Oct, Nov)</Text>
                </View>
                <Text style={styles.hoursTime}>9:00 - 16:00</Text>
              </View>
            </View>
            <Text style={styles.hoursNote}>* Open Monday - Sunday</Text>
          </View>

          {/* By Car */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car" size={24} color="#4A90D9" />
              <Text style={styles.sectionTitle}>By Car</Text>
            </View>
            <Text style={styles.infoText}>
              The easiest way to reach Spiš Castle is by car. Parking is available directly below the castle.
            </Text>
            
            <View style={styles.routeBox}>
              <Text style={styles.routeTitle}>🛣️ Route:</Text>
              <Text style={styles.routeText}>
                From D1 highway, exit towards Levoča, then continue to Spišské Podhradie.
              </Text>
            </View>
            
            <View style={styles.distanceList}>
              <View style={styles.distanceItem}>
                <Text style={styles.distanceCity}>From Poprad:</Text>
                <Text style={styles.distanceValue}>~40 km</Text>
              </View>
              <View style={styles.distanceItem}>
                <Text style={styles.distanceCity}>From Spišská Nová Ves:</Text>
                <Text style={styles.distanceValue}>~25 km</Text>
              </View>
              <View style={styles.distanceItem}>
                <Text style={styles.distanceCity}>From Košice:</Text>
                <Text style={styles.distanceValue}>~60 km</Text>
              </View>
            </View>
            
            <View style={styles.parkingInfo}>
              <Ionicons name="car" size={18} color="#4CAF50" />
              <Text style={styles.parkingText}>
                🅿️ Parking: Asphalt road leads to parking below castle. May be full during peak season - alternative parking along the road.
              </Text>
            </View>
          </View>

          {/* By Bus */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bus" size={24} color="#4A90D9" />
              <Text style={styles.sectionTitle}>By Bus</Text>
            </View>
            <Text style={styles.infoText}>
              Take a bus to Spišské Podhradie. From there, it's approximately 30-45 minutes walk to the castle on a tourist trail.
            </Text>
            
            <View style={styles.connectionList}>
              <Text style={styles.connectionTitle}>Bus connections:</Text>
              <Text style={styles.connectionItem}>• From Spišská Nová Ves (20 min)</Text>
              <Text style={styles.connectionItem}>• From Levoča (15 min)</Text>
              <Text style={styles.connectionItem}>• From Košice (1.5 hours)</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => handleOpenLink('https://cp.hnonline.sk/')}
            >
              <Ionicons name="time" size={18} color="#4A90D9" />
              <Text style={styles.linkButtonText}>Check Bus Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* By Train */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="train" size={24} color="#4A90D9" />
              <Text style={styles.sectionTitle}>By Train</Text>
            </View>
            <Text style={styles.infoText}>
              From Poprad or Spišská Nová Ves, take a train to Spišské Vlachy and transfer to Spišské Podhradie.
            </Text>
            
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={18} color="#FF6B6B" />
              <Text style={styles.warningText}>
                Trains may not wait for connections - verify your connection in advance. Train to Spišské Podhradie runs only during summer tourist season!
              </Text>
            </View>
            
            <View style={styles.walkInfo}>
              <Text style={styles.walkTitle}>🚶 Walking distances:</Text>
              <Text style={styles.walkItem}>• From bus station: ~30-45 min</Text>
              <Text style={styles.walkItem}>• From train station: ~20 min</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => handleOpenLink('https://www.zssk.sk/en/')}
            >
              <Ionicons name="train" size={18} color="#4A90D9" />
              <Text style={styles.linkButtonText}>Train Timetable (ZSSK)</Text>
            </TouchableOpacity>
          </View>

          {/* Tourist Train */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="subway" size={24} color="#4A90D9" />
              <Text style={styles.sectionTitle}>Tourist Train 🚂</Text>
            </View>
            <Text style={styles.infoText}>
              During the season, a tourist train runs from the bus station in Spišské Podhradie directly to the castle.
            </Text>
            <Text style={styles.highlightText}>
              ⚠️ Check schedule in advance - runs only on selected days and times!
            </Text>
          </View>

          {/* Taxi */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={24} color="#4A90D9" />
              <Text style={styles.sectionTitle}>Taxi / Transport</Text>
            </View>
            <Text style={styles.infoText}>
              From Spišské Podhradie to Prešov, Spišská Nová Ves, or Poprad:
            </Text>
            
            <TouchableOpacity 
              style={styles.taxiMainItem}
              onPress={() => handleCall('+421944376007')}
            >
              <View style={styles.taxiInfo}>
                <Text style={styles.taxiName}>🚕 Taxi Service</Text>
                <Text style={styles.taxiNumber}>+421 944 376 007</Text>
                <Text style={styles.taxiDest}>To: Prešov, Sp. Nová Ves, Poprad</Text>
              </View>
              <View style={styles.callButton}>
                <Ionicons name="call" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 12,
  },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.15)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
  },
  gpsText: {
    fontSize: 13,
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90D9',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  hoursContainer: {
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  seasonLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  seasonIcon: {
    fontSize: 16,
  },
  hoursDay: {
    fontSize: 14,
    color: '#ccc',
  },
  hoursTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90D9',
  },
  hoursNote: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 16,
  },
  routeBox: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90D9',
    marginBottom: 6,
  },
  routeText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  distanceList: {
    marginBottom: 16,
  },
  distanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  distanceCity: {
    fontSize: 14,
    color: '#ccc',
  },
  distanceValue: {
    fontSize: 14,
    color: '#4A90D9',
    fontWeight: '600',
  },
  parkingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76,175,80,0.1)',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  parkingText: {
    fontSize: 13,
    color: '#ccc',
    flex: 1,
    lineHeight: 20,
  },
  connectionList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  connectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  connectionItem: {
    fontSize: 14,
    color: '#ccc',
    paddingVertical: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90D9',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  warningText: {
    fontSize: 13,
    color: '#FF6B6B',
    flex: 1,
    lineHeight: 20,
  },
  walkInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  walkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  walkItem: {
    fontSize: 14,
    color: '#ccc',
    paddingVertical: 4,
  },
  highlightText: {
    fontSize: 14,
    color: '#4A90D9',
    fontStyle: 'italic',
    marginTop: 8,
  },
  taxiMainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(76,175,80,0.15)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.3)',
  },
  taxiInfo: {
    flex: 1,
  },
  taxiName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  taxiNumber: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taxiDest: {
    fontSize: 12,
    color: '#aaa',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
