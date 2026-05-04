
import { CATEGORIES, PRODUCTS as INITIAL_PRODUCTS } from '@/constants/PosData';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
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
  const [activePage, setActivePage] = useState('Sotuv');
  
  // Sotuv page state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  // Products state (local, so we can add)
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Ichimliklar');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);

  // File input ref for web image picking
  const fileInputRef = useRef<any>(null);
  const editFileInputRef = useRef<any>(null);

  const pickImage = (setter: (v: string) => void, inputRef: any) => {
    if (Platform.OS === 'web') {
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => { setter(ev.target?.result as string); };
          reader.readAsDataURL(file);
        };
        inputRef.current.click();
      }
    }
  };

  const handleAddProduct = () => {
    if (!newName.trim() || !newPrice.trim() || !newStock.trim()) return;
    const newProduct = {
      id: String(Date.now()),
      name: newName.trim(),
      category: newCategory,
      price: parseInt(newPrice.replace(/\D/g, ''), 10) || 0,
      stock: parseInt(newStock, 10) || 0,
      code: newBarcode.trim() || String(Math.floor(Math.random() * 900000000 + 100000000)),
      image: newImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=E31E24&color=fff&size=200`,
    };
    setProducts(prev => [...prev, newProduct]);
    setNewName('');
    setNewCategory('Ichimliklar');
    setNewPrice('');
    setNewStock('');
    setNewBarcode('');
    setNewImage(null);
    setShowAddModal(false);
  };

  // Edit Product Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Ichimliklar');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);

  const openEditModal = (p: any) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditCategory(p.category);
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
    setEditBarcode(p.code || '');
    setEditImage(p.image || null);
    setShowEditModal(true);
  };

  const handleEditProduct = () => {
    if (!editName.trim() || !editPrice.trim() || !editStock.trim()) return;
    setProducts(prev => prev.map(p =>
      p.id === editId
        ? {
            ...p,
            name: editName.trim(),
            category: editCategory,
            price: parseInt(editPrice.replace(/\D/g, ''), 10) || 0,
            stock: parseInt(editStock, 10) || 0,
            code: editBarcode.trim() || p.code,
            image: editImage || p.image,
          }
        : p
    ));
    setShowEditModal(false);
  };;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [products, selectedCategory, searchQuery]);

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

  const renderContent = () => {
    switch (activePage) {
      case 'Sotuv':
        return (
          <>
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

              <View style={styles.quickActions}>
                <View style={styles.quickActionRow}>
                  <QuickActionBtn icon="receipt-outline" label="Chek ochish" color="#fff" textColor="#E31E24" />
                  <QuickActionBtn icon="arrow-undo-outline" label="Chek qaytarish" color="#fff" />
                  <QuickActionBtn icon="wallet-outline" label="To'lov olish" color="#fff" />
                  <QuickActionBtn icon="cash-outline" label="Naqd pul kiritish" color="#fff" />
                </View>
              </View>
            </View>

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
          </>
        );
      case 'Mahsulotlar':
        return (
          <View style={styles.pageContent}>
            {/* Add Product Modal */}
            <Modal
              visible={showAddModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowAddModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Yangi Mahsulot</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(false)}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Mahsulot nomi *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Masalan: Coca Cola 1L"
                    value={newName}
                    onChangeText={setNewName}
                  />

                  <Text style={styles.fieldLabel}>Kategoriya *</Text>
                  <View style={styles.categoryPicker}>
                    {['Ichimliklar', 'Taomlar', 'Snaklar', 'Boshqalar'].map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catChip, newCategory === cat && styles.catChipActive]}
                        onPress={() => setNewCategory(cat)}
                      >
                        <Text style={[styles.catChipText, newCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.modalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Narxi (so'm) *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="10000"
                        value={newPrice}
                        onChangeText={setNewPrice}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Qoldiq (ta) *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="50"
                        value={newStock}
                        onChangeText={setNewStock}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Shtrix Kod</Text>
                  <View style={styles.barcodeInputWrapper}>
                    <Ionicons name="barcode-outline" size={22} color="#999" />
                    <TextInput
                      style={styles.barcodeInput}
                      placeholder="Skanerlang yoki qo'lda kiriting..."
                      value={newBarcode}
                      onChangeText={setNewBarcode}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={styles.barcodeGenBtn}
                      onPress={() => setNewBarcode(String(Math.floor(Math.random() * 9000000000 + 1000000000)))}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#E31E24" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fieldLabel}>Mahsulot Rasmi</Text>
                  <TouchableOpacity
                    style={styles.imagePicker}
                    onPress={() => pickImage(setNewImage, fileInputRef)}
                  >
                    {newImage ? (
                      <Image source={{ uri: newImage }} style={styles.imagePreview} contentFit="cover" />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#ccc" />
                        <Text style={styles.imagePickerText}>Rasm yuklash</Text>
                        <Text style={styles.imagePickerSub}>PNG, JPG, WEBP</Text>
                      </View>
                    )}
                    {newImage && (
                      <TouchableOpacity
                        style={styles.imageRemoveBtn}
                        onPress={(e) => { e.stopPropagation?.(); setNewImage(null); }}
                      >
                        <Ionicons name="close-circle" size={22} color="#E31E24" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                      <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, (!newName || !newPrice || !newStock) && styles.saveBtnDisabled]}
                      onPress={handleAddProduct}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.saveBtnText}>Saqlash</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Edit Product Modal */}
            <Modal
              visible={showEditModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowEditModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Mahsulotni Tahrirlash</Text>
                    <TouchableOpacity onPress={() => setShowEditModal(false)}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Mahsulot nomi *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Masalan: Coca Cola 1L"
                    value={editName}
                    onChangeText={setEditName}
                  />

                  <Text style={styles.fieldLabel}>Kategoriya *</Text>
                  <View style={styles.categoryPicker}>
                    {['Ichimliklar', 'Taomlar', 'Snaklar', 'Boshqalar'].map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catChip, editCategory === cat && styles.catChipActive]}
                        onPress={() => setEditCategory(cat)}
                      >
                        <Text style={[styles.catChipText, editCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.modalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Narxi (so'm) *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="10000"
                        value={editPrice}
                        onChangeText={setEditPrice}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Qoldiq (ta) *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="50"
                        value={editStock}
                        onChangeText={setEditStock}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Shtrix Kod</Text>
                  <View style={styles.barcodeInputWrapper}>
                    <Ionicons name="barcode-outline" size={22} color="#999" />
                    <TextInput
                      style={styles.barcodeInput}
                      placeholder="Skanerlang yoki qo'lda kiriting..."
                      value={editBarcode}
                      onChangeText={setEditBarcode}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={styles.barcodeGenBtn}
                      onPress={() => setEditBarcode(String(Math.floor(Math.random() * 9000000000 + 1000000000)))}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#E31E24" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fieldLabel}>Mahsulot Rasmi</Text>
                  <TouchableOpacity
                    style={styles.imagePicker}
                    onPress={() => pickImage(setEditImage, editFileInputRef)}
                  >
                    {editImage ? (
                      <Image source={{ uri: editImage }} style={styles.imagePreview} contentFit="cover" />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#ccc" />
                        <Text style={styles.imagePickerText}>Rasm yuklash</Text>
                        <Text style={styles.imagePickerSub}>PNG, JPG, WEBP</Text>
                      </View>
                    )}
                    {editImage && (
                      <TouchableOpacity
                        style={styles.imageRemoveBtn}
                        onPress={(e) => { e.stopPropagation?.(); setEditImage(null); }}
                      >
                        <Ionicons name="close-circle" size={22} color="#E31E24" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                      <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, (!editName || !editPrice || !editStock) && styles.saveBtnDisabled]}
                      onPress={handleEditProduct}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.saveBtnText}>Saqlash</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <View style={styles.pageHeaderRow}>
              <Text style={styles.pageTitle}>Mahsulotlar</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Yangi qo'shish</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Nomi</Text>
                <Text style={[styles.th, { flex: 1 }]}>Kategoriya</Text>
                <Text style={[styles.th, { flex: 1 }]}>Narxi</Text>
                <Text style={[styles.th, { flex: 1 }]}>Qoldiq</Text>
                <Text style={[styles.th, { flex: 0.5, textAlign: 'center' }]}>Amallar</Text>
              </View>
              <ScrollView>
                {products.map(p => (
                  <View key={p.id} style={styles.tr}>
                    <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{p.name}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{p.category}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{p.price.toLocaleString()} so'm</Text>
                    <Text style={[styles.td, { flex: 1, color: p.stock < 15 ? '#E31E24' : '#28A745', fontWeight: 'bold' }]}>{p.stock} ta</Text>
                    <View style={[styles.td, { flex: 0.5, flexDirection: 'row', justifyContent: 'center', gap: 12 }]}>
                      <TouchableOpacity onPress={() => openEditModal(p)}>
                        <Ionicons name="pencil-outline" size={18} color="#007BFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setProducts(prev => prev.filter(x => x.id !== p.id))}>
                        <Ionicons name="trash-outline" size={18} color="#E31E24" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        );
      case 'Hisobotlar':
        return (
          <View style={styles.pageContent}>
            <Text style={styles.pageTitle}>Hisobotlar</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="cash-outline" size={32} color="#E31E24" />
                <Text style={styles.statLabel}>Bugungi Daromad</Text>
                <Text style={styles.statValue}>1,240,000 so'm</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cube-outline" size={32} color="#007BFF" />
                <Text style={styles.statLabel}>Sotilgan mahsulotlar</Text>
                <Text style={styles.statValue}>128 ta</Text>
              </View>
            </View>
          </View>
        );
      case 'Qarzdorlar':
        return (
          <View style={styles.pageContent}>
            <View style={styles.pageHeaderRow}>
              <Text style={styles.pageTitle}>Qarzdorlar</Text>
              <TouchableOpacity style={styles.primaryBtn}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Qarz qo'shish</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.statsGrid, { marginBottom: 20 }]}>
              <View style={[styles.statCard, { flex: 1, backgroundColor: '#FFF5F5', borderColor: '#FFEBEB', borderWidth: 1 }]}>
                <View style={styles.statIconWrapperRed}>
                  <Ionicons name="wallet-outline" size={24} color="#E31E24" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Umumiy Qarz Miqdori</Text>
                  <Text style={[styles.statValue, { color: '#E31E24' }]}>2,450,000 so'm</Text>
                </View>
              </View>
              <View style={[styles.statCard, { flex: 1 }]}>
                 <View style={styles.statIconWrapperGray}>
                  <Ionicons name="people-outline" size={24} color="#333" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Qarzdorlar Soni</Text>
                  <Text style={styles.statValue}>12 ta</Text>
                </View>
              </View>
              <View style={[styles.statCard, { flex: 1 }]}>
                 <View style={styles.statIconWrapperGreen}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#28A745" />
                </View>
                <View>
                  <Text style={styles.statLabel}>To'langan QarZlar (Oy)</Text>
                  <Text style={styles.statValue}>850,000 so'm</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
               <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>FIO</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Telefon</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Qarz Summasi</Text>
                <Text style={[styles.th, { flex: 1 }]}>Muddati</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Harakatlar</Text>
              </View>
              <ScrollView>
                {[
                  { id: 1, name: 'Aliyev Vali', phone: '+998 90 123 45 67', amount: 450000, date: '12.05.2026', over: false },
                  { id: 2, name: 'Rustamov Jasur', phone: '+998 93 987 65 43', amount: 1200000, date: '01.05.2026', over: true },
                  { id: 3, name: 'Karimova Malika', phone: '+998 97 111 22 33', amount: 800000, date: '20.05.2026', over: false },
                ].map(debtor => (
                  <View key={debtor.id} style={styles.tr}>
                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{debtor.name.charAt(0)}</Text>
                      </View>
                      <Text style={{ fontWeight: '600', color: '#333' }}>{debtor.name}</Text>
                    </View>
                    <Text style={[styles.td, { flex: 1.5, color: '#666' }]}>{debtor.phone}</Text>
                    <Text style={[styles.td, { flex: 1.5, fontWeight: 'bold', color: '#E31E24' }]}>
                      {debtor.amount.toLocaleString()} so'm
                    </Text>
                    <View style={[styles.td, { flex: 1 }]}>
                       <View style={[styles.badge, debtor.over ? styles.badgeDanger : styles.badgeWarning]}>
                          <Text style={[styles.badgeText, debtor.over ? styles.badgeDangerText : styles.badgeWarningText]}>
                            {debtor.date}
                          </Text>
                       </View>
                    </View>
                    <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }]}>
                      <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>To'lash</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        );
      case 'Xarajatlar':
        return (
          <View style={styles.pageContent}>
            <Text style={styles.pageTitle}>Xarajatlar</Text>
            <View style={styles.card}>
               <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Izoh</Text>
                <Text style={[styles.th, { flex: 1 }]}>Sana</Text>
                <Text style={[styles.th, { flex: 1 }]}>Summa</Text>
              </View>
              <View style={styles.tr}>
                <Text style={[styles.td, { flex: 2 }]}>Tushlik uchun</Text>
                <Text style={[styles.td, { flex: 1 }]}>04.05.2026</Text>
                <Text style={[styles.td, { flex: 1, color: '#E31E24' }]}>40,000 so'm</Text>
              </View>
              <View style={styles.tr}>
                <Text style={[styles.td, { flex: 2 }]}>Elektr energiya</Text>
                <Text style={[styles.td, { flex: 1 }]}>01.05.2026</Text>
                <Text style={[styles.td, { flex: 1, color: '#E31E24' }]}>150,000 so'm</Text>
              </View>
            </View>
          </View>
        );
      case 'Sozlamalar':
        return (
          <View style={styles.pageContent}>
            <Text style={styles.pageTitle}>Sozlamalar</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.settingItem}>
                 <Ionicons name="person-outline" size={24} color="#333" />
                 <Text style={styles.settingText}>Profil ma'lumotlari</Text>
                 <Ionicons name="chevron-forward" size={20} color="#999" style={{marginLeft: 'auto'}}/>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                 <Ionicons name="print-outline" size={24} color="#333" />
                 <Text style={styles.settingText}>Printer sozlamalari</Text>
                 <Ionicons name="chevron-forward" size={20} color="#999" style={{marginLeft: 'auto'}}/>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                 <Ionicons name="lock-closed-outline" size={24} color="#333" />
                 <Text style={styles.settingText}>Parolni o'zgartirish</Text>
                 <Ionicons name="chevron-forward" size={20} color="#999" style={{marginLeft: 'auto'}}/>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                 <Ionicons name="language-outline" size={24} color="#333" />
                 <Text style={styles.settingText}>Tizim tili (O'zbekcha)</Text>
                 <Ionicons name="chevron-forward" size={20} color="#999" style={{marginLeft: 'auto'}}/>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

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
          <NavItem icon="cart" label="Sotuv" active={activePage === 'Sotuv'} onPress={() => setActivePage('Sotuv')} />
          <NavItem icon="cube-outline" label="Mahsulotlar" active={activePage === 'Mahsulotlar'} onPress={() => setActivePage('Mahsulotlar')} />
          <NavItem icon="bar-chart-outline" label="Hisobotlar" active={activePage === 'Hisobotlar'} onPress={() => setActivePage('Hisobotlar')} />
          <NavItem icon="people-outline" label="Qarzdorlar" active={activePage === 'Qarzdorlar'} onPress={() => setActivePage('Qarzdorlar')} />
          <NavItem icon="wallet-outline" label="Xarajatlar" active={activePage === 'Xarajatlar'} onPress={() => setActivePage('Xarajatlar')} />
          <NavItem icon="settings-outline" label="Sozlamalar" active={activePage === 'Sozlamalar'} onPress={() => setActivePage('Sozlamalar')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#E31E24" />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content */}
      {renderContent()}

      {/* Hidden file inputs for web image picking */}
      {Platform.OS === 'web' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' } as any}
          />
          <input
            ref={editFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' } as any}
          />
        </>
      )}

    </View>
  );
}

function NavItem({ icon, label, active = false, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.navItem, active && styles.navItemActive]} onPress={onPress}>
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
  pageContent: {
    flex: 1,
    padding: 30,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 0,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31E24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
    marginBottom: 12,
  },
  th: {
    fontWeight: 'bold',
    color: '#999',
    fontSize: 14,
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
  },
  td: {
    fontSize: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
  },
  statIconWrapperRed: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconWrapperGray: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconWrapperGreen: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeWarning: {
    backgroundColor: '#FFF8E1',
  },
  badgeWarningText: {
    color: '#F57F17',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDanger: {
    backgroundColor: '#FFEBEE',
  },
  badgeDangerText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  actionBtnText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 13,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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
    width: (width - 240 - 350 - 40 - 48) / 4, 
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
  },
  // ── Modal Styles ──────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#eee',
  },
  catChipActive: {
    backgroundColor: '#E31E24',
    borderColor: '#E31E24',
  },
  catChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  catChipTextActive: {
    color: '#fff',
  },
  modalRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E31E24',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  barcodeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  barcodeInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  barcodeGenBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
  },
  imagePickerSub: {
    fontSize: 12,
    color: '#ccc',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});
