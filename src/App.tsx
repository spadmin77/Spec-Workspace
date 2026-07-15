import React, { useState, useMemo, useEffect } from 'react';
import { 
  Warehouse, 
  UserCheck, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  RefreshCw, 
  Layers, 
  FileSpreadsheet, 
  X, 
  Check, 
  ClipboardList, 
  Users, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  Lock,
  Pencil,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { WarehouseEntry, FixedAssetHeader, FixedAssetRow, FixedAssetRecord } from './types';
import { exportWarehouseToExcel, exportFixedAssetsToExcel, exportFixedAssetsByDepartment } from './utils/excelExport';
import { db, auth, loginWithPassword, logoutAdmin, onAuthStateChanged, getRole, AppRole } from './lib/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getIdToken, User } from 'firebase/auth';

// --- Prefilled Sample Data for Instant Interactive Experience ---
const INITIAL_WAREHOUSE_ENTRIES: WarehouseEntry[] = [];

const INITIAL_FIXED_ASSETS_RECORDS: FixedAssetRecord[] = [];

const CLAIMS_SERVER_URL =
  (import.meta as any).env?.VITE_CLAIMS_SERVER_URL || 'http://localhost:4000';

interface RegistererAccount {
  uid: string;
  email: string;
  role: 'registerer';
  createdAt?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'fixed_asset'>('warehouse');

  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<AppRole>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'admin' | 'registerer'>('admin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // --- REGISTERER MANAGEMENT (Admin-only) ---
  const [isRegManagerModalOpen, setIsRegManagerModalOpen] = useState(false);
  const [newRegEmail, setNewRegEmail] = useState('');
  const [newRegPassword, setNewRegPassword] = useState('');
  const [isCreatingReg, setIsCreatingReg] = useState(false);
  const [regManagerError, setRegManagerError] = useState('');
  const [regManagerSuccess, setRegManagerSuccess] = useState('');
  const [registerersList, setRegisterersList] = useState<RegistererAccount[]>([]);

  // --- WAREHOUSE STATE ---
  const [warehouseEntries, setWarehouseEntries] = useState<WarehouseEntry[]>(INITIAL_WAREHOUSE_ENTRIES);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseFilterOwner, setWarehouseFilterOwner] = useState('');
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);

  // Warehouse Form Temp State
  const [wAssetType, setWAssetType] = useState('');
  const [wQuantity, setWQuantity] = useState<number | ''>('');
  const [wOwner, setWOwner] = useState('');
  const [wWarehouseNo, setWWarehouseNo] = useState('');
  const [wManager, setWManager] = useState('');
  const [wDate, setWDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [wInspection, setWInspection] = useState('');
  const [wErrors, setWErrors] = useState<{ [key: string]: string }>({});

  // --- FIXED ASSET STATE ---
  const [fixedAssetRecords, setFixedAssetRecords] = useState<FixedAssetRecord[]>(INITIAL_FIXED_ASSETS_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null); // For viewing previously saved records
  
  // Active Record Form (being edited currently)
  const [empHeader, setEmpHeader] = useState<FixedAssetHeader>({
    employeeName: '',
    department: '',
    employeeNo: ''
  });
  const [empAssetRows, setEmpAssetRows] = useState<FixedAssetRow[]>([]);
  const [empCountedBy, setEmpCountedBy] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empDate, setEmpDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [isAssetRowModalOpen, setIsAssetRowModalOpen] = useState(false);
  const [editingAssetRowId, setEditingAssetRowId] = useState<string | null>(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [assetRowErrors, setAssetRowErrors] = useState<{ [key: string]: string }>({});
  const [collapsedDepts, setCollapsedDepts] = useState<{ [dept: string]: boolean }>({});

  // Temp State for a single Asset Row inside the modal
  const [rowDesc, setRowDesc] = useState('');
  const [rowTag, setRowTag] = useState('');
  const [rowArea, setRowArea] = useState('');
  const [rowBuilding, setRowBuilding] = useState('');
  const [rowFloor, setRowFloor] = useState('');
  const [rowSpecificLoc, setRowSpecificLoc] = useState('');
  const [rowUnit, setRowUnit] = useState('');
  const [rowCost, setRowCost] = useState<number | ''>('');
  const [rowSerial, setRowSerial] = useState('');
  const [rowReceived, setRowReceived] = useState<'Yes' | 'No'>('Yes');

  const canEdit = userRole === 'admin';
  const canAdd = userRole === 'admin' || userRole === 'registerer';
  const isStaff = canAdd;

  // --- AUTH LISTENERS & FIRESTORE REALTIME SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user ?? null);
      setUserRole(await getRole(user));
      setIsAuthenticating(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isStaff) {
      setWarehouseEntries([]);
      return;
    }
    const q = query(collection(db, 'warehouseEntries'), orderBy('sNo', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: WarehouseEntry[] = [];
      snapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() } as WarehouseEntry);
      });
      setWarehouseEntries(entries);
    }, (error) => {
      console.error("Error loading warehouse entries from Firestore:", error);
    });
    return () => unsubscribe();
  }, [isStaff]);

  useEffect(() => {
    if (!isStaff) {
      setFixedAssetRecords([]);
      return;
    }
    const q = query(collection(db, 'fixedAssetRecords'), orderBy('header.employeeName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: FixedAssetRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as FixedAssetRecord);
      });
      setFixedAssetRecords(records);
    }, (error) => {
      console.error("Error loading fixed asset records from Firestore:", error);
    });
    return () => unsubscribe();
  }, [isStaff]);

  // --- DEPARTMENTS AUTO-SUGGEST LISTS ---
  const existingWarehouseOwners = useMemo(() => {
    const owners = warehouseEntries.map(e => e.owner.trim()).filter(Boolean);
    return Array.from(new Set(owners));
  }, [warehouseEntries]);

  const existingFixedAssetDepts = useMemo(() => {
    const depts = fixedAssetRecords.map(r => r.header.department.trim()).filter(Boolean);
    if (empHeader.department.trim()) {
      depts.push(empHeader.department.trim());
    }
    return Array.from(new Set(depts));
  }, [fixedAssetRecords, empHeader.department]);

  const recordsByDept = useMemo(() => {
    const groups: { [dept: string]: FixedAssetRecord[] } = {};
    fixedAssetRecords.forEach((record) => {
      const dept = record.header.department.trim() || 'Other / ያልተገለጸ';
      if (!groups[dept]) {
        groups[dept] = [];
      }
      groups[dept].push(record);
    });
    return groups;
  }, [fixedAssetRecords]);

  // --- COLOR GENERATOR FOR DEPARTMENTS ---
  // Returns unique styling classes for a department to group them visually.
  const getDeptStyles = (dept: string) => {
    const d = (dept || '').trim().toLowerCase();
    if (d.includes('it') || d.includes('tech') || d.includes('ማህደር')) {
      return {
        bg: 'bg-blue-50/70 hover:bg-blue-50',
        text: 'text-blue-800',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        border: 'border-blue-100'
      };
    }
    if (d.includes('human') || d.includes('hr') || d.includes('ሰው')) {
      return {
        bg: 'bg-purple-50/70 hover:bg-purple-50',
        text: 'text-purple-800',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        border: 'border-purple-100'
      };
    }
    if (d.includes('finance') || d.includes('accounting') || d.includes('ገንዘብ')) {
      return {
        bg: 'bg-amber-50/70 hover:bg-amber-50',
        text: 'text-amber-800',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        border: 'border-amber-100'
      };
    }
    if (d.includes('engineer') || d.includes('dev') || d.includes('ልማት')) {
      return {
        bg: 'bg-emerald-50/70 hover:bg-emerald-50',
        text: 'text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        border: 'border-emerald-100'
      };
    }
    if (d.includes('market') || d.includes('sales') || d.includes('ሽያጭ')) {
      return {
        bg: 'bg-pink-50/70 hover:bg-pink-50',
        text: 'text-pink-800',
        badge: 'bg-pink-100 text-pink-800 border-pink-200',
        border: 'border-pink-100'
      };
    }
    if (d.includes('admin') || d.includes('operation') || d.includes('አስተዳደር')) {
      return {
        bg: 'bg-sky-50/70 hover:bg-sky-50',
        text: 'text-sky-800',
        badge: 'bg-sky-100 text-sky-800 border-sky-200',
        border: 'border-sky-100'
      };
    }
    // Hash-based color for dynamic custom inputs
    const colors = [
      { bg: 'bg-slate-50 hover:bg-slate-100/70', text: 'text-slate-800', badge: 'bg-slate-100 text-slate-800 border-slate-200', border: 'border-slate-100' },
      { bg: 'bg-indigo-50/70 hover:bg-indigo-50', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', border: 'border-indigo-100' },
      { bg: 'bg-rose-50/70 hover:bg-rose-50', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800 border-rose-200', border: 'border-rose-100' },
      { bg: 'bg-teal-50/70 hover:bg-teal-50', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-800 border-teal-200', border: 'border-teal-100' }
    ];
    let sum = 0;
    for (let i = 0; i < d.length; i++) sum += d.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // --- LOGIN HANDLER ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    setIsSubmittingLogin(true);
    try {
      await loginWithPassword(loginEmail.trim(), loginPassword);
      setLoginSuccess(
        loginMode === 'admin'
          ? 'Logged in as Admin. / እንደ አስተዳዳሪ ገብተዋል!'
          : 'Logged in as Registerer. / እንደ መዝጋቢ ገብተዋል!'
      );
      setTimeout(() => {
        setIsLoginModalOpen(false);
        setLoginSuccess('');
        setLoginPassword('');
      }, 800);
    } catch (err: any) {
      const code = err?.code || '';
      const message =
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
          ? 'Incorrect email or password. / የተሳሳተ ኢሜይል ወይም የይለፍ ቃል።'
          : code === 'auth/too-many-requests'
          ? 'Too many attempts. Try again later. / በጣም ብዙ ሙከራዎች። እባክዎ ይቆዩ።'
          : err?.message || 'Login failed.';
      setLoginError(message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Helper: require a given role, otherwise open the login modal.
  const requireRole = (role: AppRole): boolean => {
    if (userRole === role) return true;
    setLoginMode(role === 'admin' ? 'admin' : 'registerer');
    setLoginError(
      role === 'admin'
        ? 'Admin login required. / እባክዎ እንደ አስተዳዳሪ ይግቡ።'
        : 'Registerer login required. / እባክዎ እንደ መዝጋቢ ይግቡ።'
    );
    setIsLoginModalOpen(true);
    return false;
  };

  // --- REGISTERER MANAGEMENT (Admin-only) ---
  const apiCall = async (path: string, options?: RequestInit) => {
    const token = currentUser ? await getIdToken(currentUser) : '';
    const res = await fetch(`${CLAIMS_SERVER_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    return data;
  };

  const handleFetchRegisterers = async () => {
    try {
      const data = await apiCall('/api/registerers');
      setRegisterersList(data.registerers || []);
    } catch (err: any) {
      console.error('Failed to fetch registerers:', err);
    }
  };

  const handleCreateRegisterer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegManagerError('');
    setRegManagerSuccess('');
    setIsCreatingReg(true);
    try {
      await apiCall('/api/registerers', {
        method: 'POST',
        body: JSON.stringify({ email: newRegEmail.trim(), password: newRegPassword }),
      });
      setRegManagerSuccess(`Registerer ${newRegEmail.trim()} created! / ተመዝጋቢ ተፈጥሯል!`);
      setNewRegEmail('');
      setNewRegPassword('');
      await handleFetchRegisterers();
    } catch (err: any) {
      setRegManagerError(err.message);
    } finally {
      setIsCreatingReg(false);
    }
  };

  const handleDeleteRegisterer = async (uid: string, email: string) => {
    if (!window.confirm(`Delete registerer ${email}? / መዝጋቢውን ይሰርዙ?`)) return;
    try {
      await apiCall(`/api/registerers/${uid}`, { method: 'DELETE' });
      setRegisterersList((prev) => prev.filter((r) => r.uid !== uid));
    } catch (err: any) {
      setRegManagerError(err.message);
    }
  };

  // --- WAREHOUSE ACTION HANDLERS ---
  const handleCloseWarehouseModal = () => {
    setIsWarehouseModalOpen(false);
    setWAssetType('');
    setWQuantity('');
    setWOwner('');
    setWWarehouseNo('');
    setWManager('');
    setWDate(new Date().toISOString().split('T')[0]);
    setWInspection('');
    setWErrors({});
    setEditingWarehouseId(null);
  };

  const handleAddWarehouseEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingEntry = editingWarehouseId ? warehouseEntries.find(entry => entry.id === editingWarehouseId) : null;
    const entryId = editingWarehouseId || `w-${Date.now()}`;
    const sNo = existingEntry ? existingEntry.sNo : warehouseEntries.length + 1;

    const newEntry: WarehouseEntry = {
      id: entryId,
      sNo: sNo,
      assetType: wAssetType.trim(),
      quantity: wQuantity !== '' && !isNaN(Number(wQuantity)) ? Number(wQuantity) : '',
      owner: wOwner.trim(),
      warehouseNo: wWarehouseNo.trim(),
      manager: wManager.trim(),
      date: wDate || '',
      inspection: wInspection.trim()
    };

    try {
      await setDoc(doc(db, 'warehouseEntries', newEntry.id), newEntry);
      handleCloseWarehouseModal();
    } catch (err: any) {
      console.error("Failed to save entry:", err);
      alert("Error saving to Firestore: " + err.message);
    }
  };

  const handleDeleteWarehouseEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'warehouseEntries', id));
      // Re-index remaining entries in Firestore
      const filtered = warehouseEntries.filter(e => e.id !== id);
      for (let idx = 0; idx < filtered.length; idx++) {
        const entry = filtered[idx];
        const newSNo = idx + 1;
        if (entry.sNo !== newSNo) {
          await setDoc(doc(db, 'warehouseEntries', entry.id), { ...entry, sNo: newSNo });
        }
      }
    } catch (err: any) {
      console.error("Failed to delete entry:", err);
      alert("Error deleting from Firestore: " + err.message);
    }
  };

  const handleClearAllWarehouse = async () => {
    if (window.confirm('Are you sure you want to delete all warehouse entries? / ሁሉንም የመጋዘን ንብረቶች መሰረዝ እርግጠኛ ነዎት?')) {
      try {
        for (const entry of warehouseEntries) {
          await deleteDoc(doc(db, 'warehouseEntries', entry.id));
        }
      } catch (err: any) {
        console.error("Failed to clear entries:", err);
        alert("Error clearing from Firestore: " + err.message);
      }
    }
  };



  // Filter & Search Warehouse Entries
  const filteredWarehouseEntries = useMemo(() => {
    return warehouseEntries.filter(entry => {
      const query = warehouseSearch.toLowerCase();
      const matchesSearch = 
        entry.assetType.toLowerCase().includes(query) ||
        entry.owner.toLowerCase().includes(query) ||
        entry.warehouseNo.toLowerCase().includes(query) ||
        entry.manager.toLowerCase().includes(query) ||
        entry.inspection.toLowerCase().includes(query);

      const matchesOwner = warehouseFilterOwner === '' || entry.owner === warehouseFilterOwner;

      return matchesSearch && matchesOwner;
    });
  }, [warehouseEntries, warehouseSearch, warehouseFilterOwner]);

  // Warehouse Department counter stats
  const warehouseStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    warehouseEntries.forEach(e => {
      stats[e.owner] = (stats[e.owner] || 0) + 1;
    });
    return stats;
  }, [warehouseEntries]);


  // --- FIXED ASSETS ACTION HANDLERS ---
  const handleCloseAssetRowModal = () => {
    setIsAssetRowModalOpen(false);
    setRowDesc('');
    setRowTag('');
    setRowUnit('');
    setRowCost('');
    setRowSerial('');
    setRowReceived('Yes');
    setRowArea('');
    setRowBuilding('');
    setRowFloor('');
    setRowSpecificLoc('');
    setAssetRowErrors({});
    setEditingAssetRowId(null);
  };

  const handleAddAssetRow = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAssetRowId) {
      const updatedRows = empAssetRows.map((r) => {
        if (r.id === editingAssetRowId) {
          return {
            ...r,
            assetDescription: rowDesc.trim(),
            tagNo: rowTag.trim(),
            area: rowArea.trim(),
            building: rowBuilding.trim(),
            floor: rowFloor.trim(),
            specificLocation: rowSpecificLoc.trim(),
            unit: rowUnit,
            cost: rowCost !== '' && !isNaN(Number(rowCost)) ? Number(rowCost) : '',
            serialNo: rowSerial.trim(),
            received: rowReceived
          };
        }
        return r;
      });
      setEmpAssetRows(updatedRows);
      setIsAssetRowModalOpen(false);
      
      // Fully clear everything after successful edit
      setRowDesc('');
      setRowTag('');
      setRowUnit('');
      setRowCost('');
      setRowSerial('');
      setRowReceived('Yes');
      setRowArea('');
      setRowBuilding('');
      setRowFloor('');
      setRowSpecificLoc('');
      setAssetRowErrors({});
      setEditingAssetRowId(null);
    } else {
      const newRow: FixedAssetRow = {
        id: `far-${Date.now()}`,
        sNo: empAssetRows.length + 1,
        assetDescription: rowDesc.trim(),
        tagNo: rowTag.trim(),
        area: rowArea.trim(),
        building: rowBuilding.trim(),
        floor: rowFloor.trim(),
        specificLocation: rowSpecificLoc.trim(),
        unit: rowUnit,
        cost: rowCost !== '' && !isNaN(Number(rowCost)) ? Number(rowCost) : '',
        serialNo: rowSerial.trim(),
        received: rowReceived
      };

      setEmpAssetRows([...empAssetRows, newRow]);
      setIsAssetRowModalOpen(false);

      // Rapid repeated entry UX: Clear desc & tags but keep physical locations
      setRowDesc('');
      setRowTag('');
      setRowUnit('');
      setRowCost('');
      setRowSerial('');
      setRowReceived('Yes');
      setAssetRowErrors({});
    }
  };

  const handleDeleteAssetRow = (rowId: string) => {
    const filtered = empAssetRows.filter(r => r.id !== rowId);
    // Recalculate serial numbers
    const reordered = filtered.map((r, idx) => ({ ...r, sNo: idx + 1 }));
    setEmpAssetRows(reordered);
  };

  const handleCancelRecordEdit = () => {
    setEmpHeader({ employeeName: '', department: '', employeeNo: '' });
    setEmpAssetRows([]);
    setEmpCountedBy('');
    setEditingRecordId(null);
  };

  const handleSaveActiveRecordToBatch = async () => {
    if (!empHeader.employeeName.trim() || !empHeader.department.trim()) {
      alert('Please fill in Employee Name and Department. / እባክዎ የሰራተኛውን ስም እና የስራ ክፍል ይሙሉ!');
      return;
    }

    const validRows = empAssetRows.filter((r) => r.assetDescription.trim().length > 0);
    if (validRows.length === 0) {
      alert('At least one asset row with an Asset Description is required. / ቢያንስ አንድ ንብረት መግለጫ ያለው ረድፍ ያስፈልጋል።');
      return;
    }

    const recordId = editingRecordId || `rec-${Date.now()}`;
    const newRecord: FixedAssetRecord = {
      id: recordId,
      header: {
        employeeName: empHeader.employeeName.trim(),
        department: empHeader.department.trim(),
        employeeNo: empHeader.employeeNo.trim()
      },
      rows: validRows.map((r, idx) => ({ ...r, sNo: idx + 1 })),
      countedBy: empCountedBy.trim(),
      username: empUsername.trim(),
      date: empDate || ''
    };

    // Optimistic UI state update
    setFixedAssetRecords((prev) => {
      const idx = prev.findIndex(r => r.id === newRecord.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = newRecord;
        return next;
      } else {
        return [...prev, newRecord];
      }
    });

    try {
      await setDoc(doc(db, 'fixedAssetRecords', newRecord.id), newRecord);

      // Reset active form
      setEmpHeader({ employeeName: '', department: '', employeeNo: '' });
      setEmpAssetRows([]);
      setEmpCountedBy('');
      setEditingRecordId(null);
      alert(editingRecordId ? 'Employee Asset Record successfully updated! / የሰራተኛው ቋሚ ንብረት መዝገብ በተሳካ ሁኔታ ተስተካክሏል!' : 'Employee Asset Record successfully saved to Firestore! / የሰራተኛው ቋሚ ንብረት መዝገብ በተሳካ ሁኔታ ተቀምጧል!');
    } catch (err: any) {
      console.error("Failed to save record:", err);
      alert("Error saving record to Firestore: " + err.message);
    }
  };

  const handleDeleteSavedRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved record? / ይህንን የተቀመጠ መዝገብ መሰረዝ ይፈልጋሉ?')) {
      // Optimistic delete
      setFixedAssetRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecordId === id) {
        setSelectedRecordId(null);
      }
      try {
        await deleteDoc(doc(db, 'fixedAssetRecords', id));
      } catch (err: any) {
        console.error("Failed to delete record:", err);
        alert("Error deleting record from Firestore: " + err.message);
      }
    }
  };

  const handleClearAllFixedAssets = async () => {
    if (window.confirm('Are you sure you want to clear all completed employee records? / ሁሉንም የተቀመጡ የሰራተኛ መዛግብት መሰረዝ እርግጠኛ ነዎት?')) {
      const backup = [...fixedAssetRecords];
      setFixedAssetRecords([]);
      setSelectedRecordId(null);
      try {
        for (const record of backup) {
          await deleteDoc(doc(db, 'fixedAssetRecords', record.id));
        }
      } catch (err: any) {
        console.error("Failed to clear records:", err);
        setFixedAssetRecords(backup); // Revert on failure
        alert("Error clearing records from Firestore: " + err.message);
      }
    }
  };

  // Viewing a saved record in read-only visual overlay
  const viewedRecord = useMemo(() => {
    return fixedAssetRecords.find(r => r.id === selectedRecordId) || null;
  }, [fixedAssetRecords, selectedRecordId]);

  const renderRecordCard = (record: FixedAssetRecord) => {
    const style = getDeptStyles(record.header.department);
    return (
      <div
        key={record.id}
        onClick={() => setSelectedRecordId(record.id)}
        className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 ${
          selectedRecordId === record.id
            ? 'ring-2 ring-brand-600 bg-white shadow-xs border-brand-200'
            : 'bg-slate-50 hover:bg-white hover:shadow-xs border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="truncate">
            <h5 className="font-semibold text-slate-900 text-xs truncate">
              {record.header.employeeName}
            </h5>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${style.badge}`}>
              {record.header.department}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {canEdit && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmpHeader({
                      employeeName: record.header.employeeName,
                      department: record.header.department,
                      employeeNo: record.header.employeeNo
                    });
                    setEmpAssetRows(record.rows);
                    setEmpCountedBy(record.countedBy || '');
                    setEmpUsername(record.username || '');
                    if (record.date) { setEmpDate(record.date); }
                    setEditingRecordId(record.id);
                    const el = document.getElementById('fixed_asset_workspace');
                    if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
                  }}
                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Edit record / አስተካክል"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSavedRecord(record.id, e);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Delete from batch"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100/70 pt-2 font-mono">
          <span>ID: {record.header.employeeNo}</span>
          <span className="font-semibold text-slate-700">{record.rows.length} Items</span>
        </div>
      </div>
    );
  };

  const renderDeptSection = (entry: [string, FixedAssetRecord[]]) => {
    const [dept, val] = entry;
    const deptRecords = val as FixedAssetRecord[];
    const deptStyle = getDeptStyles(dept);
    const isCollapsed = !!collapsedDepts[dept];
    return (
      <div key={dept} className="space-y-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
        <div
          onClick={() => { setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] })); }}
          className={`flex items-center justify-between p-2 rounded-lg border font-medium ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border} text-xs cursor-pointer select-none transition-colors`}
        >
          <span className="truncate flex items-center space-x-1.5 font-bold">
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={`w-2 h-2 rounded-full border ${deptStyle.badge.split(' ')[0]}`}></span>
            <span className="truncate">{dept}</span>
          </span>
          <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${deptStyle.badge}`}>
              {deptRecords.length} {deptRecords.length === 1 ? 'Employee' : 'Employees'}
            </span>
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); exportFixedAssetsToExcel(deptRecords); }}
                className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer border border-slate-200"
                title={`Download ${dept} records separately / ${dept} ብቻውን አውርድ`}
              >
                <Download className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        {!isCollapsed && (
          <div className="space-y-2 pl-1">
            {deptRecords.map(renderRecordCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800" id="main_container">
      
      {/* HEADER SECTION WITH NAVIGATION PILLED TABS */}
      <header className="bg-white border-b-2 border-slate-200 px-4 py-4 md:px-8 sticky top-0 z-30 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs" id="app_header">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
            <FileSpreadsheet className="w-7 h-7" id="header_icon" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 leading-tight uppercase">
              የንብረት ቁጥጥር እና ምዝገባ <span className="text-blue-600">WORKSPACE</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold font-mono mt-0.5">
              Bilingual Side-by-Side Inventory Manager
            </p>
          </div>
        </div>
        
        {/* Premium Pills Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1" id="tab_navigation">
          <button
            id="warehouse_tab_btn"
            onClick={() => setActiveTab('warehouse')}
            className={`px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase transition-all tracking-wide text-left cursor-pointer flex flex-col ${
              activeTab === 'warehouse'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>Warehouse List</span>
            <span className="text-[9px] opacity-75 font-bold">የመጋዘን ዝርዝር</span>
          </button>
          <button
            id="fixed_asset_tab_btn"
            onClick={() => setActiveTab('fixed_asset')}
            className={`px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase transition-all tracking-wide text-left cursor-pointer flex flex-col ${
              activeTab === 'fixed_asset'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>Fixed Assets</span>
            <span className="text-[9px] opacity-75 font-bold">ቋሚ ንብረት</span>
          </button>
        </div>

        {/* Quick Stats Block with Bold Highlights */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-bold text-slate-500 uppercase font-mono">
          <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs">
            Warehouse Qty: <span className="text-blue-600 font-extrabold text-sm ml-1">{warehouseEntries.length}</span>
          </div>
          <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs">
            Saved Records: <span className="text-blue-600 font-extrabold text-sm ml-1">{fixedAssetRecords.length}</span>
          </div>
        </div>

        {/* Admin Auth Status Panel */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4" id="admin_auth_panel">
          {isAuthenticating ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying Auth...</span>
            </div>
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right">
                <span className={`text-xs font-bold flex items-center justify-end gap-1 ${userRole === 'admin' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${userRole === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  {userRole === 'admin' ? 'ADMIN MODE' : 'REGISTERER MODE'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]" title={currentUser.email}>
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={async () => {
                  try { await logoutAdmin(); } catch (e) { console.warn('Sign out warn:', e); }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                id="admin_logout_btn"
              >
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded font-bold">
                VIEWER MODE (READ ONLY)
              </span>
              <button
                onClick={() => {
                  setLoginMode('admin');
                  setLoginError('');
                  setLoginSuccess('');
                  setLoginPassword('');
                  setIsLoginModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                id="admin_login_btn"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="main_content">
        
        {/* TAB 1: WAREHOUSE LIST */}
        {activeTab === 'warehouse' && (
          <div className="space-y-6" id="warehouse_view">
            
            {/* Control Dashboard & Stats Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Department Statistics and Quick Filters */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="warehouse_stats_card">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Layers className="w-5 h-5 text-brand-600" />
                    <h3 className="font-display font-semibold text-slate-900">
                      የንብረት ባለቤቶች / Departments Legend
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Color-grouped sheets generated dynamically based on the <strong className="text-slate-700">Owner (ባለቤት)</strong> field.
                  </p>
                  
                  {warehouseEntries.length === 0 ? (
                    <div className="text-sm text-slate-400 italic py-4">
                      No entries found. Load sample or add.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1" id="warehouse_legend_pills">
                      {/* Filter All */}
                      <button
                        onClick={() => setWarehouseFilterOwner('')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          warehouseFilterOwner === ''
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>ሁሉም ባለቤቶች / All Owners</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                          {warehouseEntries.length}
                        </span>
                      </button>

                      {/* Dynamic Owner Pills */}
                      {Object.entries(warehouseStats).map(([owner, count]) => {
                        const style = getDeptStyles(owner);
                        const isSelected = warehouseFilterOwner === owner;
                        return (
                          <button
                            key={owner}
                            onClick={() => setWarehouseFilterOwner(isSelected ? '' : owner)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              isSelected
                                ? 'ring-2 ring-brand-600 ring-offset-1 font-bold shadow-xs'
                                : 'hover:bg-opacity-100'
                            } ${style.bg} ${style.text} ${style.border}`}
                          >
                            <span className="truncate flex items-center space-x-2">
                              <span className={`w-2.5 h-2.5 rounded-full border ${style.badge.split(' ')[0]}`}></span>
                              <span>{owner}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {warehouseFilterOwner && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-600">
                    <span>Filtering active / ማጣሪያው እየሰራ ነው</span>
                    <button 
                      onClick={() => setWarehouseFilterOwner('')}
                      className="underline font-semibold hover:text-brand-800 cursor-pointer"
                    >
                      Reset / መልስ
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons Panel */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between lg:col-span-2" id="warehouse_actions_card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-slate-900 text-lg">
                      የመጋዘን መረጃ ማስተዳደሪያ / Warehouse Inventory Management
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    የመጋዘን ዕቃዎች መመዝገቢያ ቅጽ በመጠቀም እያንዳንዱን ዕቃ ይምዝግቡ። በንብረት ባለቤትነት በክፍል/በዲፓርትመንት ተለይተው እያንዳንዱ ክፍል በተናጠል የራሱ የኤክሴል ሉህ (Excel Sheet) ይኖረዋል።
                  </p>
                  <p className="text-xs text-slate-500 font-sans italic">
                    Use the dialog to add entries sequentially. When exporting, SheetJS compiles the data, groups it by <strong>Owner</strong>, and outputs an .xlsx workbook with one tab per owner.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {canAdd && (
                    <button
                      id="add_warehouse_entry_btn"
                      onClick={() => setIsWarehouseModalOpen(true)}
                      className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ንብረት ጨምር / Add Warehouse Item</span>
                    </button>
                  )}

                  <button
                    id="export_warehouse_excel_btn"
                    onClick={() => exportWarehouseToExcel(warehouseEntries)}
                    disabled={warehouseEntries.length === 0}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ወደ Excel ቀይር / Export to Excel (.xlsx)</span>
                  </button>

                  {canEdit && warehouseEntries.length > 0 && (
                    <button
                      id="clear_warehouse_entries_btn"
                      onClick={handleClearAllWarehouse}
                      className="flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>ሁሉንም አጽዳ / Clear All</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW TABLE SECTION */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="warehouse_table_section">
              
              {/* Table Toolbar Search */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="warehouse_search_input"
                    type="text"
                    value={warehouseSearch}
                    onChange={(e) => setWarehouseSearch(e.target.value)}
                    placeholder="በንብረት ዓይነት፣ መጋዘን ወይም ኃላፊ ፈልግ... / Search asset, warehouse..."
                    className="pl-10 pr-4 py-2 w-full text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                
                <div className="text-xs text-slate-500 font-mono">
                  {filteredWarehouseEntries.length} of {warehouseEntries.length} items matched
                </div>
              </div>

              {/* Actual Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="warehouse_main_table">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b-2 border-slate-950 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-16 text-center font-mono text-slate-200">ተ.ቁ / S.No</th>
                      <th className="py-3 px-4 min-w-48 text-slate-100">የንብረት ዓይነት / Asset Type</th>
                      <th className="py-3 px-4 text-center text-slate-100">ብዛት / Qty</th>
                      <th className="py-3 px-4 text-slate-100">የንብረቱ ባለቤት / Owner (Department)</th>
                      <th className="py-3 px-4 text-slate-100">የመጋዘን ቁጥር / Warehouse No.</th>
                      <th className="py-3 px-4 text-slate-100">የመጋዘን ሃላፊ / Manager</th>
                      <th className="py-3 px-4 text-slate-100">የገባበት ቀን / Date</th>
                      <th className="py-3 px-4 text-slate-100">ምርመራ / Inspection Status</th>
                      <th className="py-3 px-4 w-20 text-center text-slate-100">ተግባር / Action</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredWarehouseEntries.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                          {warehouseEntries.length === 0 
                            ? 'የመጋዘን ንብረት መረጃ አልተገኘም። እባክዎ ንብረት ይጨምሩ! / No warehouse entries added yet. Click Add Warehouse Item to start!'
                            : 'ማጣሪያውን የሚያሟላ መረጃ የለም። / No results match your search or filter selection.'
                          }
                        </td>
                      </tr>
                    ) : (
                      filteredWarehouseEntries.map((entry) => {
                        const style = getDeptStyles(entry.owner);
                        return (
                          <tr 
                            key={entry.id} 
                            className={`transition-colors duration-150 ${style.bg} border-l-4 ${style.border.replace('border-', 'border-l-')}`}
                          >
                            <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">{entry.sNo}</td>
                            <td className="py-3 px-4 font-medium text-slate-900">{entry.assetType}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-md font-bold text-slate-800 font-mono text-xs">
                                {entry.quantity}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}>
                                {entry.owner}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs">{entry.warehouseNo}</td>
                            <td className="py-3 px-4 text-slate-700">{entry.manager}</td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-500">{entry.date}</td>
                            <td className="py-3 px-4 text-xs text-slate-600 italic max-w-xs truncate" title={entry.inspection}>
                              {entry.inspection}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {canEdit && (
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingWarehouseId(entry.id);
                                      setWAssetType(entry.assetType);
                                      setWQuantity(entry.quantity);
                                      setWOwner(entry.owner);
                                      setWWarehouseNo(entry.warehouseNo);
                                      setWManager(entry.manager);
                                      setWDate(entry.date);
                                      setWInspection(entry.inspection);
                                      setIsWarehouseModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                                    title="Edit entry / አስተካክል"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWarehouseEntry(entry.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                                    title="Delete entry / ሰርዝ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIXED ASSETS BY EMPLOYEE */}
        {activeTab === 'fixed_asset' && <div className="space-y-6" id="fixed_asset_view">

            {!isStaff && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4">
                Sign in as an Admin or Registerer to add new employee asset records. Viewing is read-only. / እባክዎ እንደ አስተዳዳሪ ወይም መዝጋቢ ይግቡ።
              </div>
            )}

            {/* Split layout: Form section on left/top, saved records list on right/bottom */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT Column (Main entry workspace): Spans 2 columns */}
              {isStaff && (
              <div className="lg:col-span-2 space-y-6" id="fixed_asset_workspace">
                
                {/* Employee Header Box */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs" id="employee_header_card">
                  <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-slate-900 text-lg">
                        ፩. የሰራተኛ መረጃ / 1. Employee Header
                      </h3>
                      <p className="text-xs text-slate-500">
                        Fill in employee background before appending physical asset items below.
                      </p>
                    </div>
                    {editingRecordId ? (
                      <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold border border-amber-200 font-mono flex items-center gap-1 animate-pulse">
                        <Pencil className="w-3 h-3" />
                        Editing Record Mode
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full font-semibold border border-brand-100 font-mono uppercase">
                        Active Form
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        የሰራተኛው ሙሉ ስም <span className="text-slate-400 font-normal">/ Employee Full Name</span>
                      </label>
                      <input
                        id="emp_name_input"
                        type="text"
                        value={empHeader.employeeName}
                        onChange={(e) => setEmpHeader({ ...empHeader, employeeName: e.target.value })}
                        placeholder="Abebe Bekele (አበበ በቀለ)"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ክፍል / የሥራ ክፍል <span className="text-slate-400 font-normal">/ Department</span>
                      </label>
                      <div className="relative">
                        <input
                          id="emp_dept_input"
                          type="text"
                          value={empHeader.department}
                          onChange={(e) => setEmpHeader({ ...empHeader, department: e.target.value })}
                          placeholder="IT Department, Marketing, etc."
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-300"
                        />
                        {/* Auto suggestions fast-pills for Department */}
                        {existingFixedAssetDepts.length > 0 && !existingFixedAssetDepts.includes(empHeader.department) && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-h-32 overflow-y-auto">
                            <span className="block text-[10px] text-slate-400 font-semibold mb-1">Suggestions:</span>
                            <div className="flex flex-wrap gap-1">
                              {existingFixedAssetDepts.map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setEmpHeader({ ...empHeader, department: d })}
                                  className="text-[10px] bg-slate-100 hover:bg-brand-50 hover:text-brand-700 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        የሰራተኛ መታወቂያ <span className="text-slate-400 font-normal">/ Employee No (ID)</span>
                      </label>
                      <input
                        id="emp_id_input"
                        type="text"
                        value={empHeader.employeeNo}
                        onChange={(e) => setEmpHeader({ ...empHeader, employeeNo: e.target.value })}
                        placeholder="EMP-4920"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Asset Rows Assignment Table */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs" id="employee_assets_box">
                  <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold text-slate-900 text-lg">
                        ፪. ቋሚ ንብረቶች / 2. Assigned Assets Table
                      </h3>
                      <p className="text-xs text-slate-500">
                        Items linked directly to this employee's custody profile.
                      </p>
                    </div>
                    
                    {canAdd && (
                      <button
                        id="add_asset_row_btn"
                        onClick={() => setIsAssetRowModalOpen(true)}
                        className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ንብረት ጨምር / Add Asset Row</span>
                      </button>
                    )}
                  </div>

                  {/* Active Asset Rows List */}
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full text-left border-collapse" id="active_assets_table">
                      <thead>
                        <tr className="bg-slate-900 text-white border-b-2 border-slate-950 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center font-mono text-slate-200">ተ.ቁ/S.No</th>
                          <th className="py-2.5 px-3 min-w-32 text-slate-100">መግለጫ / Asset Description</th>
                          <th className="py-2.5 px-3 text-slate-100">መለያ ቁጥር / Tag No</th>
                          <th className="py-2.5 px-3 text-slate-100">አካባቢ / Area</th>
                          <th className="py-2.5 px-3 text-center text-slate-100">መለኪያ / Unit</th>
                          <th className="py-2.5 px-3 text-right text-slate-100">ዋጋ / Cost</th>
                          <th className="py-2.5 px-3 text-slate-100">ሴሪያል ቁጥር / Serial No.</th>
                          <th className="py-2.5 px-3 text-center text-slate-100">የተረከበ / Recv?</th>
                          <th className="py-2.5 px-3 w-16 text-center text-slate-100">ድርጊት / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {empAssetRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-slate-400 italic bg-slate-50/20">
                              ያልተመዘገበ ንብረት የለም። እባክዎ "ንብረት ጨምር" ቁልፍን ይጫኑ! / No asset rows linked yet. Click "Add Asset Row" above!
                            </td>
                          </tr>
                        ) : (
                          empAssetRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">{row.sNo}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-900">{row.assetDescription}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">{row.tagNo}</td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {[
                                  row.area,
                                  row.building,
                                  row.floor ? `${row.floor}F` : '',
                                  row.specificLocation
                                ].filter(Boolean).join(' • ') || ''}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {row.unit ? (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                    {row.unit}
                                  </span>
                                ) : (
                                  ''
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium">
                                {typeof row.cost === 'number' ? `$${row.cost.toLocaleString()}` : row.cost}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{row.serialNo}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.received === 'Yes' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {row.received === 'Yes' ? 'Yes / አዎ' : 'No / አይደለም'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {canEdit && (
                                  <div className="flex items-center justify-center space-x-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingAssetRowId(row.id);
                                        setRowDesc(row.assetDescription);
                                        setRowTag(row.tagNo);
                                        setRowArea(row.area);
                                        setRowBuilding(row.building);
                                        setRowFloor(row.floor);
                                        setRowSpecificLoc(row.specificLocation);
                                        setRowUnit(row.unit);
                                        setRowCost(row.cost);
                                        setRowSerial(row.serialNo);
                                        setRowReceived(row.received);
                                        setIsAssetRowModalOpen(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Edit row / አስተካክል"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAssetRow(row.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Delete row / ሰርዝ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signature Block & Save to Batch action */}
                <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md" id="signatures_card">
                  <div className="border-b border-slate-800 pb-3 mb-4">
                    <h3 className="font-display font-semibold text-slate-200 text-base">
                      ፫. ፊርማ እና ማረጋገጫ / 3. Verification Signatures
                    </h3>
                    <p className="text-xs text-slate-400">
                      Signatures will append at the bottom of the exported employee sheet format automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        ቆጠራውን ያካሄደው ባለሙያ <span className="text-slate-500 font-normal">/ Counted By</span>
                      </label>
                      <input
                        id="emp_counted_by_input"
                        type="text"
                        value={empCountedBy}
                        onChange={(e) => setEmpCountedBy(e.target.value)}
                        placeholder="Name of analyst / ባለሙያ"
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        ያረጋገጠው ኃላፊ (Username) <span className="text-slate-500 font-normal">/ Verified By</span>
                      </label>
                      <input
                        id="emp_verified_by_input"
                        type="text"
                        value={empUsername}
                        onChange={(e) => setEmpUsername(e.target.value)}
                        placeholder="Verified manager"
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        የቆጠራ ቀን <span className="text-slate-500 font-normal">/ Inventory Date</span>
                      </label>
                      <input
                        id="emp_date_input"
                        type="date"
                        value={empDate}
                        onChange={(e) => setEmpDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
                    <p className="text-[11px] text-slate-400">
                      * Ensure all asset serial numbers and physical checks are complete.
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      {editingRecordId && (
                        <button
                          type="button"
                          onClick={handleCancelRecordEdit}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          እርማት ሰርዝ / Cancel Edit
                        </button>
                      )}
                      {canAdd && !editingRecordId && (
                        <button
                          id="save_record_to_batch_btn"
                          onClick={handleSaveActiveRecordToBatch}
                          className="flex items-center space-x-2 px-5 py-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-brand-600 hover:bg-brand-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>መዝገብ አስቀምጥ / Save Record to Batch List</span>
                        </button>
                      )}
                      {canEdit && editingRecordId && (
                        <button
                          id="update_record_btn"
                          onClick={handleSaveActiveRecordToBatch}
                          className="flex items-center space-x-2 px-5 py-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ማሻሻያውን አስቀምጥ / Update Record</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
              )}
              {/* RIGHT Column (Saved Employee batch cards & overall actions): Spans 1 column */}
              <div className="space-y-6" id="saved_records_panel">
                
                {/* Batch Actions Board */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs" id="batch_actions_box">
                  <h4 className="font-display font-semibold text-slate-900 mb-2 text-sm flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>የተቀመጡ መዛግብት ማውረጃ / Export Panel</span>
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Download all saved completed records. You can download them separately by department or grouped together as a single spreadsheet.
                  </p>

                  <div className="space-y-2">
                    {canEdit && (
                      <>
                        <button
                          id="export_fixed_assets_by_dept_btn"
                          onClick={() => exportFixedAssetsByDepartment(fixedAssetRecords)}
                          disabled={fixedAssetRecords.length === 0}
                          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>ለየክፍሉ ለየብቻ አውርድ / Export Separately by Department</span>
                        </button>

                        <button
                          id="export_fixed_assets_excel_btn"
                          onClick={() => exportFixedAssetsToExcel(fixedAssetRecords)}
                          disabled={fixedAssetRecords.length === 0}
                          className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed text-slate-700 px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                          <span>ሁሉንም በአንድ ላይ አውርድ / Export All in One File</span>
                        </button>
                      </>
                    )}

                    {canEdit && fixedAssetRecords.length > 0 && (
                      <button
                        onClick={handleClearAllFixedAssets}
                        className="w-full flex items-center justify-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ሁሉንም አጽዳ / Clear Saved List</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Batch Records List */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs" id="saved_records_list">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-brand-600" />
                      <span>የተመዘገቡ ሰራተኞች / Saved Employees ({fixedAssetRecords.length})</span>
                    </h4>
                  </div>

                  {fixedAssetRecords.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">የተቀመጠ መዝገብ የለም።</p>
                      <p className="text-[10px] text-slate-400 italic">No records saved in batch.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1" id="completed_cards_scroll">
                      {Object.entries(recordsByDept).map(renderDeptSection)}
                    </div>
                  )}
                </div>

              </div>

            </div>


            {/* SAVED RECORD MODAL OVERLAY VIEW (READ-ONLY PREVIEW) */}
            {viewedRecord && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="record_viewer_modal">
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-base">
                        የተመዘገበ የንብረት መረጃ ቅጽ / Saved Custody Inventory Form
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Dept: {viewedRecord.header.department} • Employee: {viewedRecord.header.employeeName}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRecordId(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                    {/* Header Details Table */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-mono font-semibold">የሰራተኛው ስም / Employee Name</span>
                        <span className="text-slate-800 font-medium">{viewedRecord.header.employeeName}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-mono font-semibold">የሥራ ክፍል / Department</span>
                        <span className="text-slate-800 font-medium">{viewedRecord.header.department}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-mono font-semibold">መታወቂያ ቁጥር / Employee ID</span>
                        <span className="text-slate-800 font-medium font-mono">{viewedRecord.header.employeeNo}</span>
                      </div>
                    </div>

                    {/* Table View of items */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white border-b-2 border-slate-950 text-[10px] uppercase font-bold tracking-wider font-mono">
                            <th className="py-2.5 px-3 w-10 text-center text-slate-200">S.No</th>
                            <th className="py-2.5 px-3 text-slate-100">Description</th>
                            <th className="py-2.5 px-3 text-slate-100">Tag No</th>
                            <th className="py-2.5 px-3 text-slate-100">Location</th>
                            <th className="py-2.5 px-3 text-center text-slate-100">Unit</th>
                            <th className="py-2.5 px-3 text-right text-slate-100">Cost</th>
                            <th className="py-2.5 px-3 text-slate-100">Serial No</th>
                            <th className="py-2.5 px-3 text-center text-slate-100">Received?</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {viewedRecord.rows.map((row) => (
                            <tr key={row.id}>
                              <td className="py-2 px-3 text-center font-mono text-slate-500">{row.sNo}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{row.assetDescription}</td>
                              <td className="py-2 px-3 font-mono text-slate-700">{row.tagNo}</td>
                              <td className="py-2 px-3 text-slate-600">
                                {[
                                  row.area,
                                  row.building,
                                  row.floor ? `${row.floor}F` : '',
                                  row.specificLocation
                                ].filter(Boolean).join(' • ') || ''}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {row.unit ? (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                    {row.unit}
                                  </span>
                                ) : (
                                  ''
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-medium">
                                {typeof row.cost === 'number' ? `$${row.cost.toLocaleString()}` : row.cost}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-500">{row.serialNo}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.received === 'Yes' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {row.received}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures read-only preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-4 text-xs font-mono">
                      <div>
                        <span className="block text-[10px] text-slate-400">COUNTED BY / ቆጠራውን ያደረገው:</span>
                        <span className="text-slate-800 font-medium">{viewedRecord.countedBy}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400">VERIFIED BY / ያረጋገጠው:</span>
                        <span className="text-slate-800 font-medium">{viewedRecord.username}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400">INVENTORY DATE / ቀን:</span>
                        <span className="text-slate-800 font-medium">{viewedRecord.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      {canEdit && (
                        <button
                          onClick={() => exportFixedAssetsToExcel([viewedRecord])}
                          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ይህን ቅጽ ብቻ ወደ Excel / Export This Sheet</span>
                        </button>
                      )}

                      {canEdit && (
                        <button
                          onClick={() => {
                            setEmpHeader({
                              employeeName: viewedRecord.header.employeeName,
                              department: viewedRecord.header.department,
                              employeeNo: viewedRecord.header.employeeNo
                            });
                            setEmpAssetRows(viewedRecord.rows);
                            setEmpCountedBy(viewedRecord.countedBy || '');
                            setEmpUsername(viewedRecord.username || '');
                            if (viewedRecord.date) {
                              setEmpDate(viewedRecord.date);
                            }
                            setEditingRecordId(viewedRecord.id);
                            setSelectedRecordId(null);

                            const el = document.getElementById('fixed_asset_workspace');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>መዝገቡን አስተካክል / Edit Record</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedRecordId(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-medium cursor-pointer"
                    >
                      Close / ዝጋ
                    </button>
                  </div>
                </div>
              </div>
            }

          </div>
        }

      </main>

      {/* --- MODAL DIALOGS --- */}

      {/* MODAL 1: ADD WAREHOUSE ENTRY */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="warehouse_modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-brand-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-base">
                  {editingWarehouseId ? 'የመጋዘን ንብረት ማስተካከያ ፎርም' : 'አዲስ የመጋዘን ንብረት መመዝገቢያ ፎርም'}
                </h3>
                <p className="text-xs text-slate-200 font-mono">
                  {editingWarehouseId ? 'Edit Warehouse List Entry • Side-by-Side Bilingual' : 'Add Warehouse List Entry • Side-by-Side Bilingual'}
                </p>
              </div>
              <button
                onClick={handleCloseWarehouseModal}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-brand-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWarehouseEntry} className="p-6 space-y-4 text-sm" id="warehouse_entry_form">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የንብረት ዓይነት / Asset Type
                </label>
                <input
                  id="modal_w_asset_type"
                  type="text"
                  value={wAssetType}
                  onChange={(e) => setWAssetType(e.target.value)}
                  placeholder="e.g. Ergonomic Office Desk (የቢሮ ጠረጴዛ)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ብዛት / Quantity
                  </label>
                  <input
                    id="modal_w_qty"
                    type="number"
                    value={wQuantity}
                    onChange={(e) => setWQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="1"
                    min="1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    የንብረቱ ባለቤት / Owner (Dept)
                  </label>
                  <input
                    id="modal_w_owner"
                    type="text"
                    value={wOwner}
                    onChange={(e) => setWOwner(e.target.value)}
                    placeholder="e.g. Finance, IT, Admin"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                  
                  {/* Suggestion Quick Pills */}
                  {existingWarehouseOwners.length > 0 && !existingWarehouseOwners.includes(wOwner) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {existingWarehouseOwners.map(owner => (
                        <button
                          key={owner}
                          type="button"
                          onClick={() => setWOwner(owner)}
                          className="text-[9px] bg-slate-100 hover:bg-brand-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                        >
                          {owner}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    የመጋዘን ቁጥር / Warehouse No.
                  </label>
                  <input
                    id="modal_w_no"
                    type="text"
                    value={wWarehouseNo}
                    onChange={(e) => setWWarehouseNo(e.target.value)}
                    placeholder="e.g. WH-01, Main Storage"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    የመጋዘን ሃላፊ / Warehouse Manager
                  </label>
                  <input
                    id="modal_w_manager"
                    type="text"
                    value={wManager}
                    onChange={(e) => setWManager(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    የገባበት ቀን / Date of Entry
                  </label>
                  <input
                    id="modal_w_date"
                    type="date"
                    value={wDate}
                    onChange={(e) => setWDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ምርመራ / Inspection Status
                  </label>
                  <input
                    id="modal_w_inspection"
                    type="text"
                    value={wInspection}
                    onChange={(e) => setWInspection(e.target.value)}
                    placeholder="e.g. Excellent, Damaged, Brand New"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseWarehouseModal}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer"
                >
                  Cancel / ሰርዝ
                </button>
                <button
                  id="modal_add_w_submit"
                  type="submit"
                  className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                >
                  {editingWarehouseId ? 'አስተካክል / Confirm Update' : 'አረጋግጥ / Confirm Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL 2: ADD EMPLOYEE FIXED ASSET ROW */}
      {isAssetRowModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="asset_row_modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-base">
                  {editingAssetRowId ? 'ቋሚ ንብረት ማስተካከያ / Edit Custody Asset Row' : 'አዲስ ቋሚ ንብረት መመዝገቢያ / Add Custody Asset Row'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingAssetRowId ? 'Update details of this entered asset row.' : 'Fill in accurate tags, specifications, and values.'}
                </p>
              </div>
              <button
                onClick={handleCloseAssetRowModal}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAssetRow} className="p-6 space-y-4 text-sm" id="asset_row_form">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የንብረት መግለጫ / Asset Description
                </label>
                <input
                  id="modal_row_desc"
                  type="text"
                  value={rowDesc}
                  onChange={(e) => setRowDesc(e.target.value)}
                  placeholder="e.g. Ergonomic Office Mesh Chair"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    መለያ ቁጥር / Tag Number
                  </label>
                  <input
                    id="modal_row_tag"
                    type="text"
                    value={rowTag}
                    onChange={(e) => setRowTag(e.target.value)}
                    placeholder="e.g. FA-HQ-1205"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ማሽን/ሴሪያል ቁጥር / Serial No.
                  </label>
                  <input
                    id="modal_row_serial"
                    type="text"
                    value={rowSerial}
                    onChange={(e) => setRowSerial(e.target.value)}
                    placeholder="e.g. S/N SN02919929"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Location Cluster Fields */}
              <div className="border border-slate-100 p-3.5 rounded-lg bg-slate-50/50 space-y-3">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">የንብረቱ ቦታ / Physical Location fields</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">አካባቢ / Area</label>
                    <input
                      id="modal_row_area"
                      type="text"
                      value={rowArea}
                      onChange={(e) => setRowArea(e.target.value)}
                      placeholder="e.g. HQ Campus, Branch"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ህንፃ / Building</label>
                    <input
                      id="modal_row_building"
                      type="text"
                      value={rowBuilding}
                      onChange={(e) => setRowBuilding(e.target.value)}
                      placeholder="e.g. Block A, Main"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ፎቅ / Floor</label>
                    <input
                      id="modal_row_floor"
                      type="text"
                      value={rowFloor}
                      onChange={(e) => setRowFloor(e.target.value)}
                      placeholder="e.g. 2nd, G"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ልዩ ቦታ / Specific Location</label>
                    <input
                      id="modal_row_specific"
                      type="text"
                      value={rowSpecificLoc}
                      onChange={(e) => setRowSpecificLoc(e.target.value)}
                      placeholder="e.g. Office Suite 203"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cost, Unit, and custody validation */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    መለኪያ / Unit (Qty/Type)
                  </label>
                  <input
                    id="modal_row_unit"
                    type="text"
                    value={rowUnit}
                    onChange={(e) => setRowUnit(e.target.value)}
                    placeholder="e.g. 10, Pcs, 5 Pcs"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['1', '5', '10', 'Pcs', 'Set'].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setRowUnit(pill)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 rounded transition-colors cursor-pointer"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ዋጋ / Cost (USD)
                  </label>
                  <input
                    id="modal_row_cost"
                    type="number"
                    value={rowCost}
                    onChange={(e) => setRowCost(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="Amount"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    የተረከበ / Received
                  </label>
                  <select
                    id="modal_row_received"
                    value={rowReceived}
                    onChange={(e) => setRowReceived(e.target.value as 'Yes' | 'No')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white font-semibold"
                  >
                    <option value="Yes" className="text-emerald-700">Yes / አዎ</option>
                    <option value="No" className="text-rose-700">No / አይደለም</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseAssetRowModal}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer"
                >
                  Cancel / ሰርዝ
                </button>
                <button
                  id="modal_add_asset_row_submit"
                  type="submit"
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                >
                  {editingAssetRowId ? 'አስተካክል / Confirm Update' : 'አረጋግጥ / Confirm Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN MODAL OVERLAY (Admin & Registerer) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="login_modal_overlay">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col transform transition-all animate-scale-up">

            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-display font-semibold text-sm uppercase tracking-wide">
                    መግቢያ / Sign In
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {loginMode === 'admin' ? 'Admin login' : 'Registerer login'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role toggle tabs */}
            <div className="flex bg-slate-100 mx-6 mt-5 rounded-lg p-1 border border-slate-200" role="tablist">
              <button
                role="tab"
                aria-selected={loginMode === 'admin'}
                onClick={() => { setLoginMode('admin'); setLoginError(''); setLoginSuccess(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  loginMode === 'admin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Admin
              </button>
              <button
                role="tab"
                aria-selected={loginMode === 'registerer'}
                onClick={() => { setLoginMode('registerer'); setLoginError(''); setLoginSuccess(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  loginMode === 'registerer' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Registerer / መዝጋቢ
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              {loginError && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200 font-medium">
                  {loginError}
                </div>
              )}
              {loginSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 font-medium animate-pulse">
                  {loginSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  ኢሜይል / Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-700">
                    የይለፍ ቃል / Password
                  </label>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel / ሰርዝ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors text-xs font-semibold cursor-pointer shadow-sm"
                >
                  {isSubmittingLogin ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>ይግቡ / Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MANAGE REGISTERERS MODAL (Admin-only) */}
      {isRegManagerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="reg_manager_modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-display font-semibold text-sm uppercase tracking-wide">
                    መዝጋቢዎች አስተዳደር / Manage Registerers
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Create or remove registerer accounts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegManagerModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Create new registerer */}
              <form onSubmit={handleCreateRegisterer} className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">ጨምር / Add Registerer</h4>

                {regManagerError && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">{regManagerError}</div>
                )}
                {regManagerSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">{regManagerSuccess}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newRegEmail}
                      onChange={(e) => setNewRegEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                      placeholder="registerer@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password (6+ chars)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newRegPassword}
                      onChange={(e) => setNewRegPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingReg}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingReg ? 'Creating... / በመፍጠር ላይ...' : 'ፍጠር / Create Registerer'}</span>
                  </button>
                </div>
              </form>

              {/* Registerers list */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    የተፈጠሩ / Existing Registerers ({registerersList.length})
                  </h4>
                  <button
                    onClick={handleFetchRegisterers}
                    className="text-xs text-brand-600 hover:underline cursor-pointer"
                  >
                    Refresh / አድስ
                  </button>
                </div>

                {registerersList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No registerers yet. / መዝጋቢ የለም እስካሁን።</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {registerersList.map((reg) => (
                      <div
                        key={reg.uid}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="text-xs font-mono truncate text-slate-700">{reg.email}</div>
                        <button
                          onClick={() => handleDeleteRegisterer(reg.uid, reg.email)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={`Delete ${reg.email}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER METADATA */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-12 text-xs font-mono" id="app_footer_info">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>© 2026 Asset Inventory Management App. Built client-side with SheetJS.</span>
          <div className="flex justify-center space-x-4">
            <span>User: spadmin77@gmail.com</span>
            <span>•</span>
            <span>UTC Local Time: 2026-07-14</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
