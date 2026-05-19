
import { CATEGORIES, PRODUCTS as INITIAL_PRODUCTS } from '@/constants/PosData';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useRef, useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const IS_DESKTOP = width > 768;

export default function PosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activePage, setActivePage] = useState('Sotuv');

  // Auth state
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthPassword, setAdminAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Sotuv page state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');



  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loadProducts = () => {
      if (Platform.OS === 'web') {
        const saved = localStorage.getItem(`products_${userId}`);
        if (saved) {
          try {
            setProducts(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to parse products', e);
          }
        }
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('focus', loadProducts);
      return () => window.removeEventListener('focus', loadProducts);
    }
  }, [userId]);

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Ichimliklar');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);

  // Debtors state
  const [debtors, setDebtors] = useState<any[]>([]);
  const [debtFilter, setDebtFilter] = useState<'all' | 'overdue' | 'approaching' | 'future'>('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const getDebtorDaysLeft = (debtDate: string) => {
    try {
      if (!debtDate) return 999;
      const parts = debtDate.split('.');
      if (parts.length !== 3) return 999;
      const [day, month, year] = parts.map(Number);
      const deadlineDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = deadlineDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 999;
    }
  };

  const filteredDebtors = useMemo(() => {
    return debtors.filter(d => {
      if (debtFilter === 'all') return true;
      const days = getDebtorDaysLeft(d.date);
      if (debtFilter === 'overdue') return days < 0;
      if (debtFilter === 'approaching') return days >= 0 && days <= 7;
      if (debtFilter === 'future') return days > 7;
      return true;
    });
  }, [debtors, debtFilter]);

  const [totalPaidAmount, setTotalPaidAmount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadInitialData();
    }
  }, [userId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const keySuffix = `_${user.id}`;
      // Load from local storage scoped to user for instant UI rendering
      if (Platform.OS === 'web') {
        const savedProds = localStorage.getItem(`products${keySuffix}`);
        const savedDebtors = localStorage.getItem(`debtors${keySuffix}`);
        const savedPaid = localStorage.getItem(`totalPaidAmount${keySuffix}`);
        if (savedProds) setProducts(JSON.parse(savedProds));
        if (savedDebtors) setDebtors(JSON.parse(savedDebtors));
        if (savedPaid) setTotalPaidAmount(parseInt(savedPaid, 10) || 0);
      }

      // Fetch Products filtered by user_id
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (prodErr) throw prodErr;
      if (prods) setProducts(prods);

      // Fetch Debtors filtered by user_id
      const { data: dbt, error: dbtErr } = await supabase
        .from('debtors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (dbtErr) throw dbtErr;
      if (dbt) setDebtors(dbt);

    } catch (err: any) {
      console.error('Supabase load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && userId) {
      localStorage.setItem(`products_${userId}`, JSON.stringify(products));
      localStorage.setItem(`debtors_${userId}`, JSON.stringify(debtors));
      localStorage.setItem(`totalPaidAmount_${userId}`, totalPaidAmount.toString());
    }
  }, [products, debtors, totalPaidAmount, userId]);



  const handlePayDebt = async (id: number) => {
    const debtToPay = debtors.find(d => d.id === id);
    if (debtToPay) {
      setTotalPaidAmount(prev => prev + debtToPay.amount);
      const { error } = await supabase.from('debtors').delete().eq('id', id);
      if (error) {
        console.error('Error paying debt:', error);
        return;
      }
    }
    setDebtors(prev => prev.filter(d => d.id !== id));
  };

  // Add Debt Modal state
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState('');

  const handleAddDebt = async () => {
    if (!debtorName.trim() || !debtAmount.trim() || !debtDate.trim()) return;
    
    // Check if overdue
    const [day, month, year] = debtDate.split('.').map(Number);
    const deadlineDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOver = deadlineDate < today;

    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'local-user';

    const newDebt = {
      name: debtorName.trim(),
      phone: debtorPhone.trim(),
      amount: parseInt(debtAmount.replace(/\D/g, ''), 10) || 0,
      date: debtDate.trim(),
      over: isOver,
      user_id: currentUserId,
    };

    const tempId = 'temp-' + Date.now();
    const localDebt = { id: tempId, ...newDebt, created_at: new Date().toISOString() };

    setDebtors(prev => [localDebt, ...prev]);
    setDebtorName('');
    setDebtorPhone('');
    setDebtAmount('');
    setDebtDate('');
    setShowAddDebtModal(false);

    try {
      const { data, error } = await supabase.from('debtors').insert([newDebt]).select();
      if (error) throw error;
      if (data && data[0]) {
        setDebtors(prev => prev.map(d => d.id === tempId ? data[0] : d));
      }
    } catch (err) {
      console.error('Error adding debt to Supabase, saved locally:', err);
    }
  };

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

  const handleAddProduct = async () => {
    if (!newName.trim() || !newPrice.trim() || !newStock.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'local-user';

    const productData = {
      name: newName.trim(),
      category: newCategory,
      price: parseInt(newPrice.toString().replace(/\D/g, ''), 10) || 0,
      stock: parseInt(newStock.toString().replace(/\D/g, ''), 10) || 0,
      code: newBarcode.trim() || String(Math.floor(Math.random() * 900000000 + 100000000)),
      image: newImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=E31E24&color=fff&size=200`,
      user_id: currentUserId,
    };

    const tempId = 'temp-' + Date.now();
    const localProduct = { id: tempId, ...productData, created_at: new Date().toISOString() };

    setProducts(prev => [...prev, localProduct]);
    setNewName('');
    setNewCategory('Ichimliklar');
    setNewPrice('');
    setNewStock('');
    setNewBarcode('');
    setNewImage(null);
    setShowAddModal(false);

    try {
      const { data, error } = await supabase.from('products').insert([productData]).select();
      if (error) throw error;
      if (data && data[0]) {
        setProducts(prev => prev.map(p => p.id === tempId ? data[0] : p));
      }
    } catch (err) {
      console.error('Error adding product to Supabase, saved locally:', err);
    }
  };

  const handleAdminAuth = () => {
    if (Platform.OS === 'web') {
      const savedPassword = localStorage.getItem('adminPassword');
      if (adminAuthPassword === savedPassword) {
        setShowAdminAuthModal(false);
        setAdminAuthPassword('');
        setAuthError('');
        router.push('/admin');
      } else {
        setAuthError('Noto\'g\'ri parol!');
      }
    }
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

  const handleEditProduct = async () => {
    if (!editName.trim() || !editPrice.trim() || !editStock.trim() || !editId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'local-user';

    const updatedData = {
      name: editName.trim(),
      category: editCategory,
      price: parseInt(editPrice.replace(/\D/g, ''), 10) || 0,
      stock: parseInt(editStock, 10) || 0,
      code: editBarcode.trim(),
      image: editImage,
      user_id: currentUserId,
    };

    setProducts(prev => prev.map(p =>
      p.id === editId ? { ...p, ...updatedData } : p
    ));
    setShowEditModal(false);

    try {
      if (typeof editId === 'number' || !editId.toString().startsWith('temp-')) {
        const { error } = await supabase.from('products').update(updatedData).eq('id', editId);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error updating product on Supabase, updated locally:', err);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catMatch = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!query) return catMatch;
      
      const nameMatch = p.name.toLowerCase().includes(query);
      const codeMatch = p.code ? p.code.toLowerCase().includes(query) : false;
      const categoryMatch = p.category ? p.category.toLowerCase().includes(query) : false;
      
      return catMatch && (nameMatch || codeMatch || categoryMatch);
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      alert('Mahsulot omborda qolmagan!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Omborda faqat ${product.stock} ta mahsulot bor!`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    
    // Check if the input is an exact match for a barcode of one of our products
    const cleanText = text.trim();
    if (cleanText.length >= 3) {
      const foundProduct = products.find(p => p.code && p.code.trim() === cleanText);
      if (foundProduct) {
        addToCart(foundProduct);
        setSearchQuery('');
      }
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (delta > 0 && newQty > item.stock) {
              alert(`Omborda faqat ${item.stock} ta mahsulot bor!`);
              return item;
            }
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const completeSale = async (method: string, splitData?: { cash: number, card: number }) => {
    if (method === 'Qarz') {
      setShowPaymentModal(false);
      setDebtorName('');
      setDebtAmount(total.toString());
      setShowAddDebtModal(true);
      return;
    }

    if (method === 'Aralash' && !splitData) {
      setSplitCash(total.toString());
      setSplitCard('0');
      setShowPaymentModal(false);
      setShowSplitPaymentModal(true);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'local-user';

    const methodLabel = method === 'Aralash' && splitData 
      ? `Aralash (N:${splitData.cash.toLocaleString()} + K:${splitData.card.toLocaleString()})`
      : method;

    const transactionData = {
      customer: 'Mijoz',
      amount: total,
      status: 'Muvaffaqiyatli',
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      method: methodLabel,
      user_id: currentUserId,
    };

    // Update local products stock immediately to ensure instant response and local persistence
    const newProducts = products.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });
    setProducts(newProducts);

    alert(`To'lov muvaffaqiyatli yakunlandi! Jami: ${total.toLocaleString()} so'm`);
    setCart([]);
    setShowPaymentModal(false);
    setShowSplitPaymentModal(false);

    try {
      const updatePromises = cart.map(item => {
        if (typeof item.id === 'number' || !item.id.toString().startsWith('temp-')) {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            return supabase.from('products').update({ stock: newStock }).eq('id', item.id);
          }
        }
        return Promise.resolve({ error: null });
      });

      await Promise.all(updatePromises);
      await supabase.from('transactions').insert([transactionData]);
    } catch (err) {
      console.error('Error completing sale on Supabase, saved locally:', err);
    }
  };

  const handleSplitConfirm = () => {
    const cash = parseInt(splitCash.replace(/\D/g, ''), 10) || 0;
    const card = parseInt(splitCard.replace(/\D/g, ''), 10) || 0;
    
    if (cash + card < total) {
      alert("Kiritilgan summa jami summadan kam!");
      return;
    }
    
    completeSale('Aralash', { cash, card });
  };

  const onSplitCashChange = (val: string) => {
    setSplitCash(val);
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    if (num <= total) {
      setSplitCard((total - num).toString());
    }
  };

  const onSplitCardChange = (val: string) => {
    setSplitCard(val);
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    if (num <= total) {
      setSplitCash((total - num).toString());
    }
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

              </View>

              <View style={styles.controlsRow}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search-outline" size={20} color="#999" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Mahsulot qidirish..."
                    value={searchQuery}
                    onChangeText={handleSearchTextChange}
                    onSubmitEditing={() => {
                      const cleanText = searchQuery.trim();
                      const foundProduct = products.find(p => 
                        (p.code && p.code.trim() === cleanText) ||
                        p.name.toLowerCase() === cleanText.toLowerCase()
                      );
                      if (foundProduct) {
                        addToCart(foundProduct);
                        setSearchQuery('');
                      }
                    }}
                  />
                </View>
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
                          <Text style={[styles.stockValue, p.stock <= 0 && styles.stockLow]}>
                            {p.stock} ta
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[styles.addBtn, p.stock <= 0 && styles.addBtnDisabled]} 
                        onPress={() => addToCart(p)}
                        disabled={p.stock <= 0}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>

                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>


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
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
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


      case 'Qarzdorlar': {
        const overdueCount = debtors.filter(d => getDebtorDaysLeft(d.date) < 0).length;
        const approachingCount = debtors.filter(d => {
          const days = getDebtorDaysLeft(d.date);
          return days >= 0 && days <= 7;
        }).length;
        const farCount = debtors.filter(d => getDebtorDaysLeft(d.date) > 7).length;

        return (
          <View style={styles.pageContent}>
            <View style={styles.pageHeaderRow}>
              <Text style={styles.pageTitle}>Qarzdorlar</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.filterToggleBtn, showFilterOptions && styles.filterToggleBtnActive]} 
                  onPress={() => setShowFilterOptions(!showFilterOptions)}
                >
                  <Ionicons name="filter" size={20} color={showFilterOptions ? "#fff" : "#E31E24"} />
                  <Text style={[styles.filterToggleText, showFilterOptions && { color: '#fff' }]}>Filtrlash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAddDebtModal(true)}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>Qarz qo'shish</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modals moved to root */}




            
            <View style={[styles.statsGrid, { marginBottom: 20 }]}>
              <View style={[styles.statCard, { flex: 1, backgroundColor: '#FFF5F5', borderColor: '#FFEBEB', borderWidth: 1 }]}>
                <View style={styles.statIconWrapperRed}>
                  <Ionicons name="wallet-outline" size={24} color="#E31E24" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Umumiy Qarz Miqdori</Text>
                  <Text style={[styles.statValue, { color: '#E31E24' }]}>
                    {debtors.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} so'm
                  </Text>
                </View>
              </View>
              <View style={[styles.statCard, { flex: 1 }]}>
                 <View style={styles.statIconWrapperGray}>
                  <Ionicons name="people-outline" size={24} color="#333" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Qarzdorlar Soni</Text>
                  <Text style={styles.statValue}>{debtors.length} ta</Text>
                </View>
              </View>
              <View style={[styles.statCard, { flex: 1 }]}>
                 <View style={styles.statIconWrapperGreen}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#28A745" />
                </View>
                <View>
                  <Text style={styles.statLabel}>To'langan QarZlar (Oy)</Text>
                  <Text style={styles.statValue}>{totalPaidAmount.toLocaleString()} so'm</Text>
                </View>
              </View>
            </View>

            {showFilterOptions && (
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[styles.filterBtn, debtFilter === 'all' && styles.filterBtnActive]}
                  onPress={() => setDebtFilter('all')}
                >
                  <Text style={[styles.filterBtnText, debtFilter === 'all' && styles.filterBtnTextActive]}>
                    Barchasi ({debtors.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    styles.filterBtnRed,
                    debtFilter === 'overdue' && styles.filterBtnRedActive
                  ]}
                  onPress={() => setDebtFilter('overdue')}
                >
                  <View style={[styles.dotIndicator, { backgroundColor: '#E31E24' }]} />
                  <Text style={[
                    styles.filterBtnText,
                    styles.filterBtnRedText,
                    debtFilter === 'overdue' && styles.filterBtnRedTextActive
                  ]}>
                    Muddati o'tganlar ({overdueCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    styles.filterBtnOrange,
                    debtFilter === 'approaching' && styles.filterBtnOrangeActive
                  ]}
                  onPress={() => setDebtFilter('approaching')}
                >
                  <View style={[styles.dotIndicator, { backgroundColor: '#FB8C00' }]} />
                  <Text style={[
                    styles.filterBtnText,
                    styles.filterBtnOrangeText,
                    debtFilter === 'approaching' && styles.filterBtnOrangeTextActive
                  ]}>
                    Muddati yaqinlashayotganlar ({approachingCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    styles.filterBtnGreen,
                    debtFilter === 'future' && styles.filterBtnGreenActive
                  ]}
                  onPress={() => setDebtFilter('future')}
                >
                  <View style={[styles.dotIndicator, { backgroundColor: '#28A745' }]} />
                  <Text style={[
                    styles.filterBtnText,
                    styles.filterBtnGreenText,
                    debtFilter === 'future' && styles.filterBtnGreenTextActive
                  ]}>
                    To'lashga ancha borlar ({farCount})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.card}>
               <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2.5 }]}>FIO</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Telefon</Text>
                <Text style={[styles.th, { flex: 2 }]}>Qarz Summasi</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Muddati</Text>
              </View>
              <ScrollView>
                {filteredDebtors.map(debtor => {
                  // Re-calculate over status dynamically
                  let isOver = debtor.over;
                  try {
                    const [day, month, year] = debtor.date.split('.').map(Number);
                    const deadlineDate = new Date(year, month - 1, day);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    isOver = deadlineDate < today;
                  } catch (e) {}

                  return (
                    <View key={debtor.id} style={styles.tr}>
                      <View style={[styles.td, { flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>{debtor.name.charAt(0)}</Text>
                        </View>
                        <Text style={{ fontWeight: '600', color: '#333' }}>{debtor.name}</Text>
                      </View>
                      <Text style={[styles.td, { flex: 1.5, color: '#666' }]}>{debtor.phone}</Text>
                      <Text style={[styles.td, { flex: 2, fontWeight: 'bold', color: '#E31E24' }]}>
                        {debtor.amount.toLocaleString()} so'm
                      </Text>
                      <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }]}>
                         <View style={[styles.badge, isOver ? styles.badgeDanger : styles.badgeWarning]}>
                            <Text style={[styles.badgeText, isOver ? styles.badgeDangerText : styles.badgeWarningText]}>
                              {debtor.date}
                            </Text>
                         </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        );
      }


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
          <NavItem icon="people-outline" label="Qarzdorlar" active={activePage === 'Qarzdorlar'} onPress={() => setActivePage('Qarzdorlar')} />
          <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10, marginHorizontal: 20 }} />
          <NavItem icon="shield-checkmark-outline" label="Admin Panel" onPress={() => setShowAdminAuthModal(true)} />
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
        >

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

      {/* Admin Auth Modal */}
      <Modal
        visible={showAdminAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdminAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Admin Paneliga Kirish</Text>
              <TouchableOpacity onPress={() => setShowAdminAuthModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Admin parolini kiriting</Text>
            <View style={[styles.inputWrapper, authError ? { borderColor: '#E31E24' } : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInputNoMargin}
                placeholder="Parol"
                value={adminAuthPassword}
                onChangeText={setAdminAuthPassword}
                secureTextEntry
                autoFocus
              />
            </View>
            
            {authError ? <Text style={styles.errorTextSmall}>{authError}</Text> : null}

            <View style={[styles.modalActions, { marginTop: 20 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdminAuthModal(false)}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAdminAuth}
              >
                <Text style={styles.saveBtnText}>Kirish</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>To'lov turini tanlang</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.totalDisplay}>Jami: {total.toLocaleString()} so'm</Text>

            <View style={styles.paymentOptions}>
              <TouchableOpacity 
                style={[styles.payOptionBtn, { backgroundColor: '#F1F8E9' }]} 
                onPress={() => completeSale('Naqd')}
              >
                <Ionicons name="cash-outline" size={28} color="#43A047" />
                <Text style={[styles.payOptionText, { color: '#43A047' }]}>Naqd pul</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.payOptionBtn, { backgroundColor: '#E3F2FD' }]} 
                onPress={() => completeSale('Karta')}
              >
                <Ionicons name="card-outline" size={28} color="#1E88E5" />
                <Text style={[styles.payOptionText, { color: '#1E88E5' }]}>Karta orqali</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.payOptionBtn, { backgroundColor: '#FFF3E0' }]} 
                onPress={() => completeSale('Aralash')}
              >
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Ionicons name="cash-outline" size={20} color="#FB8C00" />
                  <Ionicons name="card-outline" size={20} color="#FB8C00" />
                </View>
                <Text style={[styles.payOptionText, { color: '#FB8C00' }]}>Aralash (Naqd+Karta)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.payOptionBtn, { backgroundColor: '#FFEBEE' }]} 
                onPress={() => completeSale('Qarz')}
              >
                <Ionicons name="people-outline" size={28} color="#E31E24" />
                <Text style={[styles.payOptionText, { color: '#E31E24' }]}>Qarzga</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Split Payment Modal */}
      <Modal
        visible={showSplitPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSplitPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aralash To'lov</Text>
              <TouchableOpacity onPress={() => setShowSplitPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.totalBanner}>
              <Text style={styles.totalBannerLabel}>Jami summa</Text>
              <Text style={styles.totalBannerValue}>{total.toLocaleString()} so'm</Text>
            </View>

            <Text style={styles.fieldLabel}>Naqd pul miqdori</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="cash-outline" size={20} color="#28A745" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInputNoMargin}
                placeholder="0"
                value={splitCash}
                onChangeText={onSplitCashChange}
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Karta orqali miqdori</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color="#2196F3" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInputNoMargin}
                placeholder="0"
                value={splitCard}
                onChangeText={onSplitCardChange}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.modalActions, { marginTop: 30 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setShowSplitPaymentModal(false);
                setShowPaymentModal(true);
              }}>
                <Text style={styles.cancelBtnText}>Orqaga</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSplitConfirm}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Tasdiqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Debt Modal */}

      <Modal
        visible={showAddDebtModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddDebtModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yangi Qarz Qo'shish</Text>
              <TouchableOpacity onPress={() => setShowAddDebtModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Mijoz F.I.O *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masalan: Aliyev Vali"
              value={debtorName}
              onChangeText={setDebtorName}
            />

            <Text style={styles.fieldLabel}>Telefon raqami</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+998 90 123 45 67"
              value={debtorPhone}
              onChangeText={setDebtorPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Qarz summasi *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="500000"
              value={debtAmount}
              onChangeText={setDebtAmount}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>To'lash muddati (KK.OO.YYYY) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="12.05.2026"
              value={debtDate}
              onChangeText={setDebtDate}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddDebtModal(false)}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!debtorName || !debtAmount || !debtDate) && styles.saveBtnDisabled]}
                onPress={handleAddDebt}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


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
    backgroundColor: '#FFF3E0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 16,
  },
  modalInputNoMargin: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1A1A1A',
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  errorTextSmall: {
    color: '#E31E24',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  totalDisplay: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1A1A1A',
    marginBottom: 24,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
  },
  paymentOptions: {
    gap: 12,
  },
  payOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  payOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
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
  addBtnDisabled: {
    backgroundColor: '#ccc',
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
  totalBanner: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  totalBannerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalBannerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  paymentOptions: {
    gap: 12,
  },
  payOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  payOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
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
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E31E24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  filterToggleBtnActive: {
    backgroundColor: '#E31E24',
  },
  filterToggleText: {
    color: '#E31E24',
    fontWeight: 'bold',
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
  },
  filterBtnActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  filterBtnText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterBtnRed: {
    borderColor: '#FFCDD2',
  },
  filterBtnRedActive: {
    backgroundColor: '#E31E24',
    borderColor: '#E31E24',
  },
  filterBtnRedText: {
    color: '#C62828',
  },
  filterBtnRedTextActive: {
    color: '#fff',
  },
  filterBtnOrange: {
    borderColor: '#FFE0B2',
  },
  filterBtnOrangeActive: {
    backgroundColor: '#FB8C00',
    borderColor: '#FB8C00',
  },
  filterBtnOrangeText: {
    color: '#EF6C00',
  },
  filterBtnOrangeTextActive: {
    color: '#fff',
  },
  filterBtnGreen: {
    borderColor: '#C8E6C9',
  },
  filterBtnGreenActive: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
  },
  filterBtnGreenText: {
    color: '#2E7D32',
  },
  filterBtnGreenTextActive: {
    color: '#fff',
  },
});
