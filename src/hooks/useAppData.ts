import { useState, useEffect } from 'react';
import { AppData, Customer, SalesProfile, Expense, SalesCampaign, AppUser } from '../types';
import { INITIAL_DATA } from '../data/initialData';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';

const STORAGE_KEY = 'car_page_app_data_v6';
const AUTH_KEY = 'car_page_auth_user_v1';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        return INITIAL_DATA;
      }
      const parsed = JSON.parse(stored) as AppData;
      if (!parsed.salesCampaigns) parsed.salesCampaigns = [];
      if (!parsed.expenses) parsed.expenses = [];
      if (!parsed.customers) parsed.customers = [];
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = INITIAL_DATA.users || [];
      }
      if (!parsed.statuses || !parsed.statuses.includes('ได้คุย')) {
        parsed.statuses = ['PS', 'BK', 'RS', 'CC', 'ได้คุย'];
      }
      return parsed;
    } catch {
      return INITIAL_DATA;
    }
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading auth state:', e);
    }
    return null;
  });

  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  // Sync to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [data]);

  // Firestore Real-time Listeners and Auto-Seed
  useEffect(() => {
    let unsubCustomers: (() => void) | undefined;
    let unsubSales: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubCampaigns: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    const initFirestore = async () => {
      try {
        // Check if database needs initial seeding
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        if (customersSnapshot.empty) {
          // Seed initial data to Firestore
          const batch = writeBatch(db);

          INITIAL_DATA.customers.forEach((c) => {
            const ref = doc(db, 'customers', String(c.id));
            batch.set(ref, c);
          });

          INITIAL_DATA.salesProfiles.forEach((sp) => {
            const ref = doc(db, 'salesProfiles', String(sp.id));
            batch.set(ref, sp);
          });

          INITIAL_DATA.expenses.forEach((e) => {
            const ref = doc(db, 'expenses', String(e.id));
            batch.set(ref, e);
          });

          INITIAL_DATA.salesCampaigns.forEach((sc) => {
            const ref = doc(db, 'salesCampaigns', String(sc.id));
            batch.set(ref, sc);
          });

          const settingsRef = doc(db, 'settings', 'config');
          batch.set(settingsRef, {
            salesAgents: INITIAL_DATA.salesAgents,
            categories: INITIAL_DATA.categories,
            categoryColors: INITIAL_DATA.categoryColors,
            statuses: INITIAL_DATA.statuses,
          });

          (INITIAL_DATA.users || []).forEach((u) => {
            const uRef = doc(db, 'users', u.id);
            batch.set(uRef, u);
          });

          await batch.commit();
        } else {
          // Ensure main superadmin salacms user exists in Firestore
          const usersSnapshot = await getDocs(collection(db, 'users'));
          if (usersSnapshot.empty) {
            const batch = writeBatch(db);
            (INITIAL_DATA.users || []).forEach((u) => {
              const uRef = doc(db, 'users', u.id);
              batch.set(uRef, u);
            });
            await batch.commit();
          }
        }

        setFirebaseConnected(true);
        setSyncStatus('connected');

        // 1. Listen to customers
        unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
          if (!snapshot.empty) {
            const list: Customer[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as Customer);
            });
            list.sort((a, b) => Number(b.id) - Number(a.id));
            setData((prev) => ({ ...prev, customers: list }));
          }
        });

        // 2. Listen to sales profiles
        unsubSales = onSnapshot(collection(db, 'salesProfiles'), (snapshot) => {
          if (!snapshot.empty) {
            const list: SalesProfile[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as SalesProfile);
            });
            list.sort((a, b) => Number(a.id) - Number(b.id));
            setData((prev) => ({ ...prev, salesProfiles: list }));
          }
        });

        // 3. Listen to expenses
        unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
          if (!snapshot.empty) {
            const list: Expense[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as Expense);
            });
            list.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
            setData((prev) => ({ ...prev, expenses: list }));
          }
        });

        // 4. Listen to sales campaigns
        unsubCampaigns = onSnapshot(collection(db, 'salesCampaigns'), (snapshot) => {
          if (!snapshot.empty) {
            const list: SalesCampaign[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as SalesCampaign);
            });
            list.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
            setData((prev) => ({ ...prev, salesCampaigns: list }));
          }
        });

        // 5. Listen to settings
        unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
          if (docSnap.exists()) {
            const sData = docSnap.data();
            setData((prev) => ({
              ...prev,
              salesAgents: sData.salesAgents || prev.salesAgents,
              categories: sData.categories || prev.categories,
              categoryColors: sData.categoryColors || prev.categoryColors,
              statuses: sData.statuses || prev.statuses,
            }));
          }
        });

        // 6. Listen to users
        unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          if (!snapshot.empty) {
            const list: AppUser[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as AppUser);
            });
            setData((prev) => ({ ...prev, users: list }));
          }
        });
      } catch (err) {
        console.warn('Firebase Firestore live sync fallback to local:', err);
        setSyncStatus('offline');
      }
    };

    initFirestore();

    return () => {
      if (unsubCustomers) unsubCustomers();
      if (unsubSales) unsubSales();
      if (unsubExpenses) unsubExpenses();
      if (unsubCampaigns) unsubCampaigns();
      if (unsubSettings) unsubSettings();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Authentication: Login & Logout
  const login = (usernameInput: string, passwordInput: string): { success: boolean; message?: string; user?: AppUser } => {
    const trimmedUser = usernameInput.trim().toLowerCase();

    // Check main superadmin account
    if (trimmedUser === 'salacms' && passwordInput === 'salacms') {
      const superUser: AppUser = {
        id: 'user-salacms',
        username: 'salacms',
        displayName: 'ผู้ดูแลระบบหลัก (salacms)',
        role: 'superadmin',
        createdAt: '2026-09-01 09:00:00',
      };
      setCurrentUser(superUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(superUser));
      return { success: true, user: superUser };
    }

    // Check in users list (synced from Firestore)
    const userList = data.users || INITIAL_DATA.users || [];
    const found = userList.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === passwordInput
    );

    if (found) {
      const authUser: AppUser = {
        id: found.id,
        username: found.username,
        displayName: found.displayName || found.username,
        role: found.role,
        salesNickname: found.salesNickname,
        createdAt: found.createdAt,
      };
      setCurrentUser(authUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      return { success: true, user: authUser };
    }

    return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const saveUser = async (user: AppUser) => {
    const id = user.id || `user-${Date.now()}`;
    const finalUser: AppUser = { ...user, id };

    setData((prev) => {
      const list = [...(prev.users || [])];
      const idx = list.findIndex((u) => u.id === id);
      if (idx !== -1) {
        list[idx] = finalUser;
      } else {
        list.push(finalUser);
      }
      return { ...prev, users: list };
    });

    try {
      await setDoc(doc(db, 'users', id), finalUser);
    } catch (e) {
      console.warn('Firestore saveUser error:', e);
    }
  };

  const deleteUser = async (id: string) => {
    if (id === 'user-salacms') {
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (salacms) ได้');
      return;
    }

    setData((prev) => ({
      ...prev,
      users: (prev.users || []).filter((u) => u.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      console.warn('Firestore deleteUser error:', e);
    }
  };

  // Helper to persist settings to Firestore
  const persistSettings = async (
    salesAgents: string[],
    categories: Record<string, string[]>,
    categoryColors: Record<string, string>,
    statuses: string[]
  ) => {
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        salesAgents,
        categories,
        categoryColors,
        statuses,
      });
    } catch (e) {
      console.warn('Firestore write settings error:', e);
    }
  };

  // Customer Actions
  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'entryDateTime' | 'statusHistory'>
  ) => {
    const nowStr = getCurrentFormattedDateTime();
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now(),
      entryDateTime: nowStr,
      statusHistory: [{ status: customerData.status, date: nowStr }],
    };

    setData((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));

    try {
      await setDoc(doc(db, 'customers', String(newCustomer.id)), newCustomer);
    } catch (e) {
      console.warn('Firestore addCustomer error:', e);
    }
  };

  const updateCustomer = async (updated: Customer) => {
    const nowStr = getCurrentFormattedDateTime();
    const oldCust = data.customers.find((c) => c.id === updated.id);
    let statusHistory = [
      ...(oldCust?.statusHistory || [{ status: updated.status, date: updated.entryDateTime || nowStr }]),
    ];
    if (oldCust && oldCust.status !== updated.status) {
      statusHistory.push({ status: updated.status, date: nowStr });
    }
    const finalCustomer = { ...updated, statusHistory };

    setData((prev) => {
      const index = prev.customers.findIndex((c) => c.id === updated.id);
      if (index === -1) return prev;
      const updatedList = [...prev.customers];
      updatedList[index] = finalCustomer;
      return { ...prev, customers: updatedList };
    });

    try {
      await setDoc(doc(db, 'customers', String(updated.id)), finalCustomer);
    } catch (e) {
      console.warn('Firestore updateCustomer error:', e);
    }
  };

  const deleteCustomer = async (id: number) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'customers', String(id)));
    } catch (e) {
      console.warn('Firestore deleteCustomer error:', e);
    }
  };

  // Sales Profiles Actions
  const saveSalesProfile = async (profile: Omit<SalesProfile, 'id'> & { id?: number }) => {
    const nickname = profile.nickname.trim();
    let updatedProfiles = [...data.salesProfiles];
    let updatedAgents = [...data.salesAgents];

    if (!updatedAgents.includes(nickname)) {
      updatedAgents.push(nickname);
    }

    let targetProfile: SalesProfile;

    if (profile.id) {
      const idx = updatedProfiles.findIndex((p) => p.id === profile.id);
      const oldNick = idx !== -1 ? updatedProfiles[idx].nickname : '';
      targetProfile = {
        ...profile,
        id: profile.id,
      };
      if (idx !== -1) {
        updatedProfiles[idx] = targetProfile;
      }
      if (oldNick && oldNick !== nickname) {
        updatedAgents = updatedAgents.map((a) => (a === oldNick ? nickname : a));
      }
    } else {
      targetProfile = {
        ...profile,
        id: Date.now(),
        hidden: false,
      };
      updatedProfiles.push(targetProfile);
    }

    const finalAgents = Array.from(new Set(updatedAgents));

    setData((prev) => ({
      ...prev,
      salesProfiles: updatedProfiles,
      salesAgents: finalAgents,
    }));

    try {
      await setDoc(doc(db, 'salesProfiles', String(targetProfile.id)), targetProfile);
      await persistSettings(finalAgents, data.categories, data.categoryColors, data.statuses);
    } catch (e) {
      console.warn('Firestore saveSalesProfile error:', e);
    }
  };

  const toggleSalesVisibility = async (id: number) => {
    const target = data.salesProfiles.find((sp) => sp.id === id);
    if (!target) return;
    const updated = { ...target, hidden: !target.hidden };

    setData((prev) => ({
      ...prev,
      salesProfiles: prev.salesProfiles.map((sp) => (sp.id === id ? updated : sp)),
    }));

    try {
      await setDoc(doc(db, 'salesProfiles', String(id)), updated);
    } catch (e) {
      console.warn('Firestore toggleSalesVisibility error:', e);
    }
  };

  const deleteSalesProfile = async (id: number) => {
    const target = data.salesProfiles.find((p) => p.id === id);
    if (!target) return;

    const remainingAgents = data.salesAgents.filter((a) => a !== target.nickname);

    setData((prev) => ({
      ...prev,
      salesProfiles: prev.salesProfiles.filter((p) => p.id !== id),
      salesAgents: remainingAgents,
    }));

    try {
      await deleteDoc(doc(db, 'salesProfiles', String(id)));
      await persistSettings(remainingAgents, data.categories, data.categoryColors, data.statuses);
    } catch (e) {
      console.warn('Firestore deleteSalesProfile error:', e);
    }
  };

  // Sales Campaigns Actions
  const saveSalesCampaign = async (campaign: Omit<SalesCampaign, 'id'> & { id?: number }) => {
    const id = campaign.id || Date.now();
    const finalCampaign: SalesCampaign = { ...campaign, id };

    setData((prev) => {
      let updated = [...(prev.salesCampaigns || [])];
      if (campaign.id) {
        const idx = updated.findIndex((sc) => sc.id === campaign.id);
        if (idx !== -1) updated[idx] = finalCampaign;
      } else {
        updated.push(finalCampaign);
      }
      return { ...prev, salesCampaigns: updated };
    });

    try {
      await setDoc(doc(db, 'salesCampaigns', String(id)), finalCampaign);
    } catch (e) {
      console.warn('Firestore saveSalesCampaign error:', e);
    }
  };

  const deleteSalesCampaign = async (id: number) => {
    setData((prev) => ({
      ...prev,
      salesCampaigns: (prev.salesCampaigns || []).filter((sc) => sc.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'salesCampaigns', String(id)));
    } catch (e) {
      console.warn('Firestore deleteSalesCampaign error:', e);
    }
  };

  // Expense Actions
  const saveExpense = async (expense: Omit<Expense, 'id'> & { id?: number }) => {
    const id = expense.id || Date.now();
    const finalExpense: Expense = { ...expense, id };

    setData((prev) => {
      let updated = [...(prev.expenses || [])];
      if (expense.id) {
        const idx = updated.findIndex((e) => e.id === expense.id);
        if (idx !== -1) updated[idx] = finalExpense;
      } else {
        updated.push(finalExpense);
      }
      return { ...prev, expenses: updated };
    });

    try {
      await setDoc(doc(db, 'expenses', String(id)), finalExpense);
    } catch (e) {
      console.warn('Firestore saveExpense error:', e);
    }
  };

  const deleteExpense = async (id: number) => {
    setData((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).filter((e) => e.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'expenses', String(id)));
    } catch (e) {
      console.warn('Firestore deleteExpense error:', e);
    }
  };

  // Categories & Sub-Categories
  const addCategory = (name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (data.categories[trimmed]) return false;

    const newCategories = { ...data.categories, [trimmed]: [] };
    const newColors = { ...data.categoryColors, [trimmed]: color || '#ef4444' };

    setData((prev) => ({
      ...prev,
      categories: newCategories,
      categoryColors: newColors,
    }));

    persistSettings(data.salesAgents, newCategories, newColors, data.statuses);
    return true;
  };

  const deleteCategory = (name: string) => {
    const newCats = { ...data.categories };
    delete newCats[name];
    const newColors = { ...data.categoryColors };
    delete newColors[name];

    setData((prev) => ({
      ...prev,
      categories: newCats,
      categoryColors: newColors,
    }));

    persistSettings(data.salesAgents, newCats, newColors, data.statuses);
  };

  const addSubCategory = (categoryName: string, subName: string) => {
    const trimmed = subName.trim();
    if (!trimmed || !data.categories[categoryName]) return false;
    if (data.categories[categoryName].includes(trimmed)) return false;

    const newCategories = {
      ...data.categories,
      [categoryName]: [...data.categories[categoryName], trimmed],
    };

    setData((prev) => ({
      ...prev,
      categories: newCategories,
    }));

    persistSettings(data.salesAgents, newCategories, data.categoryColors, data.statuses);
    return true;
  };

  const deleteSubCategory = (categoryName: string, index: number) => {
    const subs = [...(data.categories[categoryName] || [])];
    subs.splice(index, 1);
    const newCategories = {
      ...data.categories,
      [categoryName]: subs,
    };

    setData((prev) => ({
      ...prev,
      categories: newCategories,
    }));

    persistSettings(data.salesAgents, newCategories, data.categoryColors, data.statuses);
  };

  const resetToDefault = async () => {
    setData(INITIAL_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));

    try {
      const batch = writeBatch(db);

      INITIAL_DATA.customers.forEach((c) => {
        batch.set(doc(db, 'customers', String(c.id)), c);
      });
      INITIAL_DATA.salesProfiles.forEach((sp) => {
        batch.set(doc(db, 'salesProfiles', String(sp.id)), sp);
      });
      INITIAL_DATA.expenses.forEach((e) => {
        batch.set(doc(db, 'expenses', String(e.id)), e);
      });
      INITIAL_DATA.salesCampaigns.forEach((sc) => {
        batch.set(doc(db, 'salesCampaigns', String(sc.id)), sc);
      });
      batch.set(doc(db, 'settings', 'config'), {
        salesAgents: INITIAL_DATA.salesAgents,
        categories: INITIAL_DATA.categories,
        categoryColors: INITIAL_DATA.categoryColors,
        statuses: INITIAL_DATA.statuses,
      });
      (INITIAL_DATA.users || []).forEach((u) => {
        batch.set(doc(db, 'users', u.id), u);
      });

      await batch.commit();
    } catch (e) {
      console.warn('Firestore reset error:', e);
    }
  };

  // Dynamic available years
  const getAvailableYears = (): string[] => {
    const yearsSet = new Set<string>();
    (data.customers || []).forEach((c) => {
      if (c.contactDate && c.contactDate.length >= 4) {
        yearsSet.add(c.contactDate.substring(0, 4));
      }
    });
    (data.expenses || []).forEach((e) => {
      if (e.month && e.month.length >= 4) {
        yearsSet.add(e.month.substring(0, 4));
      }
    });
    (data.salesCampaigns || []).forEach((sc) => {
      if (sc.month && sc.month.length >= 4) {
        yearsSet.add(sc.month.substring(0, 4));
      }
    });
    if (yearsSet.size === 0) {
      yearsSet.add(String(new Date().getFullYear()));
    }
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  };

  return {
    data,
    currentUser,
    login,
    logout,
    saveUser,
    deleteUser,
    syncStatus,
    firebaseConnected,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    saveSalesProfile,
    toggleSalesVisibility,
    deleteSalesProfile,
    saveSalesCampaign,
    deleteSalesCampaign,
    saveExpense,
    deleteExpense,
    addCategory,
    deleteCategory,
    addSubCategory,
    deleteSubCategory,
    resetToDefault,
    getAvailableYears,
  };
}

// Utility functions
export function formatNum(val: number | string): string {
  const num = Number(val) || 0;
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateTime(dtStr: string): string {
  if (!dtStr) return '-';
  const parts = dtStr.split(' ');
  const dateParts = parts[0].split('-');
  if (dateParts.length < 3) return dtStr;

  const monthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const d = parseInt(dateParts[2], 10);
  const m = monthNames[parseInt(dateParts[1], 10) - 1] || dateParts[1];
  const y = parseInt(dateParts[0], 10);

  let timeStr = '';
  if (parts[1]) {
    const timeParts = parts[1].split(':');
    timeStr = ` ${timeParts[0]}:${timeParts[1]}`;
  }
  return `${d} ${m} ${y}${timeStr}`;
}

export function getCurrentFormattedDateTime(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'PS':
      return 'bg-sky-50 text-sky-700 border border-sky-300';
    case 'BK':
      return 'bg-amber-50 text-amber-700 border border-amber-300';
    case 'RS':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-300';
    case 'CC':
      return 'bg-rose-50 text-rose-700 border border-rose-300';
    case 'ได้คุย':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-300';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-300';
  }
}
