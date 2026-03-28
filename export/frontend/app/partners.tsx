import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

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
};

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: 'restaurant',
  hotel: 'bed',
  shop: 'bag-handle',
  attraction: 'compass',
  service: 'construct',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#FF6B6B',
  hotel: '#4ECDC4',
  shop: '#FFE66D',
  attraction: '#A8E6CF',
  service: '#B8B8D1',
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restauracia',
  hotel: 'Hotel',
  shop: 'Obchod',
  attraction: 'Atrakcia',
  service: 'Sluzby',
};

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
}

export default function Partners() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch(`${API_URL}/api/partners`);
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = selectedCategory
    ? partners.filter(p => p.category === selectedCategory)
    : partners;

  const categories = [...new Set(partners.map(p => p.category))];

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWebsite = (url: string) => {
    Linking.openURL(url);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={14}
          color={COLORS.accent}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Nacitavanie partnerov...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nasi partneri</Text>
          <Text style={styles.headerSubtitle}>Odporucane sluzby v okoli</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Ionicons name="grid" size={16} color={!selectedCategory ? '#000' : COLORS.textSecondary} />
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            Vsetky
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat] as any || 'business'}
              size={16}
              color={selectedCategory === cat ? '#000' : COLORS.textSecondary}
            />
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
              {CATEGORY_LABELS[cat] || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Partners List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredPartners.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Ziadni partneri v tejto kategorii</Text>
          </View>
        ) : (
          filteredPartners.map(partner => (
            <View key={partner.id} style={styles.partnerCard}>
              {/* Category Badge */}
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[partner.category] || '#666' }]}>
                  <Ionicons
                    name={CATEGORY_ICONS[partner.category] as any || 'business'}
                    size={14}
                    color="#000"
                  />
                  <Text style={styles.categoryBadgeText}>
                    {CATEGORY_LABELS[partner.category] || partner.category}
                  </Text>
                </View>
                {partner.rating > 0 && (
                  <View style={styles.ratingContainer}>
                    {renderStars(partner.rating)}
                    <Text style={styles.ratingText}>{partner.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>

              {/* Partner Info */}
              <Text style={styles.partnerName}>{partner.name}</Text>
              {partner.description ? (
                <Text style={styles.partnerDescription}>{partner.description}</Text>
              ) : null}

              {/* Discount Banner */}
              {partner.discount_text ? (
                <View style={styles.discountBanner}>
                  <Ionicons name="gift" size={16} color={COLORS.accent} />
                  <Text style={styles.discountText}>{partner.discount_text}</Text>
                </View>
              ) : null}

              {/* Details */}
              <View style={styles.detailsContainer}>
                {partner.address ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{partner.address}</Text>
                  </View>
                ) : null}
                {partner.opening_hours ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{partner.opening_hours}</Text>
                  </View>
                ) : null}
                {partner.price_range ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{partner.price_range}</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {partner.phone ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => handleCall(partner.phone)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Volat</Text>
                  </TouchableOpacity>
                ) : null}
                {partner.email ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.emailButton]}
                    onPress={() => handleEmail(partner.email)}
                  >
                    <Ionicons name="mail" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Email</Text>
                  </TouchableOpacity>
                ) : null}
                {partner.website ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.webButton]}
                    onPress={() => handleWebsite(partner.website)}
                  >
                    <Ionicons name="globe" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Web</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darker,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74,144,217,0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryScroll: {
    maxHeight: 56,
    backgroundColor: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74,144,217,0.1)',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.15)',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  partnerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 4,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  partnerDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232,185,35,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,185,35,0.3)',
  },
  discountText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    flex: 1,
  },
  detailsContainer: {
    gap: 6,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  emailButton: {
    backgroundColor: COLORS.primary,
  },
  webButton: {
    backgroundColor: COLORS.secondary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
