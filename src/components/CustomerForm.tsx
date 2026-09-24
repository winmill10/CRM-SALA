import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Customer, SalesProfile, AppUser } from '../types';
import { getCurrentFormattedDateTime } from '../hooks/useAppData';
import {
  UserPlus,
  Save,
  RotateCcw,
  Trash2,
  CheckCircle,
  Phone,
  Facebook,
  UserCheck,
  Plus,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface CustomerFormProps {
  appData: AppData;
  currentUser?: AppUser | null;
  onSaveCustomer: (customer: Omit<Customer, 'id' | 'entryDateTime' | 'statusHistory'>) => void;
  onNavigateToTable: () => void;
  onSaveSalesProfile?: (profile: Omit<SalesProfile, 'id'> & { id?: number }) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  appData,
  currentUser,
  onSaveCustomer,
  onNavigateToTable,
  onSaveSalesProfile,
}) => {
  const [contactDate, setContactDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entryDateTime, setEntryDateTime] = useState('');
  const [fbName, setFbName] = useState('');
  const [salesAgent, setSalesAgent] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [status, setStatus] = useState('PS');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('');
  const [followUpResult, setFollowUpResult] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Quick Add Sales Profile Modal
  const [isAddSalesModalOpen, setIsAddSalesModalOpen] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFacebook, setNewFacebook] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    setEntryDateTime(getCurrentFormattedDateTime());
    const interval = setInterval(() => {
      setEntryDateTime(getCurrentFormattedDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Linked list of active sales profiles and nicknames
  const activeSalesProfiles = useMemo(() => {
    return (appData.salesProfiles || []).filter((sp) => !sp.hidden);
  }, [appData.salesProfiles]);

  const availableSalesAgents = useMemo(() => {
    const fromProfiles = activeSalesProfiles.map((p) => p.nickname.trim()).filter(Boolean);
    const fromAgents = (appData.salesAgents || []).map((a) => a.trim()).filter(Boolean);
    const combined = Array.from(new Set([...fromProfiles, ...fromAgents])).filter(Boolean);
    return combined;
  }, [activeSalesProfiles, appData.salesAgents]);

  // Current selected sales profile linked details
  const selectedProfile = useMemo(() => {
    if (!salesAgent) return null;
    return (appData.salesProfiles || []).find((p) => p.nickname.trim() === salesAgent.trim()) || null;
  }, [appData.salesProfiles, salesAgent]);

  // Auto-select sales agent based on current logged in user or default list
  useEffect(() => {
    if (currentUser?.salesNickname && availableSalesAgents.includes(currentUser.salesNickname)) {
      setSalesAgent(currentUser.salesNickname);
    } else if (availableSalesAgents.length > 0 && !salesAgent) {
      setSalesAgent(availableSalesAgents[0]);
    }
  }, [currentUser, availableSalesAgents]);

  const categories = Object.keys(appData.categories);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  useEffect(() => {
    if (category && appData.categories[category]) {
      const subs = appData.categories[category];
      if (subs.length > 0) {
        setSubCategory(subs[0]);
      } else {
        setSubCategory('');
      }
    }
  }, [category, appData.categories]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setContactDate(new Date().toISOString().split('T')[0]);
    setFbName('');
    setPhone('');
    setImage('');
    setFollowUpResult('');
    if (categories.length > 0) setCategory(categories[0]);
    if (currentUser?.salesNickname && availableSalesAgents.includes(currentUser.salesNickname)) {
      setSalesAgent(currentUser.salesNickname);
    } else if (availableSalesAgents.length > 0) {
      setSalesAgent(availableSalesAgents[0]);
    }
    setStatus('PS');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesAgent) {
      alert('กรุณาเลือกเซลล์ที่ดูแลก่อนบันทึกข้อมูล');
      return;
    }
    if (!category || !subCategory) {
      alert('กรุณาเลือกประเภทและรุ่นย่อยของรถยนต์');
      return;
    }

    onSaveCustomer({
      contactDate,
      fbName: fbName.trim(),
      salesAgent: salesAgent.trim(),
      category,
      subCategory,
      status,
      phone: phone.trim(),
      image,
      followUpResult: followUpResult.trim(),
    });

    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
    handleReset();
  };

  const handleSaveQuickSalesProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNick.trim()) return;

    const trimmedNick = newNick.trim();
    if (onSaveSalesProfile) {
      onSaveSalesProfile({
        nickname: trimmedNick,
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        facebook: newFacebook.trim(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedNick)}`,
        note: newNote.trim(),
        hidden: false,
      });
    }

    setSalesAgent(trimmedNick);
    setIsAddSalesModalOpen(false);
    setNewNick('');
    setNewFullName('');
    setNewPhone('');
    setNewFacebook('');
    setNewNote('');
  };

  const currentSubs = category && appData.categories[category] ? appData.categories[category] : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-2">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              บันทึกข้อมูลลูกค้าใหม่
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กรอกรายละเอียดลูกค้าที่ทักเพจเข้ามา ข้อมูลจะถูกเชื่อมโยงไปยังรายงานและกระดานของเซลล์ผู้ดูแลโดยอัตโนมัติ
            </p>
          </div>

          {successToast && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold animate-fade-in shadow-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>บันทึกข้อมูลลูกค้าและเชื่อมโยงกับเซลล์เรียบร้อยแล้ว!</span>
            </div>
          )}
        </div>

        {/* Sales User Banner (if logged in as sales) */}
        {currentUser?.salesNickname && (
          <div className="mb-6 p-3 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-red-900 font-medium">
              <UserCheck className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                คุณกำลังบันทึกข้อมูลในฐานะเซลล์:{' '}
                <strong className="text-red-700 font-bold">{currentUser.salesNickname}</strong> (ระบบเลือกให้คุณอัตโนมัติ)
              </span>
            </div>
            <span className="text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
              เซลล์ผู้ดูแล
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. วันที่ลูกค้าทักเข้ามา <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={contactDate}
              onChange={(e) => setContactDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. วันเวลาที่ลงข้อมูล (ระบบ)
            </label>
            <input
              type="text"
              disabled
              value={entryDateTime}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              3. ชื่อ Facebook ลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ชื่อโปรไฟล์ลูกค้า หรือชื่อติดต่อ"
              value={fbName}
              onChange={(e) => setFbName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          {/* Field 4: เซลล์ที่ดูแล (Linked to Sales Profile) */}
          <div className="md:col-span-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-red-600" />
                4. เซลล์ที่ดูแล (เชื่อมโยงกับฐานข้อมูลเซลล์และหน้ารายงาน) <span className="text-red-500">*</span>
              </label>
              {onSaveSalesProfile && (
                <button
                  type="button"
                  onClick={() => setIsAddSalesModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg font-semibold transition"
                >
                  <Plus className="w-3 h-3" />
                  เพิ่มเซลล์ใหม่
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <select
                  required
                  value={salesAgent}
                  onChange={(e) => setSalesAgent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-medium"
                >
                  {availableSalesAgents.length > 0 ? (
                    availableSalesAgents.map((s) => {
                      const profile = (appData.salesProfiles || []).find((p) => p.nickname === s);
                      return (
                        <option key={s} value={s}>
                          {s} {profile?.fullName ? `(${profile.fullName})` : ''}
                        </option>
                      );
                    })
                  ) : (
                    <option value="">(ยังไม่มีรายชื่อเซลล์ - กรุณากดปุ่มเพิ่มเซลล์ใหม่)</option>
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  เมื่อบันทึก รายการลูกค้าจะไปขึ้นที่แท็บ <strong>&ldquo;รายงานเซลล์&rdquo;</strong> ของ {salesAgent || 'เซลล์ที่เลือก'} ทันที
                </p>
              </div>

              {/* Linked Sales Profile Preview Card */}
              {selectedProfile ? (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-3">
                  <img
                    src={selectedProfile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedProfile.nickname)}`}
                    alt={selectedProfile.nickname}
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-xs truncate">{selectedProfile.nickname}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold shrink-0 flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                        เชื่อมโยงโปรไฟล์แล้ว
                      </span>
                    </div>
                    {selectedProfile.fullName && (
                      <p className="text-[11px] text-slate-600 truncate">{selectedProfile.fullName}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                      {selectedProfile.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {selectedProfile.phone}
                        </span>
                      )}
                      {selectedProfile.facebook && (
                        <span className="flex items-center gap-1 text-blue-600 truncate">
                          <Facebook className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{selectedProfile.facebook}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : salesAgent ? (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>เซลล์ <strong>{salesAgent}</strong> พร้อมใช้งาน (ยังไม่ได้ใส่รูป/เบอร์โทรโปรไฟล์)</span>
                  </div>
                  {onSaveSalesProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewNick(salesAgent);
                        setIsAddSalesModalOpen(true);
                      }}
                      className="text-[11px] underline font-bold text-amber-900 hover:text-amber-700 shrink-0"
                    >
                      + เติมข้อมูลโปรไฟล์
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              5. ประเภทที่สนใจ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-medium"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              6. รุ่นย่อย <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-medium"
            >
              {currentSubs.length > 0 ? (
                currentSubs.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))
              ) : (
                <option value="">(ไม่มีรุ่นย่อยในประเภทนี้)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              7. สถานะการติดตาม <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-bold text-red-700"
            >
              {appData.statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              8. เบอร์โทร / ช่องทางติดต่อลูกค้า
            </label>
            <input
              type="text"
              placeholder="เช่น 081-234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              9. รูปภาพประกอบ / สลิปโอน / แชท
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="w-full p-1 border border-slate-300 rounded-xl bg-slate-50 text-slate-500 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            {image && (
              <div className="mt-2 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <img src={image} alt="Preview" className="w-12 h-12 rounded-lg object-cover border" />
                <div className="flex-1 text-[11px] text-slate-600">แนบรูปเรียบร้อย</div>
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบรูป
                </button>
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              10. ผลการติดตาม / บันทึกการพูดคุย
            </label>
            <textarea
              rows={3}
              placeholder="ระบุรายละเอียดการพูดคุย นัดหมายทดลองขับ ข้อมูลไฟแนนซ์..."
              value={followUpResult}
              onChange={(e) => setFollowUpResult(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          <div className="md:col-span-3 flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToTable}
              className="text-xs text-slate-600 hover:text-red-700 underline font-medium flex items-center gap-1"
            >
              ดูตารางข้อมูลลูกค้าทั้งหมด ({appData.customers.length} รายการ) &rarr;
            </button>

            <div className="flex space-x-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ล้างข้อมูล
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-7 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                บันทึกข้อมูลลูกค้า
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Add Sales Agent Modal */}
      {isAddSalesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-red-600" />
                เพิ่มเซลล์ผู้ดูแลใหม่ลงระบบ
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSalesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickSalesProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อเล่น / ชื่อเรียกเซลล์ในระบบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณสมชาย, คุณป๊อป, เซลล์เอก"
                  value={newNick}
                  onChange={(e) => setNewNick(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุลจริง
                </label>
                <input
                  type="text"
                  placeholder="เช่น สมชาย ใจดี"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="081-xxx-xxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Facebook เพจ/เซลล์</label>
                  <input
                    type="text"
                    placeholder="FB: Somchai Isuzu"
                    value={newFacebook}
                    onChange={(e) => setNewFacebook(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ / ความเชี่ยวชาญ</label>
                <input
                  type="text"
                  placeholder="เช่น เชี่ยวชาญ MU-X, ประจำสาขา..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSalesModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  บันทึกเซลล์และเชื่อมโยงทันที
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
