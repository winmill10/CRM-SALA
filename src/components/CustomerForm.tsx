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
  Sparkles,
  Megaphone,
  Link2,
  Unlink,
  Info,
  Maximize2,
  Eye,
  Check
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

  // Linked Campaign State
  const [campaignId, setCampaignId] = useState<number | ''>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [previewCampaignImage, setPreviewCampaignImage] = useState<string | null>(null);

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

  // Contact Month (YYYY-MM) derived from contactDate
  const contactMonth = useMemo(() => {
    return contactDate ? contactDate.substring(0, 7) : '';
  }, [contactDate]);

  // Campaigns filtered strictly by the contact month
  const monthCampaigns = useMemo(() => {
    if (!contactMonth) return [];
    return (appData.salesCampaigns || []).filter((sc) => sc.month === contactMonth);
  }, [appData.salesCampaigns, contactMonth]);

  // Group campaigns into those belonging to currently selected salesAgent and others
  const { agentCampaigns, otherCampaigns } = useMemo(() => {
    const curAgent = (salesAgent || '').trim();
    const mine = monthCampaigns.filter((sc) => sc.salesAgent.trim() === curAgent);
    const others = monthCampaigns.filter((sc) => sc.salesAgent.trim() !== curAgent);
    return { agentCampaigns: mine, otherCampaigns: others };
  }, [monthCampaigns, salesAgent]);

  // Currently selected campaign object
  const selectedCampaign = useMemo(() => {
    if (!campaignId) return null;
    return (appData.salesCampaigns || []).find((sc) => sc.id === Number(campaignId)) || null;
  }, [appData.salesCampaigns, campaignId]);

  // Auto-clear campaign if user changes contactDate to a month where the campaign is not found
  useEffect(() => {
    if (campaignId && selectedCampaign && selectedCampaign.month !== contactMonth) {
      setCampaignId('');
      setCampaignName('');
    }
  }, [contactMonth, campaignId, selectedCampaign]);

  const handleSelectCampaign = (idStr: string) => {
    if (!idStr) {
      setCampaignId('');
      setCampaignName('');
      return;
    }
    const numId = Number(idStr);
    const sc = (appData.salesCampaigns || []).find((c) => c.id === numId);
    if (sc) {
      setCampaignId(sc.id);
      setCampaignName(sc.campaignName);

      // Align category if present in appData
      if (sc.category && appData.categories[sc.category]) {
        setCategory(sc.category);
      }
    }
  };

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
    setCampaignId('');
    setCampaignName('');
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
      campaignId: campaignId ? Number(campaignId) : undefined,
      campaignName: campaignName.trim() || undefined,
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

          {/* Field 5: ลิงก์กับแคมเปญเพจสาขา (ประจำเดือนที่ทักเข้ามา) */}
          <div className="md:col-span-3 bg-red-50/50 p-4 rounded-2xl border border-red-200/90 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-red-600" />
                <span>5. ลิงก์กับแคมเปญเพจสาขา</span>
                <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  เดือน {contactMonth || 'ที่ระบุ'}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  มี {monthCampaigns.length} แคมเปญในเดือนนี้
                </span>
                {campaignId && (
                  <button
                    type="button"
                    onClick={() => {
                      setCampaignId('');
                      setCampaignName('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg font-medium transition cursor-pointer"
                  >
                    <Unlink className="w-3 h-3" />
                    ยกเลิกลิงก์
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <select
                  value={campaignId}
                  onChange={(e) => handleSelectCampaign(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-medium cursor-pointer"
                >
                  <option value="">-- ไม่ได้มาจากแคมเปญเพจสาขา (ลูกค้าทั่วไป / หน้าร้าน / ออร์แกนิก) --</option>
                  {agentCampaigns.length > 0 && (
                    <optgroup label={`แคมเปญของเซลล์ ${salesAgent} (${agentCampaigns.length} รายการ)`}>
                      {agentCampaigns.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          ⭐ {sc.campaignName} ({sc.category} | งบ ฿{sc.budget.toLocaleString()} | ใช้ ฿{sc.spend.toLocaleString()})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherCampaigns.length > 0 && (
                    <optgroup label={`แคมเปญเพจอื่นๆ ในเดือน ${contactMonth} (${otherCampaigns.length} รายการ)`}>
                      {otherCampaigns.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          [{sc.salesAgent}] {sc.campaignName} ({sc.category})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>
                    ระบบจะกรองแคมเปญเฉพาะ <strong>เดือน {contactMonth || 'ที่ระบุ'}</strong> ที่ตรงกับวันที่ลูกค้าทักเข้ามาโดยอัตโนมัติ
                  </span>
                </p>

                {monthCampaigns.length === 0 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      ยังไม่มีการลงข้อมูลแคมเปญเพจสาขาในเดือน <strong>{contactMonth}</strong>{' '}
                      (สามารถปล่อยว่างไว้เป็นลูกค้าทั่วไป หรือไปเพิ่มแคมเปญได้ที่แท็บ <strong>&ldquo;แคมเปญเพจสาขา&rdquo;</strong>)
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Campaign Live Preview Card */}
              {selectedCampaign ? (
                <div className="bg-white p-3 rounded-xl border border-red-200 shadow-2xs space-y-2">
                  <div className="flex items-start gap-2.5">
                    {/* Thumbnail 600x600 px image */}
                    {selectedCampaign.image ? (
                      <div className="relative group shrink-0">
                        <img
                          src={selectedCampaign.image}
                          alt={selectedCampaign.campaignName}
                          onClick={() => setPreviewCampaignImage(selectedCampaign.image || '')}
                          title="คลิกเพื่อดูรูปภาพขนาด 600x600 px เต็ม"
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-2xs cursor-pointer group-hover:opacity-90 transition"
                        />
                        <div
                          onClick={() => setPreviewCampaignImage(selectedCampaign.image || '')}
                          className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer text-white"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                        <Megaphone className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                          แคมเปญเพจสาขา
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {selectedCampaign.month}
                        </span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
                          {selectedCampaign.salesAgent}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs mt-1 truncate" title={selectedCampaign.campaignName}>
                        {selectedCampaign.campaignName}
                      </h4>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 font-mono">
                        <span>งบ: ฿{Number(selectedCampaign.budget).toLocaleString()}</span>
                        <span>•</span>
                        <span>ใช้: ฿{Number(selectedCampaign.spend).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-sky-700 font-bold">Inbox: {selectedCampaign.inbox}</span>
                        {selectedCampaign.ps !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-700 font-bold">PS: {selectedCampaign.ps}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Smart sync buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    {selectedCampaign.category && selectedCampaign.category !== category && (
                      <button
                        type="button"
                        onClick={() => setCategory(selectedCampaign.category)}
                        className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        ปรับประเภทรถเป็น &ldquo;{selectedCampaign.category}&rdquo; ให้ตรงกับแคมเปญ
                      </button>
                    )}
                    {selectedCampaign.salesAgent && selectedCampaign.salesAgent !== salesAgent && (
                      <button
                        type="button"
                        onClick={() => setSalesAgent(selectedCampaign.salesAgent)}
                        className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        ปรับเซลล์ผู้ดูแลเป็น &ldquo;{selectedCampaign.salesAgent}&rdquo;
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px] flex items-center justify-center h-full min-h-[58px]">
                  <span>เลือกแคมเปญเพื่อดูรายละเอียดและเชื่อมโยง หรือปล่อยว่างหากเป็นลูกค้าทั่วไป</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              6. ประเภทที่สนใจ <span className="text-red-500">*</span>
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
              7. รุ่นย่อย <span className="text-red-500">*</span>
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
              8. สถานะการติดตาม <span className="text-red-500">*</span>
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
              9. เบอร์โทร / ช่องทางติดต่อลูกค้า
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
              10. รูปภาพประกอบ / สลิปโอน / แชท
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
              11. ผลการติดตาม / บันทึกการพูดคุย
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

      {/* Lightbox Modal for 600x600 Campaign Image */}
      {previewCampaignImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewCampaignImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-red-600" />
                <span className="font-bold text-xs text-slate-800">
                  รูปภาพแคมเปญเพจสาขา (600 × 600 px)
                </span>
              </div>
              <button
                onClick={() => setPreviewCampaignImage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center">
              <img
                src={previewCampaignImage}
                alt="Campaign Full Preview"
                className="w-[400px] h-[400px] max-w-full max-h-[70vh] object-cover rounded-xl shadow-lg border border-white/10"
              />
            </div>
            {selectedCampaign && (
              <div className="p-3.5 bg-white text-xs border-t border-slate-100">
                <div className="font-bold text-slate-800">{selectedCampaign.campaignName}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>เดือน {selectedCampaign.month}</span>
                  <span>•</span>
                  <span>เซลล์: {selectedCampaign.salesAgent}</span>
                  <span>•</span>
                  <span>รุ่น: {selectedCampaign.category}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
