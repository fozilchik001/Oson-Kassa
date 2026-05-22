
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const IS_DESKTOP = width > 1024;

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState((params.tab as string) || 'Hisobotlar');

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as string);
    }
  }, [params.tab]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [adminName, setAdminName] = useState('Administrator');
  const [adminAvatar, setAdminAvatar] = useState('https://ui-avatars.com/api/?name=Admin&background=E31E24&color=fff');
  const avatarInputRef = useRef<any>(null);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (userId) {
      loadInitialData();
    }
  }, [userId]);

  const loadInitialData = async () => {
    if (Platform.OS === 'web') {
      const savedName = localStorage.getItem('adminName');
      if (savedName) setAdminName(savedName);
      const savedAvatar = localStorage.getItem('adminAvatar');
      if (savedAvatar) setAdminAvatar(savedAvatar);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (user.user_metadata?.shop_name) {
      setAdminName(user.user_metadata.shop_name);
    }

    const keySuffix = `_${user.id}`;
    // Load from local storage scoped to user for instant UI rendering
    if (Platform.OS === 'web') {
      const savedInventory = localStorage.getItem(`products${keySuffix}`);
      const savedStaff = localStorage.getItem(`staff${keySuffix}`);
      const savedExpenses = localStorage.getItem(`expenses${keySuffix}`);
      const savedDebtors = localStorage.getItem(`debtors${keySuffix}`);
      const savedTrx = localStorage.getItem(`transactions${keySuffix}`);
      if (savedInventory) setInventory(JSON.parse(savedInventory));
      if (savedStaff) setStaff(JSON.parse(savedStaff));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedDebtors) setDebtors(JSON.parse(savedDebtors));
      if (savedTrx) setTransactions(JSON.parse(savedTrx));
    }

    try {
      // Fetch Products
      const { data: prods, error: prodErr } = await supabase.from('products').select('*').eq('user_id', user.id);
      if (prods && !prodErr) setInventory(prods);

      // Fetch Staff
      const { data: stf, error: stfErr } = await supabase.from('staff').select('*').eq('user_id', user.id);
      if (stf && !stfErr) setStaff(stf);

      // Fetch Expenses
      const { data: exp, error: expErr } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (exp && !expErr) setExpenses(exp);

      // Fetch Debtors
      const { data: dbt, error: dbtErr } = await supabase.from('debtors').select('*').eq('user_id', user.id);
      if (dbt && !dbtErr) setDebtors(dbt);

      // Fetch Transactions
      const { data: trx, error: trxErr } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (trx && !trxErr) setTransactions(trx);
    } catch (err) {
      console.log('Supabase load error:', err);
    }
  };

  const handlePickAvatar = () => {
    if (Platform.OS === 'web') {
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
        avatarInputRef.current.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setAdminAvatar(result);
            localStorage.setItem('adminAvatar', result);
          };
          reader.readAsDataURL(file);
        };
        avatarInputRef.current.click();
      }
    }
  };

  // Staff state
  const [staff, setStaff] = useState<any[]>([]);


  // Add Staff Modal state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Kassir');
  const [staffPhone, setStaffPhone] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffImage, setStaffImage] = useState<string | null>(null);
  const staffImageInputRef = useRef<any>(null);

  const handlePickStaffImage = () => {
    if (Platform.OS === 'web') {
      if (staffImageInputRef.current) {
        staffImageInputRef.current.value = '';
        staffImageInputRef.current.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setStaffImage(result);
          };
          reader.readAsDataURL(file);
        };
        staffImageInputRef.current.click();
      }
    }
  };

  const handleSaveStaff = async () => {
    if (!staffName.trim() || !staffPhone.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'local-user';

    const staffData = {
      name: staffName.trim(),
      role: staffRole,
      phone: staffPhone.trim(),
      image: staffImage,
      status: 'Faol',
      user_id: currentUserId
    };

    const tempId = editingStaffId || 'temp-' + Date.now();

    if (editingStaffId) {
      setStaff(prev => prev.map(s => s.id === editingStaffId ? { ...s, ...staffData } : s));
      resetStaffForm();
      try {
        if (typeof editingStaffId === 'number' || !editingStaffId.toString().startsWith('temp-')) {
          await supabase.from('staff').update(staffData).eq('id', editingStaffId);
        }
      } catch (err) {
        console.error('Error updating staff on Supabase:', err);
      }
    } else {
      const localStaff = { id: tempId, ...staffData, created_at: new Date().toISOString() };
      setStaff(prev => [...prev, localStaff]);
      resetStaffForm();
      try {
        const { data, error } = await supabase.from('staff').insert([staffData]).select();
        if (error) throw error;
        if (data && data[0]) {
          setStaff(prev => prev.map(s => s.id === tempId ? data[0] : s));
        }
      } catch (err) {
        console.error('Error inserting staff to Supabase, saved locally:', err);
      }
    }
  };

  const resetStaffForm = () => {
    setStaffName('');
    setStaffPhone('');
    setStaffRole('Kassir');
    setStaffImage(null);
    setEditingStaffId(null);
    setShowAddStaffModal(false);
  };

  const handleEditStaffClick = (person: any) => {
    setEditingStaffId(person.id);
    setStaffName(person.name);
    setStaffRole(person.role);
    setStaffPhone(person.phone);
    setStaffImage(person.image || null);
    setShowAddStaffModal(true);
  };

  const handleDeleteStaff = (id: number) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    supabase.from('staff').delete().eq('id', id).then();
  };

  // Inventory state
  const [inventory, setInventory] = useState<any[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      localStorage.setItem('products', JSON.stringify(inventory));
    }
  }, [inventory]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      localStorage.setItem('products', JSON.stringify(inventory));
    }
  }, [inventory]);

  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Ichimliklar');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodCode, setProdCode] = useState('');
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodImage, setProdImage] = useState<string | null>(null);
  const prodImageInputRef = useRef<any>(null);

  const handlePickProdImage = () => {
    if (Platform.OS === 'web') {
      if (prodImageInputRef.current) {
        prodImageInputRef.current.value = '';
        prodImageInputRef.current.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setProdImage(result);
          };
          reader.readAsDataURL(file);
        };
        prodImageInputRef.current.click();
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!prodName.trim() || !prodPrice.trim() || !prodStock.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'local-user';

    const productData = {
      name: prodName.trim(),
      category: prodCategory,
      price: parseInt(prodPrice.toString().replace(/\D/g, ''), 10) || 0,
      stock: parseInt(prodStock.toString().replace(/\D/g, ''), 10) || 0,
      code: prodCode.trim() || Math.floor(Math.random() * 1000000000).toString(),
      image: prodImage || 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=200&h=200&fit=crop',
      user_id: currentUserId
    };

    const tempId = editingProdId || 'temp-' + Date.now();

    if (editingProdId) {
      setInventory(prev => prev.map(p => p.id === editingProdId ? { ...p, ...productData } : p));
      resetProdForm();
      try {
        if (typeof editingProdId === 'number' || !editingProdId.toString().startsWith('temp-')) {
          await supabase.from('products').update(productData).eq('id', editingProdId);
        }
      } catch (err) {
        console.error('Error updating product on Supabase:', err);
      }
    } else {
      const localProduct = { id: tempId, ...productData, created_at: new Date().toISOString() };
      setInventory(prev => [localProduct, ...prev]);
      resetProdForm();
      try {
        const { data, error } = await supabase.from('products').insert([productData]).select();
        if (error) throw error;
        if (data && data[0]) {
          setInventory(prev => prev.map(p => p.id === tempId ? data[0] : p));
        }
      } catch (err) {
        console.error('Error inserting product to Supabase, saved locally:', err);
      }
    }
  };

  const resetProdForm = () => {
    setProdName('');
    setProdPrice('');
    setProdStock('');
    setProdCode('');
    setProdCategory('Ichimliklar');
    setProdImage(null);
    setEditingProdId(null);
    setShowAddProdModal(false);
  };

  const handleEditProdClick = (p: any) => {
    setEditingProdId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price.toString());
    setProdStock(p.stock.toString());
    setProdCode(p.code);
    setProdImage(p.image || null);
    setShowAddProdModal(true);
  };

  const handleDeleteProd = async (id: string) => {
    setInventory(prev => prev.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  // Expenses state
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Boshqa');
  const [editingExpId, setEditingExpId] = useState<number | null>(null);

  const handleSaveExpense = async () => {
    if (!expTitle.trim() || !expAmount.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'local-user';

    const parsedAmount = parseInt(expAmount.toString().replace(/\D/g, ''), 10) || 0;
    const expenseData = {
      title: expTitle.trim(),
      amount: parsedAmount,
      category: expCategory,
      date: new Date().toLocaleDateString('uz-UZ'),
      user_id: currentUserId
    };

    const tempId = editingExpId || 'temp-' + Date.now();

    if (editingExpId) {
      setExpenses(prev => prev.map(e => e.id === editingExpId ? { ...e, ...expenseData } : e));
      resetExpForm();
      try {
        if (typeof editingExpId === 'number' || !editingExpId.toString().startsWith('temp-')) {
          await supabase.from('expenses').update(expenseData).eq('id', editingExpId);
        }
      } catch (err) {
        console.error('Error updating expense on Supabase:', err);
      }
    } else {
      const localExpense = { id: tempId, ...expenseData, created_at: new Date().toISOString() };
      setExpenses(prev => [localExpense, ...prev]);
      resetExpForm();
      try {
        const { data, error } = await supabase.from('expenses').insert([expenseData]).select();
        if (error) throw error;
        if (data && data[0]) {
          setExpenses(prev => prev.map(e => e.id === tempId ? data[0] : e));
        }
      } catch (err) {
        console.error('Error inserting expense to Supabase, saved locally:', err);
      }
    }
  };

  const resetExpForm = () => {
    setExpTitle('');
    setExpAmount('');
    setExpCategory('Boshqa');
    setEditingExpId(null);
    setShowAddExpModal(false);
  };

  const handleEditExpClick = (e: any) => {
    setEditingExpId(e.id);
    setExpTitle(e.title);
    setExpAmount(e.amount.toString());
    setExpCategory(e.category);
    setShowAddExpModal(true);
  };

  const handleDeleteExp = async (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await supabase.from('expenses').delete().eq('id', id);
  };

  // Expenses state
  const [expenses, setExpenses] = useState<any[]>([]);

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


  const handlePayDebt = async (id: number) => {
    const debtToPay = debtors.find(d => d.id === id);
    if (debtToPay) {
      setTotalPaidAmount(prev => prev + debtToPay.amount);
      await supabase.from('debtors').delete().eq('id', id);
    }
    setDebtors(prev => prev.filter(d => d.id !== id));
  };

  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState('');

  // Pay Debt Modal state
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [selectedDebtorForPay, setSelectedDebtorForPay] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');

  const openPayDebtModal = (debtor: any) => {
    setSelectedDebtorForPay(debtor);
    setPayAmount(debtor.amount.toString());
    setShowPayDebtModal(true);
  };

  const handlePartialPayDebt = async () => {
    if (!selectedDebtorForPay) return;
    const paid = parseInt(payAmount.replace(/\D/g, ''), 10) || 0;
    if (paid <= 0) return;

    if (paid >= selectedDebtorForPay.amount) {
      await handlePayDebt(selectedDebtorForPay.id);
    } else {
      const remaining = selectedDebtorForPay.amount - paid;
      setTotalPaidAmount(prev => prev + paid);
      const { error } = await supabase
        .from('debtors')
        .update({ amount: remaining })
        .eq('id', selectedDebtorForPay.id);
      setDebtors(prev => prev.map(d =>
        d.id === selectedDebtorForPay.id ? { ...d, amount: remaining } : d
      ));
      if (error) console.error('Error updating debt:', error);
    }
    setShowPayDebtModal(false);
    setSelectedDebtorForPay(null);
    setPayAmount('');
  };

  const handleAddDebt = async () => {
    if (!debtorName.trim() || !debtAmount.trim() || !debtDate.trim()) return;
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
      user_id: currentUserId
    };

    const tempId = 'temp-' + Date.now();
    const localDebt = { id: tempId, ...newDebt, created_at: new Date().toISOString() };

    setDebtors(prev => [...prev, localDebt]);
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
      console.error('Error inserting debt to Supabase, saved locally:', err);
    }
  };

  const [transactions, setTransactions] = useState<any[]>([]);

  const [salesItems, setSalesItems] = useState<any[]>([]);


  useEffect(() => {
    if (Platform.OS === 'web' && userId) {
      localStorage.setItem(`staff_${userId}`, JSON.stringify(staff));
      localStorage.setItem(`expenses_${userId}`, JSON.stringify(expenses));
      localStorage.setItem(`transactions_${userId}`, JSON.stringify(transactions));
      localStorage.setItem(`salesItems_${userId}`, JSON.stringify(salesItems));
      localStorage.setItem(`debtors_${userId}`, JSON.stringify(debtors));
      localStorage.setItem(`totalPaidAmount_${userId}`, totalPaidAmount.toString());
    }
  }, [staff, expenses, transactions, salesItems, debtors, totalPaidAmount, userId]);



  const [chartPeriod, setChartPeriod] = useState('Haftalik');

  const dynamicStats = useMemo(() => {
    const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = transactions.length;
    const profit = Math.floor(totalSales * 0.2); // 20% margin
    const uniqueCustomers = new Set(transactions.map(t => t.customer)).size;

    return [
      { id: 1, label: "Bugungi savdo", value: `${totalSales.toLocaleString()} so'm`, icon: "cash-outline", color: "#E31E24", trend: "+12%" },
      { id: 2, label: "Buyurtmalar", value: `${totalOrders} ta`, icon: "cart-outline", color: "#E31E24", trend: "+5%" },
      { id: 3, label: "Mijozlar", value: `${uniqueCustomers} ta`, icon: "people-outline", color: "#E31E24", trend: "+2" },
      { id: 4, label: "Foyda", value: `${profit.toLocaleString()} so'm`, icon: "trending-up-outline", color: "#28A745", trend: "+8%" },
    ];
  }, [transactions]);

  const chartData = useMemo(() => {
    const data: Record<string, number[]> = {
      'Kunlik': [20, 45, 28, 80, 99, 43, 50, 60, 30, 20, 10, 5],
      'Haftalik': [40, 70, 45, 90, 65, 80, 50],
      'Oylik': [30, 40, 50, 60, 70, 80, 90, 85, 75, 65, 55, 45]
    };
    return data[chartPeriod] || data['Haftalik'];
  }, [chartPeriod]);



  const renderOverview = () => (
    <>
      <View style={styles.statsGrid}>
        {dynamicStats.map((stat) => (
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
            <TouchableOpacity 
              style={styles.cardAction}
              onPress={() => {
                const next: Record<string, string> = { 'Kunlik': 'Haftalik', 'Haftalik': 'Oylik', 'Oylik': 'Kunlik' };
                setChartPeriod(prev => next[prev]);
              }}
            >
              <Text style={styles.cardActionText}>{chartPeriod}</Text>
              <Ionicons name="chevron-down" size={14} color="#E31E24" />
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBars}>
               {chartData.map((h, i) => (
                 <View key={i} style={styles.chartBarGroup}>
                    <View style={[styles.chartBar, { height: h + '%', backgroundColor: i === chartData.length - 1 ? '#E31E24' : '#FEEBEB' }]} />
                    <Text style={styles.chartDay}>
                      {chartPeriod === 'Kunlik' ? `${i*2}:00` : 
                       chartPeriod === 'Oylik' ? `${i+1}` :
                       ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'][i]}
                    </Text>
                 </View>
               ))}
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.activityCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>So'nggi savdolar</Text>
            <TouchableOpacity onPress={() => router.push('/admin/sales')}>
              <Text style={styles.cardLink}>Barchasi</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionList}>
            {transactions.map((item) => (
              <View key={item.id} style={styles.transactionItem}>
                <View style={styles.transactionAvatar}>
                  <Text style={styles.transactionAvatarText}>{item.customer.charAt(0)}</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{item.customer}</Text>
                  <Text style={styles.transactionTime}>{item.time}</Text>
                </View>
                <View style={styles.transactionPrice}>
                  <Text style={styles.transactionAmount}>{item.amount.toLocaleString()} so'm</Text>
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
        <Text style={styles.sectionTitle}>Sotilgan mahsulotlar hisoboti</Text>
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Mahsulot nomi</Text>
            <Text style={[styles.th, { flex: 1 }]}>Kategoriya</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Soni</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Umumiy summa</Text>
          </View>
          {salesItems.map(item => (
            <View key={item.id} style={styles.tr}>
              <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{item.name}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{item.category}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{item.quantity} ta</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#28A745' }]}>
                {item.total.toLocaleString()} so'm
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Tezkor amallar</Text>
        <View style={styles.actionGrid}>
           <QuickAction icon="add-circle-outline" label="Mahsulot qo'shish" color="#E31E24" onPress={() => setActiveTab('Inventory')} />
           <QuickAction icon="person-add-outline" label="Sotuvchi qo'shish" color="#E31E24" onPress={() => setActiveTab('Staff')} />
           <QuickAction 
             icon="print-outline" 
             label="Hisobot chiqarish" 
             color="#E31E24" 
             onPress={() => {
               setSuccessMessage('Hisobot Excel formatida muvaffaqiyatli yuklab olindi!');
               setShowSuccessModal(true);
             }} 
           />
           <QuickAction icon="settings-outline" label="Tizim sozlamalari" color="#E31E24" onPress={() => setActiveTab('Settings')} />
        </View>
      </View>
    </>
  );

  const renderStaff = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Xodimlar ro'yxati</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAddStaffModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Yangi xodim</Text>
        </TouchableOpacity>
      </View>

      {/* Add Staff Modal */}
      <Modal
        visible={showAddStaffModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingStaffId ? 'Xodimni Tahrirlash' : 'Yangi Xodim Qo\'shish'}</Text>
              <TouchableOpacity onPress={resetStaffForm}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={handlePickStaffImage} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {staffImage ? (
                  <Image source={{ uri: staffImage }} style={{ width: 80, height: 80 }} />
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color="#999" />
                    <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>Rasm</Text>
                  </>
                )}
              </TouchableOpacity>
              {Platform.OS === 'web' && (
                <input
                  type="file"
                  accept="image/*"
                  ref={staffImageInputRef}
                  style={{ display: 'none' }}
                />
              )}
            </View>

            <Text style={styles.fieldLabel}>F.I.O *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masalan: Sardor Amanov"
              value={staffName}
              onChangeText={setStaffName}
            />

            <Text style={styles.fieldLabel}>Lavozimi</Text>
            <View style={styles.categoryPicker}>
              {['Kassir', 'Admin', 'Menejer'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.catChip, staffRole === role && styles.catChipActive]}
                  onPress={() => setStaffRole(role)}
                >
                  <Text style={[styles.catChipText, staffRole === role && styles.catChipTextActive]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Telefon raqami *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+998 90 123 45 67"
              value={staffPhone}
              onChangeText={setStaffPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetStaffForm}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!staffName || !staffPhone) && styles.saveBtnDisabled]}
                onPress={handleSaveStaff}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>F.I.O</Text>
        <Text style={[styles.th, { flex: 1 }]}>Lavozim</Text>
        <Text style={[styles.th, { flex: 1.5 }]}>Telefon</Text>
        <Text style={[styles.th, { flex: 1 }]}>Holat</Text>
        <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Amallar</Text>
      </View>
      {staff.map(person => (
        <View key={person.id} style={styles.tr}>
          <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            {person.image ? (
              <Image source={{ uri: person.image }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <View style={styles.miniAvatar}>
                <Text style={styles.miniAvatarText}>{person.name.charAt(0)}</Text>
              </View>
            )}
            <Text style={styles.tdTextBold}>{person.name}</Text>
          </View>
          <Text style={[styles.td, { flex: 1 }]}>{person.role}</Text>
          <Text style={[styles.td, { flex: 1.5 }]}>{person.phone}</Text>
          <View style={[styles.td, { flex: 1 }]}>
            <View style={[styles.badge, person.status === 'Faol' ? styles.badgeSuccess : styles.badgeWarning]}>
              <Text style={[styles.badgeText, person.status === 'Faol' ? styles.badgeSuccessText : styles.badgeWarningText]}>{person.status}</Text>
            </View>
          </View>
          <View style={[styles.td, { flex: 0.8, flexDirection: 'row', justifyContent: 'flex-end', gap: 15 }]}>
            <TouchableOpacity onPress={() => handleEditStaffClick(person)}>
              <Ionicons name="pencil-outline" size={20} color="#007BFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteStaff(person.id)}>
              <Ionicons name="trash-outline" size={20} color="#E31E24" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderInventory = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Ombor qoldig'i</Text>
        <View style={styles.headerActionsSmall}>
          <View style={styles.searchBarSmall}>
            <Ionicons name="search" size={16} color="#999" />
            <TextInput placeholder="Mahsulot qidirish..." style={styles.searchInputSmall} />
          </View>
          <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowAddProdModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnTextSmall}>Yangi mahsulot</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Product Modal */}
      <Modal
        visible={showAddProdModal}
        transparent
        animationType="fade"
        onRequestClose={resetProdForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProdId ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot Qo\'shish'}</Text>
              <TouchableOpacity onPress={resetProdForm}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={handlePickProdImage} style={{ width: 100, height: 100, borderRadius: 16, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {prodImage ? (
                  <Image source={{ uri: prodImage }} style={{ width: 100, height: 100 }} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color="#999" />
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>Rasm</Text>
                  </>
                )}
              </TouchableOpacity>
              {Platform.OS === 'web' && (
                <input
                  type="file"
                  accept="image/*"
                  ref={prodImageInputRef}
                  style={{ display: 'none' }}
                />
              )}
            </View>

            <Text style={styles.fieldLabel}>Mahsulot nomi *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masalan: Coca Cola 1.5L"
              value={prodName}
              onChangeText={setProdName}
            />

            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Narxi (so'm) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="10000"
                  value={prodPrice}
                  onChangeText={setProdPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Soni (miqdori) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="50"
                  value={prodStock}
                  onChangeText={setProdStock}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Shtrix kod</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="123456789"
              value={prodCode}
              onChangeText={setProdCode}
            />

            <Text style={styles.fieldLabel}>Kategoriya</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true} 
              style={{ marginBottom: 20 }}
              contentContainerStyle={{ paddingRight: 30, paddingBottom: 5 }}
            >
              {['Ichimliklar', 'Taomlar', 'Snaklar', 'Muzqaymoq', 'Desertlar', 'Boshqa'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, prodCategory === cat && styles.catChipActive, { marginRight: 8 }]}
                  onPress={() => setProdCategory(cat)}
                >
                  <Text style={[styles.catChipText, prodCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetProdForm}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!prodName || !prodPrice || !prodStock) && styles.saveBtnDisabled]}
                onPress={handleSaveProduct}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Mahsulot nomi</Text>
        <Text style={[styles.th, { flex: 1 }]}>Kategoriya</Text>
        <Text style={[styles.th, { flex: 1 }]}>Shtrix kod</Text>
        <Text style={[styles.th, { flex: 1 }]}>Narxi</Text>
        <Text style={[styles.th, { flex: 0.8, textAlign: 'center' }]}>Qoldiq</Text>
        <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Amallar</Text>
      </View>
      {inventory.map(p => (
        <View key={p.id} style={styles.tr}>
          <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <Image source={{ uri: p.image }} style={styles.tableImage} />
            <Text style={styles.tdTextBold}>{p.name}</Text>
          </View>
          <Text style={[styles.td, { flex: 1 }]}>{p.category}</Text>
          <Text style={[styles.td, { flex: 1, color: '#666' }]}>{p.code}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{p.price.toLocaleString()} so'm</Text>
          <Text style={[styles.td, { flex: 0.8, textAlign: 'center', fontWeight: 'bold', color: p.stock < 10 ? '#E31E24' : '#28A745' }]}>
            {p.stock} ta
          </Text>
          <View style={[styles.td, { flex: 0.8, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }]}>
            <TouchableOpacity onPress={() => handleEditProdClick(p)}>
              <Ionicons name="pencil-outline" size={18} color="#007BFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteProd(p.id)}>
              <Ionicons name="trash-outline" size={18} color="#E31E24" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderExpenses = () => (
    <View style={styles.card}>
       <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Xarajatlar ro'yxati</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAddExpModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Xarajat qo'shish</Text>
        </TouchableOpacity>
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpModal}
        transparent
        animationType="fade"
        onRequestClose={resetExpForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingExpId ? 'Xarajatni Tahrirlash' : 'Yangi Xarajat Qo\'shish'}</Text>
              <TouchableOpacity onPress={resetExpForm}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Xarajat izohi *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masalan: Ijara haqi"
              value={expTitle}
              onChangeText={setExpTitle}
            />

            <Text style={styles.fieldLabel}>Summa (so'm) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2500000"
              value={expAmount}
              onChangeText={setExpAmount}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Kategoriya</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true} 
              style={{ marginBottom: 20 }}
              contentContainerStyle={{ paddingRight: 30, paddingBottom: 5 }}
            >
              {['Ijara', 'Kommunal', 'Oziq-ovqat', 'Transport', 'Xizmatlar', 'Boshqa'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, expCategory === cat && styles.catChipActive, { marginRight: 8 }]}
                  onPress={() => setExpCategory(cat)}
                >
                  <Text style={[styles.catChipText, expCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetExpForm}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!expTitle || !expAmount) && styles.saveBtnDisabled]}
                onPress={handleSaveExpense}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Izoh</Text>
        <Text style={[styles.th, { flex: 1 }]}>Kategoriya</Text>
        <Text style={[styles.th, { flex: 1 }]}>Sana</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Summa</Text>
        <Text style={[styles.th, { flex: 0.6, textAlign: 'right' }]}>Amallar</Text>
      </View>
      {expenses.map(exp => (
        <View key={exp.id || Math.random().toString()} style={styles.tr}>
          <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{exp.title || 'Izohsiz'}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{exp.category || 'Boshqa'}</Text>
          <Text style={[styles.td, { flex: 1, color: '#666' }]}>{exp.date || '-'}</Text>
          <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#E31E24' }]}>
            {(exp.amount || 0).toLocaleString()} so'm
          </Text>
          <View style={[styles.td, { flex: 0.6, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }]}>
            <TouchableOpacity onPress={() => handleEditExpClick(exp)}>
              <Ionicons name="pencil-outline" size={18} color="#007BFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteExp(exp.id)}>
              <Ionicons name="trash-outline" size={18} color="#E31E24" />
            </TouchableOpacity>
          </View>
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
          <Text style={styles.analyticsStatLabel}>Ombor qoldig'i</Text>
          <Text style={styles.analyticsStatValue}>
            {inventory.reduce((sum, p) => sum + p.stock, 0).toLocaleString()} ta
          </Text>
          <View style={styles.analyticsTrend}>
            <Ionicons name="cube-outline" size={14} color="#666" />
            <Text style={styles.analyticsTrendText}>Jami mahsulotlar soni</Text>
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

      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 1 }]}>ID</Text>
        <Text style={[styles.th, { flex: 1.5 }]}>Mijoz</Text>
        <Text style={[styles.th, { flex: 1 }]}>Vaqt</Text>
        <Text style={[styles.th, { flex: 1 }]}>To'lov</Text>
        <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Summa</Text>
      </View>
      {transactions.map((t, i) => (
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
    </View>
  );

  const renderDebtors = () => {
    const overdueCount = debtors.filter(d => getDebtorDaysLeft(d.date) < 0).length;
    const approachingCount = debtors.filter(d => {
      const days = getDebtorDaysLeft(d.date);
      return days >= 0 && days <= 7;
    }).length;
    const farCount = debtors.filter(d => getDebtorDaysLeft(d.date) > 7).length;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Qarzdorlar</Text>
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

        {/* Pay Debt Modal */}
        <Modal
          visible={showPayDebtModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPayDebtModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Qarzni To'lash</Text>
                <TouchableOpacity onPress={() => setShowPayDebtModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {selectedDebtorForPay && (
                <>
                  <View style={styles.payDebtInfoBox}>
                    <View style={styles.payDebtInfoRow}>
                      <Ionicons name="person-outline" size={18} color="#666" />
                      <Text style={styles.payDebtInfoLabel}>Qarzdor:</Text>
                      <Text style={styles.payDebtInfoValue}>{selectedDebtorForPay.name}</Text>
                    </View>
                    <View style={styles.payDebtInfoRow}>
                      <Ionicons name="wallet-outline" size={18} color="#E31E24" />
                      <Text style={styles.payDebtInfoLabel}>Umumiy qarz:</Text>
                      <Text style={[styles.payDebtInfoValue, { color: '#E31E24', fontWeight: 'bold' }]}>
                        {selectedDebtorForPay.amount.toLocaleString()} so'm
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>To'lanadigan summa *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="cash-outline" size={20} color="#28A745" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.modalInputNoMargin}
                      placeholder="0"
                      value={payAmount}
                      onChangeText={setPayAmount}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Text style={{ color: '#999', fontSize: 14 }}>so'm</Text>
                  </View>

                  {(() => {
                    const paid = parseInt(payAmount.replace(/\D/g, ''), 10) || 0;
                    const remaining = selectedDebtorForPay.amount - paid;
                    if (paid > 0 && paid < selectedDebtorForPay.amount) {
                      return (
                        <View style={styles.payDebtRemaining}>
                          <Ionicons name="information-circle-outline" size={16} color="#FB8C00" />
                          <Text style={styles.payDebtRemainingText}>
                            Qolgan qarz: {remaining.toLocaleString()} so'm
                          </Text>
                        </View>
                      );
                    }
                    if (paid >= selectedDebtorForPay.amount && paid > 0) {
                      return (
                        <View style={[styles.payDebtRemaining, { backgroundColor: '#F1F8E9', borderColor: '#C8E6C9' }]}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#28A745" />
                          <Text style={[styles.payDebtRemainingText, { color: '#28A745' }]}>
                            Qarz to'liq to'lanadi!
                          </Text>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  <View style={[styles.modalActions, { marginTop: 24 }]}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPayDebtModal(false)}>
                      <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: '#28A745' }, (!payAmount || parseInt(payAmount.replace(/\D/g, ''), 10) <= 0) && styles.saveBtnDisabled]}
                      onPress={handlePartialPayDebt}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.saveBtnText}>Tasdiqlash</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

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

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2.5 }]}>FIO</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Telefon</Text>
          <Text style={[styles.th, { flex: 2 }]}>Qarz Summasi</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: 'center' }]}>Muddati</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Amal</Text>
        </View>
        {filteredDebtors.map(debtor => {
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
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>{debtor.name.charAt(0)}</Text>
                </View>
                <Text style={{ fontWeight: '600', color: '#333' }}>{debtor.name}</Text>
              </View>
              <Text style={[styles.td, { flex: 1.5, color: '#666' }]}>{debtor.phone}</Text>
              <Text style={[styles.td, { flex: 2, fontWeight: 'bold', color: '#E31E24' }]}>
                {debtor.amount.toLocaleString()} so'm
              </Text>
              <View style={[styles.td, { flex: 1.5, flexDirection: 'row', justifyContent: 'center' }]}>
                 <View style={[styles.badge, isOver ? {backgroundColor: '#FFEBEE'} : styles.badgeWarning]}>
                    <Text style={[styles.badgeText, isOver ? {color: '#C62828'} : styles.badgeWarningText]}>
                      {debtor.date}
                    </Text>
                 </View>
              </View>
              <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }]}>
                <TouchableOpacity
                  style={styles.payDebtBtn}
                  onPress={() => openPayDebtModal(debtor)}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                  <Text style={styles.payDebtBtnText}>To'lash</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Hisobotlar': return renderOverview();
      case 'Sales': return renderSales();
      case 'Staff': return renderStaff();
      case 'Inventory': return renderInventory();
      case 'Expenses': return renderExpenses();
      case 'Qarzdorlar': return renderDebtors();
      case 'Settings':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tizim sozlamalari</Text>
            <View style={styles.settingItem}>
               <Text style={styles.settingLabel}>Profil rasmi</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                 <Image source={{ uri: adminAvatar }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                 <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#F0F0F0' }]} onPress={handlePickAvatar}>
                   <Ionicons name="camera-outline" size={20} color="#333" />
                   <Text style={[styles.primaryBtnText, { color: '#333' }]}>Rasm yuklash</Text>
                 </TouchableOpacity>
               </View>
            </View>
            <View style={styles.settingItem}>
               <View>
                 <Text style={styles.settingLabel}>Admin ismi</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                   <TextInput 
                     style={[styles.settingInput, { flex: 1, marginBottom: 0, backgroundColor: isEditingProfile ? '#fff' : '#F8F9FA' }]} 
                     value={adminName} 
                     editable={isEditingProfile}
                     onChangeText={(val) => {
                       setAdminName(val);
                       if (Platform.OS === 'web') localStorage.setItem('adminName', val);
                     }}
                   />
                   <TouchableOpacity 
                     style={{ padding: 12, backgroundColor: isEditingProfile ? '#E8F5E9' : '#F0F0F0', borderRadius: 8 }}
                     onPress={() => setIsEditingProfile(!isEditingProfile)}
                   >
                     <Ionicons name={isEditingProfile ? "checkmark" : "pencil-outline"} size={20} color={isEditingProfile ? "#28A745" : "#333"} />
                   </TouchableOpacity>
                 </View>
               </View>
            </View>
            <View style={styles.settingItem}>
               <View>
                 <Text style={styles.settingLabel}>Do'kon nomi</Text>
                 <TextInput 
                   style={styles.settingInput} 
                   defaultValue={Platform.OS === 'web' ? localStorage.getItem('shopName') || 'Oson Kassa POS' : 'Oson Kassa POS'} 
                   onChangeText={(val) => {
                     if (Platform.OS === 'web') localStorage.setItem('shopName', val);
                   }}
                 />
               </View>
            </View>
            <View style={styles.settingItem}>
               <View>
                 <Text style={styles.settingLabel}>Admin paroli</Text>
                 <TextInput 
                   style={styles.settingInput} 
                   defaultValue={Platform.OS === 'web' ? localStorage.getItem('adminPassword') || '' : ''} 
                   onChangeText={(val) => {
                     if (Platform.OS === 'web') localStorage.setItem('adminPassword', val);
                   }}
                   secureTextEntry
                 />
               </View>
            </View>
            <TouchableOpacity 
              style={styles.saveSettingsBtn} 
              onPress={() => {
                setSuccessMessage('Barcha sozlamalar muvaffaqiyatli saqlandi!');
                setShowSuccessModal(true);
              }}
            >
               <Text style={styles.saveSettingsText}>Saqlash</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveSettingsBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E31E24', marginTop: 16 }]} 
              onPress={() => {
                if (Platform.OS === 'web') {
                  localStorage.removeItem('isRegistered');
                }
                router.replace('/register');
              }}
            >
               <Text style={[styles.saveSettingsText, { color: '#E31E24' }]}>Tizimdan chiqish</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveSettingsBtn, { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#E31E24', marginTop: 16 }]} 
              onPress={() => {
                if (Platform.OS === 'web') {
                  localStorage.clear();
                }
                router.replace('/register');
              }}
            >
               <Text style={[styles.saveSettingsText, { color: '#E31E24' }]}>Profilni o'chirish</Text>
            </TouchableOpacity>
          </View>
        );
      default: return renderOverview();
    }
  };

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { alignItems: 'center', paddingVertical: 40 }]}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={48} color="#28A745" />
          </View>
          <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 10 }]}>Muvaffaqiyatli!</Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 }}>
            {successMessage}
          </Text>
          <TouchableOpacity 
            style={[styles.saveBtn, { width: '80%', flex: 0 }]} 
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.saveBtnText}>Tushunarli</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          active={activeTab === 'Hisobotlar'} 
          onPress={() => setActiveTab('Hisobotlar')} 
        />
        <SidebarItem 
          icon="cart-outline" 
          label="Savdolar" 
          active={activeTab === 'Sales'} 
          onPress={() => router.push('/admin/sales')} 
        />
        <SidebarItem 
          icon="people-outline" 
          label="Xodimlar" 
          active={activeTab === 'Staff'} 
          onPress={() => setActiveTab('Staff')} 
        />
        <SidebarItem 
          icon="book-outline" 
          label="Qarzdorlar" 
          active={activeTab === 'Qarzdorlar'} 
          onPress={() => setActiveTab('Qarzdorlar')} 
        />
        <SidebarItem 
          icon="cube-outline" 
          label="Ombor qoldig'i" 
          active={activeTab === 'Inventory'} 
          onPress={() => setActiveTab('Inventory')} 
        />
        <View style={styles.navDivider} />

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

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="arrow-back-outline" size={24} color="#333" />
          <Text style={styles.backText}>Qaytish</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }}>
          <Ionicons name="log-out-outline" size={24} color="#E31E24" />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>
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
              {activeTab === 'Hisobotlar' ? 'Hisobotlar va Statistika' : 
               activeTab === 'Sales' ? 'Savdo tarixi' :
               activeTab === 'Staff' ? 'Xodimlar' :
               activeTab === 'Inventory' ? 'Ombor' :
               activeTab === 'Qarzdorlar' ? 'Qarzdorlar' :
               activeTab === 'Expenses' ? 'Xarajatlar' : 'Sozlamalar'}
            </Text>
            <Text style={styles.subGreeting}>Xush kelibsiz! Tizim holati bilan tanishing</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#999" />
              <TextInput placeholder="Qidirish..." style={styles.searchInput} />
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
        {renderSuccessModal()}
      </View>
      {Platform.OS === 'web' && (
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' } as any}
        />
      )}
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

function QuickAction({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
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
  sidebarFooter: {
    marginTop: 'auto',
    gap: 16,
    paddingBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  backText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 16,
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
  },
  statIconWrapperRed: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
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
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  actionBtnText: {
    color: '#E31E24',
    fontWeight: 'bold',
    fontSize: 13,
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
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
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
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: Platform.OS === 'web' ? 450 : '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#eee',
  },
  catChipActive: {
    backgroundColor: '#E31E24',
    borderColor: '#E31E24',
  },
  catChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#E31E24',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#FFEBEE',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerActionsSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31E24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  primaryBtnTextSmall: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
