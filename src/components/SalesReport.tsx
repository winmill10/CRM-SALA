import React, { useState, useRef, useMemo } from 'react';
import { AppData, SalesProfile } from '../types';
import { formatNum } from '../hooks/useAppData';
import {
  Contact,
  UserPlus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Phone,
  Facebook,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  X,
  FileText,
  Car,
  Megaphone
} from 'lucide-react';

interface SalesReportProps {
  appData: AppData;
  onSaveProfile: (profile: Omit<SalesProfile, 'id'> & { id?: number }) => void;
  onToggleVisibility: (id: number) => void;
  onDeleteProfile: (id: number) => void;
  availableYears: string[];
}

export const SalesReport: React.FC<SalesReportProps> = ({
  appData,
  onSaveProfile,
  onToggleVisibility,
  onDeleteProfile,
  availableYears,
}) => {
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || '2026');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  // Profile modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [facebook, setFacebook] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [note, setNote] = useState('');

  // Canvas Image Cropper state
  const [cropSourceImg, setCropSourceImg] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const months = [
    { value: '', label: 'ทุกเดือน' },
    { value: '01', label: 'มกราคม (01)' },
    { value: '02', label: 'กุมภาพันธ์ (02)' },
    { value: '03', label: 'มีนาคม (03)' },
    { value: '04', label: 'เมษายน (04)' },
    { value: '05', label: 'พฤษภาคม (05)' },
    { value: '06', label: 'มิถุนายน (06)' },
    { value: '07', label: 'กรกฎาคม (07)' },
    { value: '08', label: 'สิงหาคม (08)' },
    { value: '09', label: 'กันยายน (09)' },
    { value: '10', label: 'ตุลาคม (10)' },
    { value: '11', label: 'พฤศจิกายน (11)' },
    { value: '12', label: 'ธันวาคม (12)' },
  ];

  const visibleProfiles = useMemo(() => {
    return appData.salesProfiles.filter((sp) => showHidden || !sp.hidden);
  }, [appData.salesProfiles, showHidden]);

  const openAddModal = () => {
    setEditingId(null);
    setNickname('');
    setFullName('');
    setPhone('');
    setFacebook('');
    setAvatarUrl('');
    setNote('');
    setCropSourceImg(null);
    setCropZoom(1);
    setCropRotation(0);
    setIsModalOpen(true);
  };

  const openEditModal = (sp: SalesProfile) => {
    setEditingId(sp.id);
    setNickname(sp.nickname);
    setFullName(sp.fullName);
    setPhone(sp.phone);
    setFacebook(sp.facebook);
    setAvatarUrl(sp.avatar || '');
    setNote(sp.note);
    setCropSourceImg(null);
    setCropZoom(1);
    setCropRotation(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      setCropSourceImg(src);
      setCropZoom(1);
      setCropRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const applyCanvasCrop = () => {
    if (!cropSourceImg) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = cropSourceImg;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, 300, 300);
      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(cropZoom, cropZoom);

      const aspect = img.width / img.height;
      let drawW = 300;
      let drawH = 300;
      if (aspect > 1) {
        drawW = 300 * aspect;
      } else {
        drawH = 300 / aspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      setAvatarUrl(croppedBase64);
      setCropSourceImg(null);
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    onSaveProfile({
      id: editingId || undefined,
      nickname: nickname.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      facebook: facebook.trim(),
      avatar: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nickname.trim())}`,
      note: note.trim(),
      hidden: false,
    });

    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center">
              <Contact className="w-5 h-5 mr-2" />
              รายงานสถิติและข้อมูลส่วนตัวเซลล์
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ดูสถิติจำนวนคันย่อย (BK, PS, RS, CC, ได้คุย) แยกตามประเภทและรุ่นย่อยของเซลล์แต่ละคน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-200">
              <label className="text-xs font-bold text-red-800">เลือกปี:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2 py-0.5 rounded border border-red-300 text-xs bg-white font-semibold text-red-800"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-200">
              <label className="text-xs font-bold text-red-800">เลือกเดือน:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-0.5 rounded border border-red-300 text-xs bg-white font-semibold text-red-800"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center text-xs text-slate-600 font-medium cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 select-none">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="mr-1.5 rounded text-red-600 focus:ring-red-500"
              />
              <span>แสดงเซลล์ที่ซ่อนไว้</span>
            </label>

            <button
              onClick={openAddModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่มโปรไฟล์เซลล์</span>
            </button>
          </div>
        </div>

        {/* Profile Cards */}
        {visibleProfiles.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            ยังไม่มีข้อมูลโปรไฟล์เซลล์ในระบบ หรือเซลล์ทั้งหมดถูกซ่อนอยู่
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProfiles.map((sp) => {
              // Calculate stats for this sales agent
              const sCust = appData.customers.filter((c) => {
                if (c.salesAgent !== sp.nickname) return false;
                if (selectedYear && !c.contactDate.startsWith(selectedYear)) return false;
                if (selectedMonth && c.contactDate.substring(5, 7) !== selectedMonth) return false;
                return true;
              });

              const psCount = sCust.filter((c) => c.status === 'PS').length;
              const bkCount = sCust.filter((c) => c.status === 'BK').length;
              const rsCount = sCust.filter((c) => c.status === 'RS').length;
              const ccCount = sCust.filter((c) => c.status === 'CC').length;
              const talkedCount = sCust.filter((c) => c.status === 'ได้คุย').length;
              const totalInbox = sCust.length;

              // Group by category and subcategory
              const catSubGroup: Record<
                string,
                { category: string; subCategory: string; ps: number; bk: number; rs: number; cc: number; talked: number; total: number }
              > = {};

              sCust.forEach((c) => {
                const key = `${c.category}||${c.subCategory}`;
                if (!catSubGroup[key]) {
                  catSubGroup[key] = {
                    category: c.category,
                    subCategory: c.subCategory,
                    ps: 0,
                    bk: 0,
                    rs: 0,
                    cc: 0,
                    talked: 0,
                    total: 0,
                  };
                }
                catSubGroup[key].total += 1;
                if (c.status === 'PS') catSubGroup[key].ps += 1;
                if (c.status === 'BK') catSubGroup[key].bk += 1;
                if (c.status === 'RS') catSubGroup[key].rs += 1;
                if (c.status === 'CC') catSubGroup[key].cc += 1;
                if (c.status === 'ได้คุย') catSubGroup[key].talked += 1;
              });

              const modelRows = Object.values(catSubGroup);

              // Page campaigns for this sales agent
              const sCampaigns = (appData.salesCampaigns || []).filter((sc) => {
                if (sc.salesAgent !== sp.nickname) return false;
                if (selectedYear && !sc.month.startsWith(selectedYear)) return false;
                if (selectedMonth && sc.month !== `${selectedYear}-${selectedMonth}`) return false;
                return true;
              });
              const campBudget = sCampaigns.reduce((sum, sc) => sum + (Number(sc.budget) || 0), 0);
              const campSpend = sCampaigns.reduce((sum, sc) => sum + (Number(sc.spend) || 0), 0);
              const campInbox = sCampaigns.reduce((sum, sc) => sum + (Number(sc.inbox) || 0), 0);
              const campCPI = campInbox > 0 ? campSpend / campInbox : 0;

              return (
                <div
                  key={sp.id}
                  className={`bg-white rounded-2xl border ${
                    sp.hidden ? 'border-dashed border-slate-300 opacity-60' : 'border-slate-200'
                  } shadow-xs overflow-hidden flex flex-col justify-between transition hover:border-slate-300`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={sp.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sp.nickname)}`}
                        alt={sp.nickname}
                        className="w-12 h-12 rounded-full object-cover border-2 border-red-500 shadow-xs"
                      />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <span>{sp.nickname}</span>
                          {sp.hidden && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                              (ซ่อน)
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500">{sp.fullName}</p>
                        {sp.phone && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{sp.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onToggleVisibility(sp.id)}
                        title={sp.hidden ? 'แสดงเซลล์' : 'ซ่อนเซลล์'}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      >
                        {sp.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(sp)}
                        title="แก้ไขโปรไฟล์"
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`คุณแน่ใจว่าต้องการลบโปรไฟล์ของ "${sp.nickname}" หรือไม่?`)) {
                            onDeleteProfile(sp.id);
                          }
                        }}
                        title="ลบโปรไฟล์"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body & Performance Counters */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-600 flex justify-between items-center mb-2">
                        <span>สรุปผลงาน ({selectedYear}{selectedMonth ? `-${selectedMonth}` : ''})</span>
                        <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200 text-[11px]">
                          รวม {totalInbox} เคส
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-1.5">
                          <span className="text-[9px] text-sky-700 font-bold">PS</span>
                          <div className="text-sm font-bold text-sky-800 font-mono">{psCount}</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-1.5">
                          <span className="text-[9px] text-amber-700 font-bold">BK</span>
                          <div className="text-sm font-bold text-amber-800 font-mono">{bkCount}</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5">
                          <span className="text-[9px] text-emerald-700 font-bold">RS</span>
                          <div className="text-sm font-bold text-emerald-800 font-mono">{rsCount}</div>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-1.5">
                          <span className="text-[9px] text-rose-700 font-bold">CC</span>
                          <div className="text-sm font-bold text-rose-800 font-mono">{ccCount}</div>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-1.5">
                          <span className="text-[9px] text-indigo-700 font-bold">ได้คุย</span>
                          <div className="text-sm font-bold text-indigo-800 font-mono">{talkedCount}</div>
                        </div>
                      </div>

                      {/* Detail Breakdown Table */}
                      <div className="mt-3">
                        <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Car className="w-3 h-3 text-red-600" />
                          <span>รายละเอียดตามรุ่นย่อย:</span>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
                          <table className="w-full text-left bg-slate-50 text-[10px]">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                              <tr>
                                <th className="py-1 px-1.5">ประเภท</th>
                                <th className="py-1 px-1.5">รุ่นย่อย</th>
                                <th className="py-1 px-1 text-center">PS</th>
                                <th className="py-1 px-1 text-center">BK</th>
                                <th className="py-1 px-1 text-center">RS</th>
                                <th className="py-1 px-1 text-center">CC</th>
                                <th className="py-1 px-1 text-center">ได้คุย</th>
                                <th className="py-1 px-1 text-center">รวม</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100 font-mono">
                              {modelRows.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="text-center py-3 text-slate-400 font-sans">
                                    ไม่มีข้อมูลลูกค้าในช่วงนี้
                                  </td>
                                </tr>
                              ) : (
                                modelRows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-1 px-1.5 font-sans font-semibold text-slate-700 truncate max-w-[50px]">
                                      {row.category}
                                    </td>
                                    <td className="py-1 px-1.5 font-sans text-slate-600 truncate max-w-[70px]">
                                      {row.subCategory}
                                    </td>
                                    <td className="py-1 px-1 text-center text-sky-700">{row.ps}</td>
                                    <td className="py-1 px-1 text-center text-amber-700">{row.bk}</td>
                                    <td className="py-1 px-1 text-center text-emerald-700 font-bold">{row.rs}</td>
                                    <td className="py-1 px-1 text-center text-rose-700">{row.cc}</td>
                                    <td className="py-1 px-1 text-center text-indigo-700">{row.talked}</td>
                                    <td className="py-1 px-1 text-center font-bold text-slate-900">{row.total}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Branch Page Campaign Summary for this Agent */}
                      {sCampaigns.length > 0 && (
                        <div className="mt-3 bg-red-50/60 border border-red-200/80 rounded-xl p-2.5 text-[11px]">
                          <div className="flex items-center justify-between font-bold text-red-800 mb-1">
                            <span className="flex items-center gap-1">
                              <Megaphone className="w-3 h-3 text-red-600" />
                              <span>แคมเปญเพจสาขา ({sCampaigns.length} แคมเปญ):</span>
                            </span>
                            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-red-200 text-red-700">
                              เฉลี่ย ฿{formatNum(campCPI)}/Inbox
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] mt-1">
                            <div className="bg-white/80 p-1 rounded border border-red-100">
                              <span className="text-slate-500 block text-[9px] font-sans">งบรวม</span>
                              <span className="font-bold text-slate-800">฿{formatNum(campBudget)}</span>
                            </div>
                            <div className="bg-white/80 p-1 rounded border border-red-100">
                              <span className="text-slate-500 block text-[9px] font-sans">จ่ายจริง</span>
                              <span className="font-bold text-slate-800">฿{formatNum(campSpend)}</span>
                            </div>
                            <div className="bg-white/80 p-1 rounded border border-red-100">
                              <span className="text-slate-500 block text-[9px] font-sans">Inbox รวม</span>
                              <span className="font-bold text-sky-800">{campInbox}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {sp.note && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                        &ldquo;{sp.note}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sales Profile Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                <Contact className="w-4 h-4" />
                {editingId ? 'แก้ไขข้อมูลโปรไฟล์เซลล์' : 'เพิ่มโปรไฟล์เซลล์ใหม่'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    ชื่อ - นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="สมชาย ใจดี"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    ชื่อเรียก / ชื่อเล่น (ใช้ในระบบ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="คุณสมชาย"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="081-999-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Facebook / Line</label>
                  <input
                    type="text"
                    placeholder="FB: Sales Somchai"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Avatar Uploader & Cropper */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">รูปโปรไฟล์เซลล์</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full p-1.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />

                  {/* Interactive In-App Canvas Cropper */}
                  {cropSourceImg && (
                    <div className="p-3 bg-slate-900 rounded-xl text-center space-y-2">
                      <div className="relative w-44 h-44 mx-auto border-2 border-red-500 rounded-full overflow-hidden bg-black flex items-center justify-center">
                        <img
                          src={cropSourceImg}
                          alt="To crop"
                          style={{
                            transform: `scale(${cropZoom}) rotate(${cropRotation}deg)`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-white">
                        <button
                          type="button"
                          onClick={() => setCropZoom((z) => Math.min(z + 0.15, 3))}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] flex items-center gap-1"
                        >
                          <ZoomIn className="w-3 h-3" /> ซูมเข้า
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropZoom((z) => Math.max(z - 0.15, 0.5))}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] flex items-center gap-1"
                        >
                          <ZoomOut className="w-3 h-3" /> ซูมออก
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropRotation((r) => (r + 90) % 360)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" /> หมุน
                        </button>
                        <button
                          type="button"
                          onClick={applyCanvasCrop}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> ใช้รูปนี้
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-center text-slate-400 text-[10px]">- หรือใช้ URL รูปภาพ -</div>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono text-[11px]"
                  />
                </div>

                {avatarUrl && (
                  <div className="mt-2 flex items-center space-x-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-10 h-10 rounded-full object-cover border-2 border-red-500 shadow-2xs"
                    />
                    <span className="text-[11px] text-slate-500">ตัวอย่างรูปที่จะใช้แสดงผล</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  placeholder="ระบุรายละเอียดเซลล์ ความเชี่ยวชาญ สาขา..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
