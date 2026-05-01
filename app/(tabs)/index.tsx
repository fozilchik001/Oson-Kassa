
import { CATEGORIES, PRODUCTS } from '@/constants/PosData';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const IS_DESKTOP = width > 768;

export default function PosScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || (selectedCategory === 'ichimliklar' && p.category === 'Ichimliklar') || (selectedCategory === 'taomlar' && p.category === 'Taomlar') || (selectedCategory === 'snaklar' && p.category === 'Snaklar');
      // Normalize category matching
      const catMatch = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [selectedCategory, searchQuery]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.logoTitle}>KASSA</Text>
        </View>

        <View style={styles.navContainer}>
          <NavItem icon="cart" label="Sotuv" active />
          <NavItem icon="cube-outline" label="Mahsulotlar" />
          <NavItem icon="bar-chart-outline" label="Hisobotlar" />
          <NavItem icon="people-outline" label="Mijozlar" />
          <NavItem icon="wallet-outline" label="Xarajatlar" />
          <NavItem icon="settings-outline" label="Sozlamalar" />
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#E31E24" />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sotuv</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileBtn}>
              <Image
                source="https://ui-avatars.com/api/?name=Administrator&background=E31E24&color=fff"
                style={styles.avatar}
              />
              <Text style={styles.profileText}>Administrator</Text>
              <Ionicons name="chevron-down" size={16} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Categories */}
        <View style={styles.controlsRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Mahsulot qidirish yoki shtrih kod..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => alert('Skaner ochildi...')}>
              <Ionicons name="qr-code-outline" size={24} color="#E31E24" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={24} color="#E31E24" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRoot}>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.id && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={selectedCategory === cat.id ? '#fff' : '#333'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Product Grid */}
        <ScrollView style={styles.gridRoot} contentContainerStyle={styles.gridContainer}>
          <View style={styles.productGrid}>
            {filteredProducts.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.productCard}
                onPress={() => addToCart(p)}
              >
                <Image source={{ uri: p.image }} style={styles.productImage} contentFit="cover" />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productPrice}>{p.price.toLocaleString()} so'm</Text>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockLabel}>Omborda: </Text>
                    <Text style={[styles.stockValue, p.stock < 10 && styles.stockLow]}>
                      {p.stock} ta
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(p)}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <View style={styles.quickActionRow}>
            <QuickActionBtn icon="receipt-outline" label="Chek ochish" color="#fff" textColor="#E31E24" />
            <QuickActionBtn icon="arrow-undo-outline" label="Chek qaytarish" color="#fff" />
            <QuickActionBtn icon="wallet-outline" label="To'lov olish" color="#fff" />
            <QuickActionBtn icon="cash-outline" label="Naqd pul kiritish" color="#fff" />
          </View>
        </View>
      </View>

      {/* Right Panels - Cart */}
      <View style={styles.cartPanel}>
        <View style={styles.cartHeader}>
          <View>
            <Text style={styles.cartLabel}>Jami</Text>
            <Text style={styles.cartTotal}>{total.toLocaleString()} so'm</Text>
          </View>
          <TouchableOpacity onPress={() => setCart([])} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.cartList}>
          {cart.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.cartItemImage} />
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <View style={styles.cartItemControls}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={16} color="#E31E24" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={16} color="#E31E24" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cartItemPrice}>{(item.price * item.quantity).toLocaleString()}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, -item.quantity)} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={20} color="#FFEBEE" />
                <Ionicons name="close" size={12} color="#E31E24" style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
          ))}
          {cart.length === 0 && (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={48} color="#EEE" />
              <Text style={styles.emptyCartText}>Savat bo'sh</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.cartFooter}>
          <TouchableOpacity style={styles.clearAllBtn} onPress={() => setCart([])}>
            <Ionicons name="trash-outline" size={20} color="#E31E24" />
            <Text style={styles.clearAllText}>Tozalash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutBtn}>
            <View style={styles.checkoutInfo}>
              <Text style={styles.checkoutLabel}>To'lov</Text>
              <Text style={styles.checkoutTotal}>{total.toLocaleString()} so'm</Text>
            </View>
            <View style={styles.checkoutArrow}>
              <Ionicons name="arrow-forward" size={24} color="#E31E24" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function NavItem({ icon, label, active = false }: any) {
  return (
    <TouchableOpacity style={[styles.navItem, active && styles.navItemActive]}>
      <Ionicons name={icon} size={24} color={active ? '#fff' : '#666'} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function QuickActionBtn({ icon, label, color, textColor }: any) {
  return (
    <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: color }]}>
      <View style={styles.qaIconBox}>
        <Ionicons name={icon} size={24} color="#E31E24" />
      </View>
      <Text style={[styles.qaLabel, textColor ? { color: textColor } : {}]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F7F8FA',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingVertical: 20,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  logoBadge: {
    width: 44,
    height: 44,
    backgroundColor: '#E31E24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E31E24',
    letterSpacing: 1,
  },
  navContainer: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#E31E24',
  },
  navLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    marginTop: 'auto',
  },
  logoutText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: '#E31E24',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 22,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileText: {
    fontWeight: '600',
    color: '#333',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesRoot: {
    maxHeight: 60,
    marginBottom: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    height: 44,
  },
  categoryCardActive: {
    backgroundColor: '#E31E24',
  },
  categoryText: {
    fontWeight: '600',
    color: '#333',
  },
  categoryTextActive: {
    color: '#fff',
  },
  gridRoot: {
    flex: 1,
  },
  gridContainer: {
    paddingBottom: 100,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  productCard: {
    width: (width - 240 - 350 - 40 - 48) / 4, // Calculate for 4 columns in desktop
    minWidth: 160,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 12,
  },
  productInfo: {
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stockLabel: {
    fontSize: 12,
    color: '#999',
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28A745',
  },
  stockLow: {
    color: '#E31E24',
  },
  addBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: '#E31E24',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  qaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  cartPanel: {
    width: 350,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    padding: 20,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cartLabel: {
    fontSize: 16,
    color: '#666',
  },
  cartTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E31E24',
  },
  clearBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  cartItemInfo: {
    flex: 1,
    gap: 4,
  },
  cartItemName: {
    fontWeight: '600',
    color: '#333',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontWeight: 'bold',
  },
  cartItemPrice: {
    fontWeight: '600',
    color: '#333',
  },
  removeBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
  },
  cartFooter: {
    paddingTop: 20,
    gap: 12,
  },
  clearAllBtn: {
    height: 70,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  clearAllText: {
    fontWeight: '600',
    color: '#333',
  },
  checkoutBtn: {
    height: 80,
    backgroundColor: '#E31E24',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  checkoutInfo: {
    gap: 2,
  },
  checkoutLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  checkoutTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutArrow: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
    paddingTop: 100,
  },
  emptyCartText: {
    marginTop: 12,
    color: '#999',
  }
});
