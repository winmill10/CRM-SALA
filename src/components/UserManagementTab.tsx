import React, { useState, useMemo } from 'react';
import { AppData, AppUser, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
  LogOut,
  Sparkles,
  X,
  Save,
  Contact,
  TrendingUp
} from 'lucide-react';

interface UserManagementTabProps {
  appData: AppData;
  currentUser: AppUser | null;
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (id: string) => void;
  onLogout?: () => void;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
  appData,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'mkt' | 'sales'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<AppUser | null>(null);

  // Form states for Add User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'mkt' | 'sales'>('admin');
  const [newSalesNickname, setNewSalesNickname] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states for Edit User
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('admin');
  const [editSalesNickname, setEditSalesNickname] = useState('');

  // Form states for Password Change
  const [changePasswordVal, setChangePasswordVal] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const userList: AppUser[] = useMemo(() => {
    const list = appData.users && appData.users.length > 0 ? [...appData.users] : [];
    // Ensure salacms is included
    if (!list.some((u) => u.username.toLowerCase() === 'salacms')) {
      list.unshift({
        id: 'user-salacms',
        username: 'salacms',
        password: 'salacms',
        displayName: 'ผู้ดูแลระบบหลัก (salacms)',
        role: 'superadmin',
        createdAt: '2026-09-01 09:00:00',
      });
    }
    return list;
  }, [appData.users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      if (roleFilter !== 'all') {
        if (roleFilter === 'superadmin' && u.role !== 'superadmin') return false;
        if (roleFilter === 'admin' && u.role !== 'admin') return false;
        if (roleFilter === 'mkt' && u.role !== 'mkt') return false;
        if (roleFilter === 'sales' && u.role !== 'sales') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = u.username.toLowerCase().includes(q);
        const matchName = (u.displayName || '').toLowerCase().includes(q);
        const matchSales = (u.salesNickname || '').toLowerCase().includes(q);
        if (!matchUser && !matchName && !matchSales) return false;
      }
      return true;
    });
  }, [userList, roleFilter, searchQuery]);

  // Stats
  const totalCount = userList.length;
  const adminCount = userList.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;
  const mktCount = userList.filter((u) => u.role === 'mkt').length;
  const salesCount = userList.filter((u) => u.role === 'sales').length;

  // Handle Add User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const u = newUsername.trim().toLowerCase();
    const p = newPassword.trim();

    if (!u || !p) {
      setFormError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    if (u.length < 3) {
      setFormError('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (p.length < 4) {
      setFormError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    const existing = userList.find((usr) => usr.username.toLowerCase() === u);
    if (existing) {
      setFormError(`ชื่อผู้ใช้ "${u}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
      return;
    }

    const newUserObj: AppUser = {
      id: `user-${Date.now()}`,
      username: u,
      password: p,
      displayName: newDisplayName.trim() || u,
      role: newRole,
      salesNickname: newRole === 'sales' ? newSalesNickname : undefined,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    onSaveUser(newUserObj);
    setIsAddModalOpen(false);
    setNewUsername('');
    setNewPassword('');
    setNewDisplayName('');
    setNewRole('admin');
    setNewSalesNickname('');
    showToast(`เพิ่มผู้ใช้งาน "${u}" สำเร็จแล้ว`);
  };

  // Open Edit User Modal
  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEditDisplayName(u.displayName || '');
    setEditRole(u.role);
    setEditSalesNickname(u.salesNickname || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const isSuper = editingUser.username.toLowerCase() === 'salacms';
    const updated: AppUser = {
      ...editingUser,
      displayName: editDisplayName.trim() || editingUser.username,
      role: isSuper ? 'superadmin' : editRole,
      salesNickname: (isSuper ? 'superadmin' : editRole) === 'sales' ? editSalesNickname : undefined,
    };

    onSaveUser(updated);
    setEditingUser(null);
    showToast(`อัปเดตข้อมูล "${editingUser.username}" เรียบร้อยแล้ว`);
  };

  // Open Password Modal
  const openPasswordModal = (u: AppUser) => {
    setPasswordModalUser(u);
    setChangePasswordVal(u.password || '');
    setShowChangePassword(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    if (!changePasswordVal.trim()) {
      alert('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    const updated: AppUser = {
      ...passwordModalUser,
      password: changePasswordVal.trim(),
    };

    onSaveUser(updated);
    setPasswordModalUser(null);
    showToast(`เปลี่ยนรหัสผ่านสำหรับ "${passwordModalUser.username}" เรียบร้อยแล้ว`);
  };

  const handleDelete = (u: AppUser) => {
    if (u.username.toLowerCase() === 'salacms' || u.id === 'user-salacms') {
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (salacms) ได้');
      return;
    }

    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน "${u.username}" ออกจากระบบ?`)) {
      onDeleteUser(u.id);
      showToast(`ลบผู้ใช้งาน "${u.username}" เรียบร้อยแล้ว`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>ระบบจัดการผู้ใช้งาน (User Management)</span>
                  <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    Super Admin Mode
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  จัดการบัญชีผู้ใช้งาน กำหนดสิทธิ์การเข้าถึง และรีเซ็ตรหัสผ่าน ซิงค์ข้อมูลกับ Firebase แบบเรียลไทม์
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('คุณต้องการออกจากระบบ (Logout) ใช่หรือไม่?')) {
                    onLogout();
                  }
                }}
                className="bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>ออกจากระบบ</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Active User Banner */}
        {currentUser && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white p-4 sm:p-5 rounded-2xl mb-6 shadow-md border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-300 font-bold text-lg">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-200 font-medium">เข้าสู่ระบบในชื่อ:</span>
                  <span className="font-bold text-sm text-white font-mono">{currentUser.username}</span>
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    {currentUser.role === 'superadmin' ? 'Super Admin หลัก' : currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>ชื่อที่แสดง: {currentUser.displayName || currentUser.username}</span>
                  {currentUser.salesNickname && (
                    <span className="text-red-300 font-medium">
                      &bull; เซลล์: {currentUser.salesNickname}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => openPasswordModal(currentUser)}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-medium border border-white/20 flex items-center gap-1.5 transition"
              >
                <Key className="w-3.5 h-3.5 text-amber-300" />
                <span>เปลี่ยนรหัสผ่านฉัน</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('คุณต้องการออกจากระบบ (Logout) หรือไม่?')) {
                      onLogout();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">ผู้ใช้งานทั้งหมด</p>
              <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{totalCount} คน</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">ผู้ดูแลระบบ (Admin)</p>
              <p className="text-2xl font-black text-red-700 mt-1 font-mono">{adminCount} คน</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">การตลาด (MKT)</p>
              <p className="text-2xl font-black text-indigo-700 mt-1 font-mono">{mktCount} คน</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">ทีมขาย (Sales)</p>
              <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{salesCount} คน</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้ หรือชื่อที่แสดง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs text-slate-500 font-medium shrink-0">กรองสิทธิ์:</span>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  roleFilter === 'all' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  roleFilter === 'admin' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ผู้ดูแล ({adminCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('mkt')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  roleFilter === 'mkt' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                การตลาด ({mktCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('sales')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  roleFilter === 'sales' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทีมขาย ({salesCount})
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs bg-white">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">ชื่อผู้ใช้งาน (Username)</th>
                <th className="p-3">ชื่อที่แสดง (Display Name)</th>
                <th className="p-3">ระดับสิทธิ์ (Role)</th>
                <th className="p-3">เซลล์ที่เชื่อมโยง</th>
                <th className="p-3">รหัสผ่าน</th>
                <th className="p-3">วันที่สร้าง</th>
                <th className="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isMainSuper = u.username.toLowerCase() === 'salacms';
                  const isCurrent = currentUser?.username.toLowerCase() === u.username.toLowerCase();

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCurrent ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-sans font-bold text-xs ${
                              isMainSuper
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : u.role === 'mkt'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isMainSuper ? (
                              <ShieldCheck className="w-4 h-4 text-red-600" />
                            ) : (
                              u.username.substring(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1.5">
                              {u.username}
                              {isMainSuper && (
                                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded border border-red-200">
                                  User หลัก
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                  คุณ
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-medium text-slate-800">
                        {u.displayName || '-'}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'superadmin' || isMainSuper
                              ? 'bg-red-600 text-white'
                              : u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : u.role === 'mkt'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {u.role === 'superadmin' || isMainSuper
                            ? 'SUPER ADMIN'
                            : u.role === 'admin'
                            ? 'ADMIN (ผู้ดูแล)'
                            : u.role === 'mkt'
                            ? 'MKT (การตลาด)'
                            : 'SALES (ทีมขาย)'}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600">
                        {u.salesNickname ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Contact className="w-3.5 h-3.5 text-red-600" />
                            {u.salesNickname}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>••••••••</span>
                          <button
                            type="button"
                            onClick={() => openPasswordModal(u)}
                            className="text-slate-400 hover:text-red-600 p-1 transition"
                            title="เปลี่ยนรหัสผ่าน"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {u.createdAt || '-'}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="text-slate-500 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition"
                            title="แก้ไขข้อมูลผู้ใช้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!isMainSuper && (
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                              title="ลบผู้ใช้งาน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Roles & Permissions Reference Card */}
        <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-red-600" />
            คำอธิบายระดับสิทธิ์การใช้งาน (Role &amp; Permissions)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-red-700 block mb-1">1. Super Admin (salacms)</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                สิทธิ์สูงสุดของระบบ สามารถจัดการผู้ใช้ทั้งหมด จัดการข้อมูลลูกค้า แคมเปญ งบประมาณ ตั้งค่าระบบ และรีเซ็ตข้อมูลได้
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-amber-700 block mb-1">2. Admin (ผู้ดูแลระบบ)</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                สามารถจัดการระบบผู้ใช้ได้, จัดการข้อมูลเซลล์, เข้าใช้งานตั้งค่าระบบได้, Export ได้, ทำได้ทุกอย่างในระบบ
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-indigo-700 block mb-1">3. MKT (ฝ่ายการตลาด)</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                บันทึกข้อมูลลูกค้า ดูงบประมาณและรีพอร์ตได้ แต่<strong className="text-rose-600">ตั้งค่าระบบไม่ได้</strong> และ <strong className="text-rose-600">Export ไม่ได้</strong>
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-700 block mb-1">4. Sales (ฝ่ายขาย)</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                บันทึกและติดตามลูกค้า ดูแคมเปญเพจสาขาได้ แต่<strong className="text-rose-600">ตั้งค่าระบบไม่ได้</strong> และ <strong className="text-rose-600">Export ไม่ได้</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm">เพิ่มผู้ใช้งานใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="เช่น admin_north, sales_dew"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="อย่างน้อย 4 ตัวอักษร"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อที่แสดง (Display Name)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ผู้จัดการฝ่ายขาย, นัท เซลล์ออนไลน์"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ระดับสิทธิ์ (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'mkt' | 'sales')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  <option value="admin">ผู้ดูแลระบบ (Admin) - จัดการผู้ใช้, จัดการเซลล์, ตั้งค่าระบบ, Export ได้</option>
                  <option value="mkt">ฝ่ายการตลาด (MKT) - บันทึกข้อมูลและดูงบ, ตั้งค่าระบบไม่ได้, Export ไม่ได้</option>
                  <option value="sales">ทีมขาย (Sales) - บันทึกและติดตามลูกค้า, ตั้งค่าระบบไม่ได้, Export ไม่ได้</option>
                </select>
              </div>

              {newRole === 'sales' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เชื่อมโยงกับโปรไฟล์เซลล์
                  </label>
                  <select
                    value={newSalesNickname}
                    onChange={(e) => setNewSalesNickname(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  >
                    <option value="">-- ไม่ระบุ / เชื่อมโยงภายหลัง --</option>
                    {appData.salesAgents.map((agent) => {
                      const sp = (appData.salesProfiles || []).find((p) => p.nickname === agent);
                      return (
                        <option key={agent} value={agent}>
                          {agent} {sp?.fullName ? `(${sp.fullName})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกผู้ใช้</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">แก้ไขข้อมูลผู้ใช้: {editingUser.username}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อที่แสดง (Display Name)
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              {editingUser.username.toLowerCase() !== 'salacms' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ระดับสิทธิ์ (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  >
                    <option value="admin">ผู้ดูแลระบบ (Admin) - จัดการผู้ใช้, จัดการเซลล์, ตั้งค่าระบบ, Export ได้</option>
                    <option value="mkt">ฝ่ายการตลาด (MKT) - บันทึกข้อมูลและดูงบ, ตั้งค่าระบบไม่ได้, Export ไม่ได้</option>
                    <option value="sales">ทีมขาย (Sales) - บันทึกและติดตามลูกค้า, ตั้งค่าระบบไม่ได้, Export ไม่ได้</option>
                  </select>
                </div>
              )}

              {editRole === 'sales' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เชื่อมโยงกับโปรไฟล์เซลล์
                  </label>
                  <select
                    value={editSalesNickname}
                    onChange={(e) => setEditSalesNickname(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {appData.salesAgents.map((agent) => {
                      const sp = (appData.salesProfiles || []).find((p) => p.nickname === agent);
                      return (
                        <option key={agent} value={agent}>
                          {agent} {sp?.fullName ? `(${sp.fullName})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">เปลี่ยนรหัสผ่าน: {passwordModalUser.username}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสผ่านใหม่สำหรับ {passwordModalUser.username} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showChangePassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="ป้อนรหัสผ่านใหม่"
                    value={changePasswordVal}
                    onChange={(e) => setChangePasswordVal(e.target.value)}
                    className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showChangePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>เปลี่ยนรหัสผ่าน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
