
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { PRODUCTS } from '@/constants/PosData';

const { width } = Dimensions.get('window');
const IS_DESKTOP = width > 1024;

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');

  // Staff state
  const [staff, setStaff] = useState([
    { id: 1, name: 'Sardorbek Amanov', role: 'Kassir', phone: '+998 90 123 45 67', status: 'Faol' },
    { id: 2, name: 'Zilola Karimova', role: 'Kassir', phone: '+998 93 987 65 43', status: 'Ta\'tilda' },
    { id: 3, name: 'Bobur Mirzo', role: 'Admin', phone: '+998 97 111 22 33', status: 'Faol' },
  ]);

  // Expenses state
  const [expenses, setExpenses] = useState([
    { id: 1, title: 'Ijara haqi', amount: 2500000, date: '01.05.2026', category: 'Ijara' },
    { id: 2, title: 'Elektr energiya', amount: 450000, date: '02.05.2026', category: 'Kommunal' },
    { id: 3, title: 'Tushlik (Xodimlar)', amount: 120000, date: '04.05.2026', category: 'Oziq-ovqat' },
  ]);

  const stats = [
    { id: 1, label: "Bugungi savdo", value: "4,250,000 so'm", icon: "cash-outline", color: "#E31E24", trend: "+12%" },
    { id: 2, label: "Buyurtmalar", value: "42 ta", icon: "cart-outline", color: "#E31E24", trend: "+5%" },
    { id: 3, label: "Mijozlar", value: "12 ta", icon: "people-outline", color: "#E31E24", trend: "+2" },
    { id: 4, label: "Foyda", value: "850,000 so'm", icon: "trending-up-outline", color: "#28A745", trend: "+8%" },
  ];

  const recentTransactions = [
    { id: '1', customer: 'Aliyev Vali', amount: '120,000', status: 'Muvaffaqiyatli', time: '10:45', method: 'Naqd' },
    { id: '2', customer: 'Rustamov Jasur', amount: '45,000', status: 'Kutilmoqda', time: '10:30', method: 'Karta' },
    { id: '3', customer: 'Karimova Malika', amount: '210,000', status: 'Muvaffaqiyatli', time: '10:15', method: 'Naqd' },
    { id: '4', customer: 'Xolmatov Aziz', amount: '8,000', status: 'Bekor qilingan', time: '09:50', method: 'Karta' },
  ];

  const renderOverview = () => (
    <>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.color + '10' }]}>
              <Ionicons name={stat.icon as any} size={28} color={stat.color} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabelText}>{stat.label}</Text>
              <Text style={[styles.statValueText, { color: stat.id === 4 ? '#28A745' : '#1A1A1A' }]}>{stat.value}</Text>
              <View style={styles.trendContainer}>
                <Ionicons name="trending-up" size={12} color="#28A745" />
                <Text style={styles.trendText}>{stat.trend} o'sish</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.contentRow}>
        <View style={[styles.card, styles.chartCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Savdo dinamikasi</Text>
            <TouchableOpacity style={styles.cardAction}>
              <Text style={styles.cardActionText}>Haftalik</Text>
              <Ionicons name="chevron-down" size={14} color="#E31E24" />
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBars}>
               {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                 <View key={i} style={styles.chartBarGroup}>
                    <View style={[styles.chartBar, { height: h + '%', backgroundColor: i === 3 ? '#E31E24' : '#FEEBEB' }]} />
                    <Text style={styles.chartDay}>{['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'][i]}</Text>
                 </View>
               ))}
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.activityCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>So'nggi savdolar</Text>
            <TouchableOpacity onPress={() => setActiveTab('Sales')}>
              <Text style={styles.cardLink}>Barchasi</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionList}>
            {recentTransactions.map((item) => (
              <View key={item.id} style={styles.transactionItem}>
                <View style={styles.transactionAvatar}>
                  <Text style={styles.transactionAvatarText}>{item.customer.charAt(0)}</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{item.customer}</Text>
                  <Text style={styles.transactionTime}>{item.time}</Text>
                </View>
                <View style={styles.transactionPrice}>
                  <Text style={styles.transactionAmount}>{item.amount} so'm</Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: item.status === 'Muvaffaqiyatli' ? '#E8F5E9' : item.status === 'Kutilmoqda' ? '#FFF3E0' : '#FFEBEE' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: item.status === 'Muvaffaqiyatli' ? '#2E7D32' : item.status === 'Kutilmoqda' ? '#EF6C00' : '#C62828' }
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Tezkor amallar</Text>
        <View style={styles.actionGrid}>
           <QuickAction icon="add-circle-outline" label="Mahsulot qo'shish" color="#E31E24" />
           <QuickAction icon="person-add-outline" label="Sotuvchi qo'shish" color="#E31E24" />
           <QuickAction icon="print-outline" label="Hisobot chiqarish" color="#E31E24" />
           <QuickAction icon="settings-outline" label="Tizim sozlamalari" color="#E31E24" />
        </View>
      </View>
    </>
  );

  const renderStaff = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Xodimlar ro'yxati</Text>
        <TouchableOpacity style={styles.primaryBtn}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Yangi xodim</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>F.I.O</Text>
        <Text style={[styles.th, { flex: 1 }]}>Lavozim</Text>
        <Text style={[styles.th, { flex: 1.5 }]}>Telefon</Text>
        <Text style={[styles.th, { flex: 1 }]}>Holat</Text>
        <Text style={[styles.th, { flex: 0.5, textAlign: 'right' }]}>Amallar</Text>
      </View>
      {staff.map(person => (
        <View key={person.id} style={styles.tr}>
          <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <View style={styles.miniAvatar}>
              <Text style={styles.miniAvatarText}>{person.name.charAt(0)}</Text>
            </View>
            <Text style={styles.tdTextBold}>{person.name}</Text>
          </View>
          <Text style={[styles.td, { flex: 1 }]}>{person.role}</Text>
          <Text style={[styles.td, { flex: 1.5 }]}>{person.phone}</Text>
          <View style={[styles.td, { flex: 1 }]}>
            <View style={[styles.badge, person.status === 'Faol' ? styles.badgeSuccess : styles.badgeWarning]}>
              <Text style={[styles.badgeText, person.status === 'Faol' ? styles.badgeSuccessText : styles.badgeWarningText]}>{person.status}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.td, { flex: 0.5, alignItems: 'flex-end' }]}>
            <Ionicons name="ellipsis-vertical" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderInventory = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Ombor qoldig'i</Text>
        <View style={styles.searchBarSmall}>
          <Ionicons name="search" size={16} color="#999" />
          <TextInput placeholder="Mahsulot qidirish..." style={styles.searchInputSmall} />
        </View>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Mahsulot nomi</Text>
        <Text style={[styles.th, { flex: 1 }]}>Kategoriya</Text>
        <Text style={[styles.th, { flex: 1 }]}>Shtrix kod</Text>
        <Text style={[styles.th, { flex: 1 }]}>Narxi</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Qoldiq</Text>
      </View>
      {PRODUCTS.slice(0, 15).map(p => (
        <View key={p.id} style={styles.tr}>
          <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <Image source={{ uri: p.image }} style={styles.tableImage} />
            <Text style={styles.tdTextBold}>{p.name}</Text>
          </View>
          <Text style={[styles.td, { flex: 1 }]}>{p.category}</Text>
          <Text style={[styles.td, { flex: 1, color: '#666' }]}>{p.code}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{p.price.toLocaleString()} so'm</Text>
          <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: p.stock < 10 ? '#E31E24' : '#28A745' }]}>
            {p.stock} ta
          </Text>
        </View>
      ))}
    </View>
  );

  const renderExpenses = () => (
    <View style={styles.card}>
       <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Xarajatlar ro'yxati</Text>
        <TouchableOpacity style={styles.primaryBtn}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Xarajat qo'shish</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Izoh</Text>
        <Text style={[styles.th, { flex: 1 }]}>Kategoriya</Text>
        <Text style={[styles.th, { flex: 1 }]}>Sana</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Summa</Text>
      </View>
      {expenses.map(exp => (
        <View key={exp.id} style={styles.tr}>
          <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{exp.title}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{exp.category}</Text>
          <Text style={[styles.td, { flex: 1, color: '#666' }]}>{exp.date}</Text>
          <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#E31E24' }]}>
            {exp.amount.toLocaleString()} so'm
          </Text>
        </View>
      ))}
    </View>
  );

  const renderAnalytics = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.analyticsHeader}>
        <View style={styles.periodPicker}>
          {['Kunlik', 'Haftalik', 'Oylik', 'Yillik'].map(p => (
            <TouchableOpacity key={p} style={[styles.periodBtn, p === 'Haftalik' && styles.periodBtnActive]}>
              <Text style={[styles.periodBtnText, p === 'Haftalik' && styles.periodBtnTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.exportBtnText}>Excel yuklash</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.analyticsStatCard}>
          <Text style={styles.analyticsStatLabel}>Umumiy tushum</Text>
          <Text style={styles.analyticsStatValue}>28,450,000 so'm</Text>
          <View style={styles.analyticsTrend}>
            <Ionicons name="arrow-up" size={14} color="#28A745" />
            <Text style={styles.analyticsTrendText}>+15.2% o'tgan oyga nisbatan</Text>
          </View>
        </View>
        <View style={styles.analyticsStatCard}>
          <Text style={styles.analyticsStatLabel}>O'rtacha chek</Text>
          <Text style={styles.analyticsStatValue}>85,000 so'm</Text>
          <View style={styles.analyticsTrend}>
            <Ionicons name="arrow-up" size={14} color="#28A745" />
            <Text style={styles.analyticsTrendText}>+4.8% o'tgan oyga nisbatan</Text>
          </View>
        </View>
        <View style={styles.analyticsStatCard}>
          <Text style={styles.analyticsStatLabel}>Yangi mijozlar</Text>
          <Text style={styles.analyticsStatValue}>124 ta</Text>
          <View style={styles.analyticsTrend}>
            <Ionicons name="arrow-up" size={14} color="#28A745" />
            <Text style={styles.analyticsTrendText}>+12.1% o'tgan oyga nisbatan</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentRow}>
        <View style={[styles.card, { flex: 2 }]}>
          <Text style={styles.cardTitle}>Sotuvlar oqimi (Soatbay)</Text>
          <View style={styles.analyticsChartContainer}>
             {[10, 20, 15, 30, 60, 80, 100, 90, 70, 40, 20, 10].map((h, i) => (
               <View key={i} style={styles.analyticsChartBarGroup}>
                  <View style={[styles.analyticsChartBar, { height: h + '%' }]} />
                  <Text style={styles.analyticsChartLabel}>{i + 8}:00</Text>
               </View>
             ))}
          </View>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>To'lov usullari</Text>
          <View style={styles.paymentMethodsContainer}>
             <View style={styles.paymentMethodItem}>
                <View style={styles.paymentMethodIconBox}><Ionicons name="cash" size={24} color="#28A745" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodName}>Naqd pul</Text>
                  <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '65%', backgroundColor: '#28A745' }]} /></View>
                </View>
                <Text style={styles.paymentMethodPercent}>65%</Text>
             </View>
             <View style={styles.paymentMethodItem}>
                <View style={[styles.paymentMethodIconBox, { backgroundColor: '#E3F2FD' }]}><Ionicons name="card" size={24} color="#2196F3" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodName}>Plastik karta</Text>
                  <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '35%', backgroundColor: '#2196F3' }]} /></View>
                </View>
                <Text style={styles.paymentMethodPercent}>35%</Text>
             </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Eng ko'p sotilgan mahsulotlar</Text>
        <View style={styles.tableHeader}>
           <Text style={[styles.th, { flex: 2 }]}>Mahsulot</Text>
           <Text style={[styles.th, { flex: 1 }]}>Sotilgan</Text>
           <Text style={[styles.th, { flex: 1 }]}>Tushum</Text>
           <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Foyda</Text>
        </View>
        {[
          { name: 'Coca Cola 0.5L', qty: 450, revenue: '4,500,000', profit: '1,200,000' },
          { name: 'Cheeseburger', qty: 320, revenue: '8,000,000', profit: '2,500,000' },
          { name: 'Pepperoni Pizza', qty: 180, revenue: '8,100,000', profit: '3,000,000' },
          { name: 'Lipton Choy 0.5L', qty: 290, revenue: '2,030,000', profit: '800,000' },
        ].map((item, idx) => (
          <View key={idx} style={styles.tr}>
            <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{item.name}</Text>
            <Text style={[styles.td, { flex: 1 }]}>{item.qty} ta</Text>
            <Text style={[styles.td, { flex: 1 }]}>{item.revenue} so'm</Text>
            <Text style={[styles.td, { flex: 1, textAlign: 'right', color: '#28A745', fontWeight: 'bold' }]}>+{item.profit}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderSales = () => (
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
      {[...Array(8)].map((_, i) => (
        <View key={i} style={styles.tr}>
          <Text style={[styles.td, { flex: 1, color: '#999' }]}>#100{8-i}</Text>
          <Text style={[styles.td, { flex: 1.5, fontWeight: '600' }]}>Mijoz #{Math.floor(Math.random() * 50 + 1)}</Text>
          <Text style={[styles.td, { flex: 1 }]}>10:{Math.floor(Math.random() * 50 + 10)}</Text>
          <View style={[styles.td, { flex: 1 }]}>
             <View style={[styles.badge, i % 2 === 0 ? styles.badgeSuccess : styles.badgeInfo]}>
                <Text style={[styles.badgeText, i % 2 === 0 ? styles.badgeSuccessText : styles.badgeInfoText]}>
                  {i % 2 === 0 ? 'Naqd' : 'Karta'}
                </Text>
             </View>
          </View>
          <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>{(Math.floor(Math.random() * 200 + 20) * 1000).toLocaleString()} so'm</Text>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Staff': return renderStaff();
      case 'Inventory': return renderInventory();
      case 'Expenses': return renderExpenses();
      case 'Analytics': return renderAnalytics();
      case 'Sales': return renderSales();
      case 'Settings':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tizim sozlamalari</Text>
            <View style={styles.settingItem}>
               <View>
                 <Text style={styles.settingLabel}>Do'kon nomi</Text>
                 <TextInput style={styles.settingInput} defaultValue="Oson Kassa POS" />
               </View>
            </View>
            <View style={styles.settingItem}>
               <View>
                 <Text style={styles.settingLabel}>Valyuta</Text>
                 <TextInput style={styles.settingInput} defaultValue="O'zbek so'mi (UZS)" />
               </View>
            </View>
            <TouchableOpacity style={styles.saveSettingsBtn}>
               <Text style={styles.saveSettingsText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
        );
      default: return renderOverview();
    }
  };

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
          icon="grid-outline" 
          label="Asosiy panel" 
          active={activeTab === 'Overview'} 
          onPress={() => setActiveTab('Overview')} 
        />
        <SidebarItem 
          icon="analytics-outline" 
          label="Analitika" 
          active={activeTab === 'Analytics'} 
          onPress={() => setActiveTab('Analytics')} 
        />
        <SidebarItem 
          icon="people-outline" 
          label="Xodimlar" 
          active={activeTab === 'Staff'} 
          onPress={() => setActiveTab('Staff')} 
        />
        <SidebarItem 
          icon="cube-outline" 
          label="Ombor qoldig'i" 
          active={activeTab === 'Inventory'} 
          onPress={() => setActiveTab('Inventory')} 
        />
        <View style={styles.navDivider} />
        <SidebarItem 
          icon="document-text-outline" 
          label="Savdo hisoboti" 
          active={activeTab === 'Sales'} 
          onPress={() => setActiveTab('Sales')} 
        />
        <SidebarItem 
          icon="wallet-outline" 
          label="Xarajatlar" 
          active={activeTab === 'Expenses'} 
          onPress={() => setActiveTab('Expenses')} 
        />
        <SidebarItem 
          icon="settings-outline" 
          label="Sozlamalar" 
          active={activeTab === 'Settings'} 
          onPress={() => setActiveTab('Settings')} 
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
            <Text style={styles.greeting}>
              {activeTab === 'Overview' ? 'Admin Dashboard' : 
               activeTab === 'Staff' ? 'Xodimlar' :
               activeTab === 'Inventory' ? 'Ombor' :
               activeTab === 'Expenses' ? 'Xarajatlar' : 
               activeTab === 'Sales' ? 'Savdo Hisoboti' : 
               activeTab === 'Analytics' ? 'Analitika' : 'Sozlamalar'}
            </Text>
            <Text style={styles.subGreeting}>Xush kelibsiz! Tizim holati bilan tanishing</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#999" />
              <TextInput placeholder="Qidirish..." style={styles.searchInput} />
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileBtn}>
              <Image 
                source="https://ui-avatars.com/api/?name=Admin&background=E31E24&color=fff" 
                style={styles.avatar}
              />
              <Text style={styles.profileText}>Administrator</Text>
              <Ionicons name="chevron-down" size={16} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderContent()}
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

function QuickAction({ icon, label, color }: any) {
  return (
    <TouchableOpacity style={styles.quickActionCard}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
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
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E31E24',
    borderWidth: 2,
    borderColor: '#fff',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statLabelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValueText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '600',
    marginLeft: 4,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
    flexWrap: 'wrap',
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
  chartCard: {
    flex: 2,
    minWidth: 400,
  },
  activityCard: {
    flex: 1,
    minWidth: 320,
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
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardActionText: {
    fontSize: 13,
    color: '#E31E24',
    fontWeight: '600',
    marginRight: 4,
  },
  cardLink: {
    fontSize: 13,
    color: '#E31E24',
    fontWeight: '600',
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingHorizontal: 10,
  },
  chartBarGroup: {
    alignItems: 'center',
    width: '10%',
  },
  chartBar: {
    width: 12,
    borderRadius: 6,
  },
  chartDay: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontWeight: '500',
  },
  transactionList: {
    gap: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionAvatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionPrice: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickActions: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  th: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  td: {
    fontSize: 15,
    color: '#333',
  },
  tdTextBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  tableImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSuccess: { backgroundColor: '#E8F5E9' },
  badgeWarning: { backgroundColor: '#FFF3E0' },
  badgeInfo: { backgroundColor: '#E3F2FD' },
  badgeSuccessText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  badgeWarningText: { color: '#EF6C00', fontSize: 12, fontWeight: 'bold' },
  badgeInfoText: { color: '#2196F3', fontSize: 12, fontWeight: 'bold' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31E24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchBarSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    width: 250,
  },
  searchInputSmall: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  emptyState: {
    padding: 100,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  settingItem: {
    marginBottom: 20,
    marginTop: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  settingInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  saveSettingsBtn: {
    backgroundColor: '#E31E24',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveSettingsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Analytics Styles
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  periodPicker: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: '#E31E24',
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  analyticsStatCard: {
    flex: 1,
    minWidth: 250,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  analyticsStatLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  analyticsStatValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginVertical: 8,
  },
  analyticsTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  analyticsTrendText: {
    fontSize: 13,
    color: '#28A745',
    fontWeight: '600',
  },
  analyticsChartContainer: {
    height: 250,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  analyticsChartBarGroup: {
    alignItems: 'center',
    width: '7%',
  },
  analyticsChartBar: {
    width: '100%',
    backgroundColor: '#E31E24',
    borderRadius: 6,
    opacity: 0.8,
  },
  analyticsChartLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    fontWeight: '600',
  },
  paymentMethodsContainer: {
    gap: 20,
    paddingTop: 10,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentMethodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  paymentMethodPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    width: 45,
    textAlign: 'right',
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
    color: '#333',
    fontWeight: '600',
  },
});
