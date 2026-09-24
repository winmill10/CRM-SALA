import React, { useState } from 'react';
import { AppData, AppUser, SalesProfile } from '../types';
import {
  Settings,
  Plus,
  Trash2,
  Palette,
  Download,
  Upload,
  RotateCcw,
  Users,
  Shield,
  Key,
  CheckCircle,
  UserCheck,
  Contact,
  Phone,
  Facebook,
  Eye,
  EyeOff,
  Edit2
} from 'lucide-react';

interface SettingsTabProps {
  appData: AppData;
  onAddCategory: (name: string, color: string) => boolean;
  onDeleteCategory: (name: string) => void;
  onAddSubCategory: (categoryName: string, subName: string) => boolean;
  onDeleteSubCategory: (categoryName: string, index: number) => void;
  onResetData: () => void;
  onSaveUser?: (user: AppUser) => void;
  onDeleteUser?: (id: string) => void;
  currentUser?: AppUser | null;
  onSaveSalesProfile?: (profile: Omit<SalesProfile, 'id'> & { id?: number }) => void;
  onToggleSalesVisibility?: (id: number) => void;
  onDeleteSalesProfile?: (id: number) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  appData,
  onAddCategory,
  onDeleteCategory,
  onAddSubCategory,
  onDeleteSubCategory,
  onResetData,
  onSaveUser,
  onDeleteUser,
  currentUser,
  onSaveSalesProfile,
  onToggleSalesVisibility,
  onDeleteSalesProfile,
}) => {
  // Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ef4444');

  const categories = Object.keys(appData.categories);
  const [selectedCat, setSelectedCat] = useState<string>(categories[0] || '');
  const [newSubName, setNewSubName] = useState('');

  // Sales Profiles Management state
  const [salesNick, setSalesNick] = useState('');
  const [salesFullName, setSalesFullName] = useState('');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesFacebook, setSalesFacebook] = useState('');
  const [salesNote, setSalesNote] = useState('');
  const [editingSalesId, setEditingSalesId] = useState<number | null>(null);
  const [salesMsg, setSalesMsg] = useState('');

  const handleSaveSales = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesNick.trim() || !onSaveSalesProfile) return;
    onSaveSalesProfile({
      id: editingSalesId || undefined,
      nickname: salesNick.trim(),
      fullName: salesFullName.trim(),
      phone: salesPhone.trim(),
      facebook: salesFacebook.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(salesNick.trim())}`,
      note: salesNote.trim(),
      hidden: false,
    });
    setSalesMsg(editingSalesId ? 'แก้ไขข้อมูลเซลล์เรียบร้อย' : 'เพิ่มเซลล์ใหม่และเชื่อมโยงกับระบบเรียบร้อย');
    setTimeout(() => setSalesMsg(''), 3000);
    setSalesNick('');
    setSalesFullName('');
    setSalesPhone('');
    setSalesFacebook('');
    setSalesNote('');
    setEditingSalesId(null);
  };

  const handleStartEditSales = (sp: SalesProfile) => {
    setEditingSalesId(sp.id);
    setSalesNick(sp.nickname);
    setSalesFullName(sp.fullName || '');
    setSalesPhone(sp.phone || '');
    setSalesFacebook(sp.facebook || '');
    setSalesNote(sp.note || '');
  };

  const handleCancelEditSales = () => {
    setEditingSalesId(null);
    setSalesNick('');
    setSalesFullName('');
    setSalesPhone('');
    setSalesFacebook('');
    setSalesNote('');
  };

  // User Management state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'mkt' | 'sales'>('admin');
  const [userMsg, setUserMsg] = useState('');

  // Password reset modal or inline
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPassValue, setEditPassValue] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const ok = onAddCategory(newCatName.trim(), newCatColor);
    if (ok) {
      if (!selectedCat) setSelectedCat(newCatName.trim());
      setNewCatName('');
    } else {
      alert('ประเภทนี้มีอยู่แล้วในระบบ');
    }
  };

  const handleAddSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat) {
      alert('กรุณาเลือกประเภทก่อน');
      return;
    }
    if (!newSubName.trim()) return;
    const ok = onAddSubCategory(selectedCat, newSubName.trim());
    if (ok) {
      setNewSubName('');
    } else {
      alert('รุ่นย่อยนี้มีอยู่แล้วในประเภทนี้');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg('');
    const u = newUsername.trim().toLowerCase();
    const p = newPassword.trim();
    if (!u || !p) {
      alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    const existing = (appData.users || []).find((usr) => usr.username.toLowerCase() === u);
    if (existing || u === 'salacms') {
      alert('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
      return;
    }

    if (onSaveUser) {
      onSaveUser({
        id: `user-${Date.now()}`,
        username: u,
        password: p,
        displayName: newDisplayName.trim() || u,
        role: newRole,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setUserMsg('เพิ่มผู้ใช้งานสำเร็จ');
      setTimeout(() => setUserMsg(''), 3000);
    }
  };

  const handleUpdatePassword = (u: AppUser) => {
    if (!editPassValue.trim()) return;
    if (onSaveUser) {
      onSaveUser({
        ...u,
        password: editPassValue.trim(),
      });
      setEditingUserId(null);
      setEditPassValue('');
      alert(`เปลี่ยนรหัสผ่านสำหรับ ${u.username} เรียบร้อยแล้ว`);
    }
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `car_crm_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json && json.categories && json.customers) {
          localStorage.setItem('car_page_app_data_v6', JSON.stringify(json));
          window.location.reload();
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    };
    reader.readAsText(file);
  };

  const currentSubList = selectedCat && appData.categories[selectedCat] ? appData.categories[selectedCat] : [];

  const userList: AppUser[] = appData.users && appData.users.length > 0
    ? appData.users
    : [
        {
          id: 'user-salacms',
          username: 'salacms',
          password: 'salacms',
          displayName: 'ผู้ดูแลระบบหลัก (salacms)',
          role: 'superadmin',
          createdAt: '2026-09-01 09:00:00',
        },
      ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl font-bold text-red-700 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            ตั้งค่าระบบ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการประเภท สี และรุ่นย่อยของรถยนต์ในโชว์รูม จัดการผู้ใช้งานระบบ และจัดการการสำรองข้อมูล
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Categories */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-red-600" />
              1. จัดการประเภทรถ (Categories) และกำหนดสีประจำประเภท
            </h3>

            <form onSubmit={handleAddCategory} className="flex flex-wrap gap-2.5 max-w-xl mb-4 items-center">
              <input
                type="text"
                placeholder="ชื่อประเภท เช่น EV, SUV, รถเพื่อการพาณิชย์"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-grow p-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
              />
              <div className="flex items-center gap-1 border border-slate-300 p-1 rounded-xl bg-white shrink-0">
                <label className="text-[11px] text-slate-500 px-1 font-semibold">เลือกสี:</label>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มประเภท
              </button>
            </form>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                ประเภทที่มีอยู่ในระบบปัจจุบัน:
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const color = appData.categoryColors[cat] || '#64748b';
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-slate-800">{cat}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`คุณต้องการลบประเภท "${cat}" พร้อมรุ่นย่อยทั้งหมดใช่หรือไม่?`)) {
                            onDeleteCategory(cat);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 ml-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Sub-categories / Models */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-red-600" />
              2. จัดการรุ่นย่อย (Sub-Category) แยกตามประเภทรถ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600">เลือกประเภท</label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600">เพิ่มรุ่นย่อยใหม่</label>
                <form onSubmit={handleAddSubCategory} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อรุ่นย่อยใหม่"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                  />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                รุ่นย่อยในประเภท &ldquo;{selectedCat}&rdquo;:
              </label>
              <div className="flex flex-wrap gap-2">
                {currentSubList.length === 0 ? (
                  <span className="text-xs text-slate-400">ยังไม่มีรุ่นย่อยในประเภทนี้</span>
                ) : (
                  currentSubList.map((sub, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs"
                    >
                      <span className="font-medium text-slate-700">{sub}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`ต้องการลบรุ่นย่อย "${sub}" ใช่หรือไม่?`)) {
                            onDeleteSubCategory(selectedCat, idx);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Sales Profiles & Agents Management */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Contact className="w-4 h-4 text-red-600" />
                  3. จัดการข้อมูลเซลล์ (Sales Profiles &amp; Agents)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เพิ่ม ลบ หรือแก้ไขข้อมูลเซลล์ รายชื่อทั้งหมดจะเชื่อมโยงกับฟอร์มบันทึกข้อมูลลูกค้า และหน้ารายงานเซลล์อัตโนมัติ
                </p>
              </div>
              <span className="text-[11px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-md">
                เซลล์ในระบบ: {(appData.salesProfiles || []).length} คน (เปิดใช้งาน {(appData.salesProfiles || []).filter(p => !p.hidden).length} คน)
              </span>
            </div>

            {salesMsg && (
              <div className="mb-4 flex items-center gap-1.5 p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{salesMsg}</span>
              </div>
            )}

            {/* Sales Add/Edit Form */}
            {onSaveSalesProfile && (
              <form onSubmit={handleSaveSales} className="bg-white p-4 rounded-xl border border-slate-200 mb-4 text-xs">
                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-red-600" />
                  {editingSalesId ? 'แก้ไขข้อมูลเซลล์' : 'เพิ่มเซลล์ใหม่'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      ชื่อเล่น/ชื่อเรียกในระบบ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น คุณสมชาย, คุณป๊อป"
                      value={salesNick}
                      onChange={(e) => setSalesNick(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">ชื่อ-นามสกุลจริง</label>
                    <input
                      type="text"
                      placeholder="เช่น สมชาย ใจดี"
                      value={salesFullName}
                      onChange={(e) => setSalesFullName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      placeholder="081-xxx-xxxx"
                      value={salesPhone}
                      onChange={(e) => setSalesPhone(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Facebook เพจ/เซลล์</label>
                    <input
                      type="text"
                      placeholder="FB: Somchai Auto"
                      value={salesFacebook}
                      onChange={(e) => setSalesFacebook(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="หมายเหตุหรือความเชี่ยวชาญ (เช่น เชี่ยวชาญ MU-X, ประจำสาขา...)"
                    value={salesNote}
                    onChange={(e) => setSalesNote(e.target.value)}
                    className="flex-1 p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    {editingSalesId && (
                      <button
                        type="button"
                        onClick={handleCancelEditSales}
                        className="px-3 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
                      >
                        ยกเลิก
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold shadow-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {editingSalesId ? 'บันทึกการแก้ไข' : 'เพิ่มเซลล์'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Sales Table */}
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="p-3 font-semibold">เซลล์</th>
                    <th className="p-3 font-semibold">ชื่อ-นามสกุล</th>
                    <th className="p-3 font-semibold">เบอร์โทร</th>
                    <th className="p-3 font-semibold">Facebook</th>
                    <th className="p-3 font-semibold">สถานะในระบบ</th>
                    <th className="p-3 font-semibold text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(appData.salesProfiles || []).map((sp) => {
                    const custCount = (appData.customers || []).filter((c) => c.salesAgent === sp.nickname).length;
                    return (
                      <tr key={sp.id} className={`hover:bg-slate-50 ${sp.hidden ? 'opacity-50 bg-slate-50/50' : ''}`}>
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                          <img
                            src={sp.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sp.nickname)}`}
                            alt={sp.nickname}
                            className="w-7 h-7 rounded-full object-cover border"
                          />
                          <span>{sp.nickname}</span>
                        </td>
                        <td className="p-3 text-slate-600">{sp.fullName || '-'}</td>
                        <td className="p-3 text-slate-600 font-mono">{sp.phone || '-'}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[150px]">{sp.facebook || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sp.hidden
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {sp.hidden ? 'ซ่อน' : 'แสดงในระบบ'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              (ลูกค้า {custCount} คน)
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onToggleSalesVisibility && (
                              <button
                                type="button"
                                onClick={() => onToggleSalesVisibility(sp.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 transition"
                                title={sp.hidden ? 'เปิดใช้งาน' : 'ซ่อน'}
                              >
                                {sp.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEditSales(sp)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteSalesProfile && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`ต้องการลบข้อมูลเซลล์ "${sp.nickname}" ใช่หรือไม่?`)) {
                                    onDeleteSalesProfile(sp.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Users Management */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Users className="w-4 h-4 text-red-600" />
                4. จัดการผู้ใช้งานและสิทธิ์การเข้าสู่ระบบ (User Management)
              </h3>
              <span className="text-[11px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-md">
                บัญชีหลัก: salacms
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              ควบคุมบัญชีผู้เข้าใช้งานระบบ และเปลี่ยนรหัสผ่านเพื่อความปลอดภัยของข้อมูล
            </p>

            {/* User Form */}
            <form onSubmit={handleAddUser} className="bg-white p-4 rounded-xl border border-slate-200 mb-4 text-xs">
              <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-red-600" />
                เพิ่มผู้ใช้งานใหม่
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น manager1"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    รหัสผ่าน (Password) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="รหัสผ่าน"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">ชื่อที่แสดง (Display Name)</label>
                  <input
                    type="text"
                    placeholder="เช่น ผู้จัดการสาขา"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">สิทธิ์ (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'mkt' | 'sales')}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-red-500"
                  >
                    <option value="admin">ผู้ดูแล (Admin) - จัดการผู้ใช้ ตั้งค่า และ Export ได้</option>
                    <option value="mkt">การตลาด (MKT) - ตั้งค่าไม่ได้ และ Export ไม่ได้</option>
                    <option value="sales">ทีมขาย (Sales) - ตั้งค่าไม่ได้ และ Export ไม่ได้</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                {userMsg && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {userMsg}
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกผู้ใช้</span>
                </button>
              </div>
            </form>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left bg-white">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">ชื่อผู้ใช้งาน</th>
                    <th className="p-2.5">ชื่อที่แสดง</th>
                    <th className="p-2.5">ระดับสิทธิ์</th>
                    <th className="p-2.5">รหัสผ่าน</th>
                    <th className="p-2.5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userList.map((usr) => {
                    const isSuper = usr.username === 'salacms' || usr.role === 'superadmin';
                    const isEditing = editingUserId === usr.id;

                    return (
                      <tr key={usr.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono text-slate-900 flex items-center gap-1.5">
                          {isSuper ? (
                            <Shield className="w-3.5 h-3.5 text-red-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{usr.username}</span>
                          {isSuper && (
                            <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded border border-red-200 font-semibold">
                              User หลัก
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-700">{usr.displayName || usr.username}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSuper
                                ? 'bg-red-600 text-white'
                                : usr.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : usr.role === 'mkt'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {usr.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="รหัสผ่านใหม่"
                                value={editPassValue}
                                onChange={(e) => setEditPassValue(e.target.value)}
                                className="p-1 text-xs border border-slate-300 rounded font-mono w-32 focus:ring-1 focus:ring-red-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePassword(usr)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-[11px] font-medium hover:bg-red-700"
                              >
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(null);
                                  setEditPassValue('');
                                }}
                                className="text-slate-400 hover:text-slate-600 text-[11px]"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>••••••••</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(usr.id);
                                  setEditPassValue(usr.password || '');
                                }}
                                className="text-slate-400 hover:text-red-700 text-[11px] flex items-center gap-0.5"
                                title="เปลี่ยนรหัสผ่าน"
                              >
                                <Key className="w-3 h-3" />
                                <span>เปลี่ยนรหัส</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {!isSuper && onDeleteUser && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`คุณต้องการลบผู้ใช้งาน "${usr.username}" หรือไม่?`)) {
                                  onDeleteUser(usr.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                              title="ลบผู้ใช้งาน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Backup & Restore */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-red-600" />
              5. สำรองข้อมูลและกู้คืน (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ดาวน์โหลดไฟล์ข้อมูลทั้งหมดของระบบเก็บไว้ หรือนำไฟล์สำรองมาเปิดใช้งานในเครื่องนี้
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={handleExportBackup}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                ดาวน์โหลดไฟล์สำรอง (JSON)
              </button>

              <label className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>นำเข้าไฟล์สำรอง (Restore)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('คุณต้องการรีเซ็ตฐานข้อมูลเป็นค่าเริ่มต้นทั้งหมดหรือไม่? ข้อมูลที่บันทึกไว้จะถูกเขียนทับ')) {
                    onResetData();
                  }
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                รีเซ็ตข้อมูลเริ่มต้น (Default Demo)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
