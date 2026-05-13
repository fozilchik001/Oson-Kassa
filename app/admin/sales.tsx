
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const IS_DESKTOP = width > 1024;

export default function SalesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adminName, setAdminName] = useState('Administrator');
  const [adminAvatar, setAdminAvatar] = useState('https://ui-avatars.com/api/?name=Admin&background=E31E24&color=fff');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const savedTransactions = localStorage.getItem('transactions');
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      
      const savedName = localStorage.getItem('adminName');
      if (savedName) setAdminName(savedName);
      
      const savedAvatar = localStorage.getItem('adminAvatar');
      if (savedAvatar) setAdminAvatar(savedAvatar);
    }
  }, []);

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.logoTitle}>KASSA</Text>
      </View>

      <View style={styles.navContainer}>
        <SidebarItem 
          icon="bar-chart-outline" 
          label="Hisobotlar" 
          onPress={() => router.replace('/admin')} 
        />
        <SidebarItem 
          icon="cart-outline" 
          label="Savdolar" 
          active={true}
        />
        <SidebarItem 
          icon="people-outline" 
          label="Xodimlar" 
          onPress={() => router.replace('/admin')} 
        />
        <SidebarItem 
          icon="book-outline" 
          label="Qarzdorlar" 
          onPress={() => router.replace('/admin')} 
        />
        <SidebarItem 
          icon="cube-outline" 
          label="Ombor qoldig'i" 
          onPress={() => router.replace('/admin')} 
        />
        <View style={styles.navDivider} />

        <SidebarItem 
          icon="wallet-outline" 
          label="Xarajatlar" 
          onPress={() => router.replace('/admin')} 
        />
        <SidebarItem 
          icon="settings-outline" 
          label="Sozlamalar" 
          onPress={() => router.replace('/admin')} 
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
        <Ionicons name="log-out-outline" size={24} color="#E31E24" />
        <Text style={styles.logoutText}>Chiqish</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {IS_DESKTOP && renderSidebar()}

      <View style={styles.mainContent}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 }]}>
          <View>
            <Text style={styles.greeting}>Savdo tarixi</Text>
            <Text style={styles.subGreeting}>Barcha amalga oshirilgan savdolar ro'yxati</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#999" />
              <TextInput placeholder="Qidirish..." style={styles.searchInput} />
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Savdo tarixi</Text>
              <View style={styles.datePicker}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.dateText}>04.05.2026 - 04.05.2026</Text>
              </View>
            </View>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>ID</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Mijoz</Text>
              <Text style={[styles.th, { flex: 1 }]}>Vaqt</Text>
              <Text style={[styles.th, { flex: 1 }]}>To'lov</Text>
              <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Summa</Text>
            </View>
            {transactions.map((t) => (
              <View key={t.id} style={styles.tr}>
                <Text style={[styles.td, { flex: 1, color: '#999' }]}>#{t.id}</Text>
                <Text style={[styles.td, { flex: 1.5, fontWeight: '600' }]}>{t.customer}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{t.time}</Text>
                <View style={[styles.td, { flex: 1 }]}>
                   <View style={[styles.badge, t.method === 'Naqd' ? styles.badgeSuccess : styles.badgeInfo]}>
                      <Text style={[styles.badgeText, t.method === 'Naqd' ? styles.badgeSuccessText : styles.badgeInfoText]}>
                        {t.method}
                      </Text>
                   </View>
                </View>
                <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>{t.amount.toLocaleString()} so'm</Text>
              </View>
            ))}
            {transactions.length === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="cart-outline" size={48} color="#ccc" />
                <Text style={{ marginTop: 10, color: '#999' }}>Hozircha savdolar mavjud emas</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function SidebarItem({ icon, label, active = false, onPress = () => {} }: any) {
  return (
    <TouchableOpacity 
      style={[styles.sidebarItem, active && styles.sidebarItemActive]} 
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={active ? '#fff' : '#666'} />
      <Text style={[styles.sidebarItemLabel, active && styles.sidebarItemLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingVertical: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    backgroundColor: '#E31E24',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E31E24',
    letterSpacing: 1,
  },
  navContainer: {
    paddingHorizontal: 12,
    gap: 4,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sidebarItemActive: {
    backgroundColor: '#E31E24',
  },
  sidebarItemLabel: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
    fontWeight: '500',
  },
  sidebarItemLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  navDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
    marginHorizontal: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingHorizontal: 28,
    gap: 12,
  },
  logoutText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subGreeting: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 12,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  profileText: {
    fontWeight: '600',
    color: '#333',
    fontSize: 15,
  },
  scrollContent: {
    padding: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  th: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  td: {
    fontSize: 15,
    color: '#333',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeSuccessText: {
    color: '#28A745',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeInfo: {
    backgroundColor: '#E3F2FD',
  },
  badgeInfoText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
