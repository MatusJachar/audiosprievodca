import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#4A90D9',
  secondary: '#7B68EE',
  accent: '#E8B923',
  dark: '#1a1a2e',
  darker: '#0f0f1a',
  card: '#252542',
  text: '#ffffff',
  textSecondary: '#b8c5d6',
  danger: '#FF5252',
  success: '#4CAF50',
};

type TabType = 'stops' | 'partners' | 'content' | 'deeplink' | 'stats';

interface TourStopItem {
  id: string;
  stop_number: number | null;
  stop_name: string | null;
  content: Record<string, { title: string; description: string }>;
}

interface PartnerItem {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  opening_hours: string;
  price_range: string;
  rating: number;
  discount_text: string;
  is_active: boolean;
  sort_order: number;
}

interface AdminStats {
  total_stops: number;
  total_audio_files: number;
  languages_with_audio: number;
  total_partners: number;
  active_partners: number;
  total_referrals: number;
  total_users: number;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tourStops, setTourStops] = useState<TourStopItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStop, setEditingStop] = useState<TourStopItem | null>(null);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [showAddPartner, setShowAddPartner] = useState(false);

  // New partner form state
  const [newPartner, setNewPartner] = useState({
    name: '', category: 'restaurant', description: '', address: '',
    phone: '', email: '', website: '', opening_hours: '', price_range: '',
    rating: 0, discount_text: '', is_active: true, sort_order: 0,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await fetch(`${API_URL}/api/admin/stats`);
        setStats(await res.json());
      } else if (activeTab === 'stops') {
        const res = await fetch(`${API_URL}/api/tour-stops`);
        setTourStops(await res.json());
      } else if (activeTab === 'partners') {
        const res = await fetch(`${API_URL}/api/partners?active_only=false`);
        setPartners(await res.json());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ TOUR STOPS ============

  const handleUpdateStop = async (stopId: string, lang: string, title: string, description: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tour-stops/${stopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { [lang]: { title, description } } }),
      });
      if (res.ok) {
        Alert.alert('Uspech', 'Zastavka aktualizovana');
        setEditingStop(null);
        loadData();
      } else {
        Alert.alert('Chyba', 'Nepodarilo sa aktualizovat zastavku');
      }
    } catch (error) {
      Alert.alert('Chyba', 'Sietova chyba');
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    Alert.alert('Potvrdit', 'Naozaj chcete vymazat tuto zastavku?', [
      { text: 'Zrusit', style: 'cancel' },
      {
        text: 'Vymazat', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/tour-stops/${stopId}`, { method: 'DELETE' });
            loadData();
          } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa vymazat');
          }
        },
      },
    ]);
  };

  // ============ PARTNERS ============

  const handleCreatePartner = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner),
      });
      if (res.ok) {
        Alert.alert('Uspech', 'Partner pridany');
        setShowAddPartner(false);
        setNewPartner({
          name: '', category: 'restaurant', description: '', address: '',
          phone: '', email: '', website: '', opening_hours: '', price_range: '',
          rating: 0, discount_text: '', is_active: true, sort_order: 0,
        });
        loadData();
      }
    } catch (error) {
      Alert.alert('Chyba', 'Nepodarilo sa pridat partnera');
    }
  };

  const handleUpdatePartner = async (partnerId: string, data: Partial<PartnerItem>) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        Alert.alert('Uspech', 'Partner aktualizovany');
        setEditingPartner(null);
        loadData();
      }
    } catch (error) {
      Alert.alert('Chyba', 'Nepodarilo sa aktualizovat partnera');
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    Alert.alert('Potvrdit', 'Naozaj chcete vymazat tohto partnera?', [
      { text: 'Zrusit', style: 'cancel' },
      {
        text: 'Vymazat', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/admin/partners/${partnerId}`, { method: 'DELETE' });
            loadData();
          } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa vymazat');
          }
        },
      },
    ]);
  };

  const handleTogglePartner = async (partner: PartnerItem) => {
    await handleUpdatePartner(partner.id, { is_active: !partner.is_active });
  };

  // ============ RENDER FUNCTIONS ============

  const renderStats = () => {
    if (!stats) return <ActivityIndicator color={COLORS.primary} />;
    
    return (
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="location" size={28} color={COLORS.primary} />
          <Text style={styles.statNumber}>{stats.total_stops}</Text>
          <Text style={styles.statLabel}>Zastavok</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="musical-notes" size={28} color={COLORS.accent} />
          <Text style={styles.statNumber}>{stats.total_audio_files}</Text>
          <Text style={styles.statLabel}>Audio suborov</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="language" size={28} color={COLORS.secondary} />
          <Text style={styles.statNumber}>{stats.languages_with_audio}</Text>
          <Text style={styles.statLabel}>Jazykov</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="business" size={28} color="#4ECDC4" />
          <Text style={styles.statNumber}>{stats.total_partners}</Text>
          <Text style={styles.statLabel}>Partnerov</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="link" size={28} color="#FF6B6B" />
          <Text style={styles.statNumber}>{stats.total_referrals}</Text>
          <Text style={styles.statLabel}>Odkazov</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={28} color="#A8E6CF" />
          <Text style={styles.statNumber}>{stats.total_users}</Text>
          <Text style={styles.statLabel}>Uzivatelov</Text>
        </View>
      </View>
    );
  };

  const renderStops = () => (
    <View>
      {tourStops.map(stop => (
        <TouchableOpacity
          key={stop.id}
          style={styles.listItem}
          onPress={() => setEditingStop(stop)}
        >
          <View style={styles.listItemLeft}>
            <View style={[styles.stopBadge, !stop.stop_number && styles.legendBadge]}>
              {stop.stop_number ? (
                <Text style={styles.stopBadgeText}>{stop.stop_number}</Text>
              ) : (
                <Ionicons name="book" size={16} color="#000" />
              )}
            </View>
            <View style={styles.listItemInfo}>
              <Text style={styles.listItemTitle}>
                {stop.content?.sk?.title || stop.content?.en?.title || stop.stop_name || 'Bez nazvu'}
              </Text>
              <Text style={styles.listItemSubtitle}>
                {Object.keys(stop.content || {}).length} jazykov
              </Text>
            </View>
          </View>
          <View style={styles.listItemActions}>
            <TouchableOpacity onPress={() => handleDeleteStop(stop.id)}>
              <Ionicons name="trash" size={20} color={COLORS.danger} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPartners = () => (
    <View>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddPartner(true)}>
        <Ionicons name="add-circle" size={20} color="#000" />
        <Text style={styles.addButtonText}>Pridat partnera</Text>
      </TouchableOpacity>

      {partners.map(partner => (
        <TouchableOpacity
          key={partner.id}
          style={[styles.listItem, !partner.is_active && styles.listItemInactive]}
          onPress={() => setEditingPartner(partner)}
        >
          <View style={styles.listItemLeft}>
            <View style={[styles.categoryDot, { backgroundColor: partner.is_active ? COLORS.success : COLORS.danger }]} />
            <View style={styles.listItemInfo}>
              <Text style={styles.listItemTitle}>{partner.name}</Text>
              <Text style={styles.listItemSubtitle}>
                {partner.category} | {partner.phone || 'Bez telefonu'}
              </Text>
            </View>
          </View>
          <View style={styles.listItemActions}>
            <TouchableOpacity onPress={() => handleTogglePartner(partner)}>
              <Ionicons
                name={partner.is_active ? 'eye' : 'eye-off'}
                size={20}
                color={partner.is_active ? COLORS.success : COLORS.danger}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePartner(partner.id)}>
              <Ionicons name="trash" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => (
    <View>
      <TouchableOpacity
        style={styles.contentCard}
        onPress={() => router.push('/admin-content')}
      >
        <Ionicons name="document-text" size={24} color={COLORS.primary} />
        <View style={styles.contentCardInfo}>
          <Text style={styles.contentCardTitle}>Upravit obsah</Text>
          <Text style={styles.contentCardSubtitle}>Cestovne info, obchod, objavuj region</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderDeepLink = () => (
    <View>
      <View style={styles.infoCard}>
        <Ionicons name="link" size={24} color={COLORS.primary} />
        <Text style={styles.infoCardTitle}>GastroFlow Deep Linking</Text>
        <Text style={styles.infoCardText}>
          Prepojenie s restauracnou aplikaciou GastroFlow.{'\n'}
          URL schema: gastroflow:// a audioguide://
        </Text>
      </View>
      
      <View style={styles.deepLinkSection}>
        <Text style={styles.sectionTitle}>Konfigurovane URL schemy</Text>
        <View style={styles.deepLinkItem}>
          <Text style={styles.deepLinkLabel}>Audio Guide</Text>
          <Text style={styles.deepLinkValue}>audioguide://</Text>
        </View>
        <View style={styles.deepLinkItem}>
          <Text style={styles.deepLinkLabel}>GastroFlow</Text>
          <Text style={styles.deepLinkValue}>gastroflow://</Text>
        </View>
        <View style={styles.deepLinkItem}>
          <Text style={styles.deepLinkLabel}>Web Fallback</Text>
          <Text style={styles.deepLinkValue}>https://spisskyhrad.sk</Text>
        </View>
      </View>

      <View style={styles.deepLinkSection}>
        <Text style={styles.sectionTitle}>Typy odkazov</Text>
        <View style={styles.linkTypeItem}>
          <View style={[styles.linkTypeBadge, { backgroundColor: '#4ECDC4' }]}>
            <Text style={styles.linkTypeBadgeText}>DIRECT</Text>
          </View>
          <Text style={styles.linkTypeDesc}>gastroflow://restaurant/ID</Text>
        </View>
        <View style={styles.linkTypeItem}>
          <View style={[styles.linkTypeBadge, { backgroundColor: COLORS.accent }]}>
            <Text style={styles.linkTypeBadgeText}>REFERRAL</Text>
          </View>
          <Text style={styles.linkTypeDesc}>audioguide://partner/ID?ref=gastroflow</Text>
        </View>
        <View style={styles.linkTypeItem}>
          <View style={[styles.linkTypeBadge, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.linkTypeBadgeText}>EMBED</Text>
          </View>
          <Text style={styles.linkTypeDesc}>WebView embed v aplikacii</Text>
        </View>
      </View>
    </View>
  );

  // ============ EDIT STOP MODAL ============

  const EditStopModal = () => {
    const [editLang, setEditLang] = useState('sk');
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    useEffect(() => {
      if (editingStop) {
        const content = editingStop.content?.[editLang];
        setEditTitle(content?.title || '');
        setEditDesc(content?.description || '');
      }
    }, [editingStop, editLang]);

    if (!editingStop) return null;

    const langs = ['sk', 'en', 'de', 'pl', 'hu', 'ru', 'es', 'zh', 'fr'];

    return (
      <Modal visible={!!editingStop} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Upravit zastavku {editingStop.stop_number || editingStop.stop_name}
              </Text>
              <TouchableOpacity onPress={() => setEditingStop(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langTabs}>
              {langs.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.langTab, editLang === l && styles.langTabActive]}
                  onPress={() => setEditLang(l)}
                >
                  <Text style={[styles.langTabText, editLang === l && styles.langTabTextActive]}>
                    {l.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Nazov</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Zadajte nazov..."
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Popis</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Zadajte popis..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={5}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleUpdateStop(editingStop.id, editLang, editTitle, editDesc)}
            >
              <Text style={styles.saveButtonText}>Ulozit zmeny</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ============ ADD PARTNER MODAL ============

  const AddPartnerModal = () => {
    if (!showAddPartner) return null;

    const categories = ['restaurant', 'hotel', 'shop', 'attraction', 'service'];

    return (
      <Modal visible={showAddPartner} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novy partner</Text>
                <TouchableOpacity onPress={() => setShowAddPartner(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nazov *</Text>
              <TextInput
                style={styles.input}
                value={newPartner.name}
                onChangeText={v => setNewPartner(p => ({ ...p, name: v }))}
                placeholder="Nazov podniku"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Kategoria</Text>
              <View style={styles.categoryPicker}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryOption, newPartner.category === c && styles.categoryOptionActive]}
                    onPress={() => setNewPartner(p => ({ ...p, category: c }))}
                  >
                    <Text style={[styles.categoryOptionText, newPartner.category === c && styles.categoryOptionTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Popis</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newPartner.description}
                onChangeText={v => setNewPartner(p => ({ ...p, description: v }))}
                placeholder="Popis podniku"
                placeholderTextColor="#666"
                multiline
              />

              <Text style={styles.inputLabel}>Adresa</Text>
              <TextInput
                style={styles.input}
                value={newPartner.address}
                onChangeText={v => setNewPartner(p => ({ ...p, address: v }))}
                placeholder="Adresa"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={newPartner.phone}
                onChangeText={v => setNewPartner(p => ({ ...p, phone: v }))}
                placeholder="+421..."
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={newPartner.email}
                onChangeText={v => setNewPartner(p => ({ ...p, email: v }))}
                placeholder="email@example.com"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Web</Text>
              <TextInput
                style={styles.input}
                value={newPartner.website}
                onChangeText={v => setNewPartner(p => ({ ...p, website: v }))}
                placeholder="https://..."
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Otvaracie hodiny</Text>
              <TextInput
                style={styles.input}
                value={newPartner.opening_hours}
                onChangeText={v => setNewPartner(p => ({ ...p, opening_hours: v }))}
                placeholder="10:00 - 22:00"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Cenova kategoria</Text>
              <TextInput
                style={styles.input}
                value={newPartner.price_range}
                onChangeText={v => setNewPartner(p => ({ ...p, price_range: v }))}
                placeholder="EUR EUR"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Zlava pre uzivatelov</Text>
              <TextInput
                style={styles.input}
                value={newPartner.discount_text}
                onChangeText={v => setNewPartner(p => ({ ...p, discount_text: v }))}
                placeholder="10% zlava..."
                placeholderTextColor="#666"
              />

              <TouchableOpacity
                style={[styles.saveButton, !newPartner.name && styles.saveButtonDisabled]}
                onPress={handleCreatePartner}
                disabled={!newPartner.name}
              >
                <Text style={styles.saveButtonText}>Pridat partnera</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ============ EDIT PARTNER MODAL ============

  const EditPartnerModal = () => {
    const [editData, setEditData] = useState<Partial<PartnerItem>>({});

    useEffect(() => {
      if (editingPartner) {
        setEditData({
          name: editingPartner.name,
          description: editingPartner.description,
          address: editingPartner.address,
          phone: editingPartner.phone,
          email: editingPartner.email,
          website: editingPartner.website,
          opening_hours: editingPartner.opening_hours,
          price_range: editingPartner.price_range,
          discount_text: editingPartner.discount_text,
        });
      }
    }, [editingPartner]);

    if (!editingPartner) return null;

    return (
      <Modal visible={!!editingPartner} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upravit: {editingPartner.name}</Text>
                <TouchableOpacity onPress={() => setEditingPartner(null)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {Object.entries({
                name: 'Nazov', description: 'Popis', address: 'Adresa',
                phone: 'Telefon', email: 'Email', website: 'Web',
                opening_hours: 'Otvaracie hodiny', price_range: 'Cenova kategoria',
                discount_text: 'Zlava',
              }).map(([key, label]) => (
                <View key={key}>
                  <Text style={styles.inputLabel}>{label}</Text>
                  <TextInput
                    style={[styles.input, key === 'description' && styles.textArea]}
                    value={(editData as any)[key] || ''}
                    onChangeText={v => setEditData(d => ({ ...d, [key]: v }))}
                    placeholder={label}
                    placeholderTextColor="#666"
                    multiline={key === 'description'}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleUpdatePartner(editingPartner.id, editData)}
              >
                <Text style={styles.saveButtonText}>Ulozit zmeny</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ============ MAIN RENDER ============

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'stats', label: 'Prehlad', icon: 'stats-chart' },
    { key: 'stops', label: 'Zastavky', icon: 'location' },
    { key: 'partners', label: 'Partneri', icon: 'business' },
    { key: 'content', label: 'Obsah', icon: 'document-text' },
    { key: 'deeplink', label: 'Links', icon: 'link' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#000' : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'stops' && renderStops()}
            {activeTab === 'partners' && renderPartners()}
            {activeTab === 'content' && renderContent()}
            {activeTab === 'deeplink' && renderDeepLink()}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <EditStopModal />
      <AddPartnerModal />
      <EditPartnerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darker },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    backgroundColor: COLORS.dark, borderBottomWidth: 1, borderBottomColor: 'rgba(74,144,217,0.2)',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  tabsScroll: { maxHeight: 52, backgroundColor: COLORS.dark },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.card, gap: 6,
    borderWidth: 1, borderColor: 'rgba(74,144,217,0.15)',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: '#000', fontWeight: '700' },
  content: { flex: 1, padding: 16 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%', backgroundColor: COLORS.card, borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(74,144,217,0.15)',
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },

  // List Items
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(74,144,217,0.1)',
  },
  listItemInactive: { opacity: 0.5 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  listItemInfo: { flex: 1 },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  listItemSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  listItemActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stopBadge: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  legendBadge: { backgroundColor: COLORS.accent },
  stopBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },

  // Add Button
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, marginBottom: 16, gap: 8,
  },
  addButtonText: { fontSize: 15, fontWeight: '600', color: '#000' },

  // Content Cards
  contentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 12, padding: 16, gap: 14, borderWidth: 1, borderColor: 'rgba(74,144,217,0.15)',
  },
  contentCardInfo: { flex: 1 },
  contentCardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  contentCardSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  // Deep Link
  infoCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 10, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(74,144,217,0.2)',
  },
  infoCardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  infoCardText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  deepLinkSection: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 12 },
  deepLinkItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  deepLinkLabel: { fontSize: 14, color: COLORS.text },
  deepLinkValue: { fontSize: 13, color: COLORS.textSecondary, fontFamily: 'monospace' },
  linkTypeItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  linkTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  linkTypeBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  linkTypeDesc: { fontSize: 13, color: COLORS.textSecondary, fontFamily: 'monospace' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.dark, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },

  // Form
  langTabs: { marginBottom: 16, maxHeight: 40 },
  langTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: COLORS.card, marginRight: 8,
  },
  langTabActive: { backgroundColor: COLORS.primary },
  langTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  langTabTextActive: { color: '#000' },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: 'rgba(74,144,217,0.15)',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },

  // Category Picker
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: 'rgba(74,144,217,0.15)',
  },
  categoryOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryOptionText: { fontSize: 13, color: COLORS.textSecondary },
  categoryOptionTextActive: { color: '#000', fontWeight: '600' },
});
