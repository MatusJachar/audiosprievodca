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
          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Castle Location</Text>
            </View>
            <Text style={styles.address}>Spišské Podhradie</Text>
            <Text style={styles.addressDetail}>053 04, Slovakia</Text>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => handleOpenMaps('Spiš Castle, Slovakia')}
            >
              <Ionicons name="navigate" size={20} color="#000" />
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>

          {/* By Car */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>By Car</Text>
            </View>
            <Text style={styles.infoText}>
              • From Košice: ~60 km (45 min) via E50{"\n"}
              • From Poprad: ~45 km (35 min) via Route 18{"\n"}
              • From Prešov: ~50 km (40 min) via E50{"\n"}
              • Free parking available at castle base
            </Text>
          </View>

          {/* By Bus */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bus" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>By Bus</Text>
            </View>
            <Text style={styles.infoText}>
              Regular bus service from:{"\n"}
              • Spišská Nová Ves (20 min){"\n"}
              • Levoča (15 min){"\n"}
              • Košice (1.5 hours)
            </Text>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => handleOpenLink('https://cp.hnonline.sk/')}
            >
              <Ionicons name="time" size={18} color="#FFD700" />
              <Text style={styles.linkButtonText}>Check Bus Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* By Train */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="train" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>By Train</Text>
            </View>
            <Text style={styles.infoText}>
              Nearest train station:{"\n"}
              • Spišské Podhradie (2 km walk to castle){"\n"}
              • Spišská Nová Ves (then bus)
            </Text>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => handleOpenLink('https://www.zssk.sk/en/')}
            >
              <Ionicons name="train" size={18} color="#FFD700" />
              <Text style={styles.linkButtonText}>Train Timetable (ZSSK)</Text>
            </TouchableOpacity>
          </View>

          {/* Taxi */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Taxi Services</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.taxiItem}
              onPress={() => handleCall('+421901234567')}
            >
              <View style={styles.taxiInfo}>
                <Text style={styles.taxiName}>City Taxi Spišská</Text>
                <Text style={styles.taxiNumber}>+421 901 234 567</Text>
              </View>
              <View style={styles.callButton}>
                <Ionicons name="call" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.taxiItem}
              onPress={() => handleCall('+421902345678')}
            >
              <View style={styles.taxiInfo}>
                <Text style={styles.taxiName}>Express Taxi</Text>
                <Text style={styles.taxiNumber}>+421 902 345 678</Text>
              </View>
              <View style={styles.callButton}>
                <Ionicons name="call" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.taxiItem}
              onPress={() => handleCall('+421903456789')}
            >
              <View style={styles.taxiInfo}>
                <Text style={styles.taxiName}>Levoča Taxi</Text>
                <Text style={styles.taxiNumber}>+421 903 456 789</Text>
              </View>
              <View style={styles.callButton}>
                <Ionicons name="call" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Opening Hours */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Opening Hours</Text>
            </View>
            <View style={styles.hoursContainer}>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>May - September</Text>
                <Text style={styles.hoursTime}>9:00 - 19:00</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>April, October</Text>
                <Text style={styles.hoursTime}>9:00 - 17:00</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>November - March</Text>
                <Text style={styles.hoursTime}>10:00 - 16:00</Text>
              </View>
            </View>
            <Text style={styles.hoursNote}>* Last entry 30 min before closing</Text>
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
    marginBottom: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  infoText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
  taxiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  taxiInfo: {
    flex: 1,
  },
  taxiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  taxiNumber: {
    fontSize: 14,
    color: '#FFD700',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoursContainer: {
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  hoursDay: {
    fontSize: 15,
    color: '#ccc',
  },
  hoursTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
  hoursNote: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
