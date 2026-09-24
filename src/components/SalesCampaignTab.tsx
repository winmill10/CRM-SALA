import React, { useState, useMemo } from 'react';
import { AppData, SalesCampaign } from '../types';
import { formatNum, getCurrentYearMonth } from '../hooks/useAppData';
import * as XLSX from 'xlsx';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Wallet,
  CreditCard,
  MessageSquare,
  TrendingUp,
  X,
  Save,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

interface SalesCampaignTabProps {
  appData: AppData;
  onSaveCampaign: (campaign: Omit<SalesCampaign, 'id'> & { id?: number }) => void;
  onDeleteCampaign: (id: number) => void;
  availableYears: string[];
}

export const SalesCampaignTab: React.FC<SalesCampaignTabProps> = ({
  appData,
  onSaveCampaign,
  onDeleteCampaign,
  availableYears,
}) => {
  const [filterSales, setFilterSales] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [salesAgent, setSalesAgent] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState<string | number>('');
  const [spend, setSpend] = useState<string | number>('');
  const [inbox, setInbox] = useState<string | number>('');

  const categories = Object.keys(appData.categories);

  const filteredCampaigns = useMemo(() => {
    return (appData.salesCampaigns || []).filter((sc) => {
      if (filterSales && sc.salesAgent !== filterSales) return false;
      if (filterYear && !sc.month.startsWith(filterYear)) return false;
      return true;
    });
  }, [appData.salesCampaigns, filterSales, filterYear]);

  // Aggregate KPIs
  const { totalBudget, totalSpend, totalInbox, avgCPI } = useMemo(() => {
    let b = 0;
    let s = 0;
    let i = 0;
    filteredCampaigns.forEach((sc) => {
      b += Number(sc.budget) || 0;
      s += Number(sc.spend) || 0;
      i += Number(sc.inbox) || 0;
    });
    const cpi = i > 0 ? s / i : 0;
    return {
      totalBudget: b,
      totalSpend: s,
      totalInbox: i,
      avgCPI: cpi,
    };
  }, [filteredCampaigns]);

  const openAddModal = () => {
    setEditId(null);
    setMonth(getCurrentYearMonth());
    setSalesAgent(appData.salesAgents[0] || '');
    setCampaignName('');
    setCategory(categories[0] || '');
    setBudget('');
    setSpend('');
    setInbox('');
    setIsModalOpen(true);
  };

  const openEditModal = (sc: SalesCampaign) => {
    setEditId(sc.id);
    setMonth(sc.month);
    setSalesAgent(sc.salesAgent);
    setCampaignName(sc.campaignName);
    setCategory(sc.category);
    setBudget(sc.budget);
    setSpend(sc.spend);
    setInbox(sc.inbox);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesAgent || !campaignName.trim()) return;

    onSaveCampaign({
      id: editId || undefined,
      month,
      salesAgent,
      campaignName: campaignName.trim(),
      category,
      budget: parseFloat(String(budget)) || 0,
      spend: parseFloat(String(spend)) || 0,
      inbox: parseInt(String(inbox), 10) || 0,
    });

    closeModal();
  };

  const handleExportExcel = () => {
    if (filteredCampaigns.length === 0) {
      alert('ไม่มีข้อมูลแคมเปญเพจเซลล์สำหรับ Export Excel');
      return;
    }

    const rows = filteredCampaigns.map((sc, idx) => {
      const b = Number(sc.budget) || 0;
      const s = Number(sc.spend) || 0;
      const inb = Number(sc.inbox) || 0;
      const cpi = inb > 0 ? s / inb : 0;
      return {
        'ลำดับ': idx + 1,
        'เดือน': sc.month,
        'เซลล์': sc.salesAgent,
        'ชื่อแคมเปญ': sc.campaignName,
        'ประเภท': sc.category,
        'งบประมาณ (บาท)': b,
        'ยอดใช้จริง (บาท)': s,
        'ผลต่าง (บาท)': b - s,
        'Inbox (ข้อความ)': inb,
        'ต้นทุนต่อ Inbox (บาท)': Number(cpi.toFixed(2)),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 12 }, // เดือน
      { wch: 16 }, // เซลล์
      { wch: 30 }, // ชื่อแคมเปญ
      { wch: 18 }, // ประเภท
      { wch: 16 }, // งบ
      { wch: 16 }, // จ่ายจริง
      { wch: 16 }, // ผลต่าง
      { wch: 16 }, // Inbox
      { wch: 20 }, // CPI
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales_Campaigns');
    XLSX.writeFile(workbook, `Sales_Campaigns_${filterSales || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center">
              <Megaphone className="w-5 h-5 mr-2" />
              บันทึกและสรุปข้อมูลแคมเปญเพจส่วนตัวเซลล์
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กรอกข้อมูล: ชื่อแคมเปญ, ประเภท, งบ, จำนวนเงินที่จ่าย, inbox และสรุปสถิติแยกตามเซลล์
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
              title="ดาวน์โหลดข้อมูลแคมเปญเพจเซลล์เป็น Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel ({filteredCampaigns.length})</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มแคมเปญเพจเซลล์</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              เลือกเซลล์:
            </label>
            <select
              value={filterSales}
              onChange={(e) => setFilterSales(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-red-700"
            >
              <option value="">ทุกเซลล์</option>
              {appData.salesAgents.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">เลือกปี:</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-red-700"
            >
              <option value="">ทุกปี</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>งบประมาณรวม (เพจเซลล์)</span>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
              ฿{formatNum(totalBudget)}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>ยอดจ่ายจริงรวม (เพจเซลล์)</span>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
              ฿{formatNum(totalSpend)}
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl">
            <div className="text-xs text-sky-700 font-semibold flex items-center justify-between">
              <span>Inbox รวม (เพจเซลล์)</span>
              <MessageSquare className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-sky-800 mt-1 font-mono">
              {totalInbox}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
            <div className="text-xs text-emerald-700 font-semibold flex items-center justify-between">
              <span>ต้นทุนเฉลี่ยต่อ Inbox</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              ฿{formatNum(avgCPI)}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-red-700 text-white font-semibold">
              <tr>
                <th className="p-3">เดือน</th>
                <th className="p-3">เซลล์เจ้าของเพจ</th>
                <th className="p-3">ชื่อแคมเปญ</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3 text-right">งบประมาณ</th>
                <th className="p-3 text-right">จำนวนเงินที่จ่าย</th>
                <th className="p-3 text-center">Inbox</th>
                <th className="p-3 text-right">ต้นทุน/Inbox</th>
                <th className="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    ยังไม่มีข้อมูลแคมเปญเพจส่วนตัวเซลล์
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((sc) => {
                  const b = Number(sc.budget) || 0;
                  const s = Number(sc.spend) || 0;
                  const inb = Number(sc.inbox) || 0;
                  const cpi = inb > 0 ? s / inb : 0;

                  return (
                    <tr key={sc.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="p-3 font-semibold text-slate-700 font-mono">{sc.month}</td>
                      <td className="p-3 font-bold text-red-700">{sc.salesAgent}</td>
                      <td className="p-3 font-semibold text-slate-900">{sc.campaignName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[11px] font-bold border border-red-200">
                          {sc.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">฿{formatNum(b)}</td>
                      <td className="p-3 text-right font-semibold text-slate-700 font-mono">฿{formatNum(s)}</td>
                      <td className="p-3 text-center font-bold text-slate-800 font-mono">{inb}</td>
                      <td className="p-3 text-right font-bold text-red-700 font-mono">฿{formatNum(cpi)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(sc)}
                            title="แก้ไขแคมเปญ"
                            className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('คุณต้องการลบรายการแคมเปญเพจเซลล์นี้หรือไม่?')) {
                                onDeleteCampaign(sc.id);
                              }
                            }}
                            title="ลบแคมเปญ"
                            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" />
                {editId ? 'แก้ไขแคมเปญเพจส่วนตัวเซลล์' : 'เพิ่มแคมเปญเพจส่วนตัวเซลล์'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    เดือน (YYYY-MM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    เซลล์เจ้าของเพจ <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={salesAgent}
                    onChange={(e) => setSalesAgent(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-1 focus:ring-red-500"
                  >
                    {appData.salesAgents.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  ชื่อแคมเปญ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ยิงแอดตามหาลูกค้า MU-X ดอกเบี้ย 0.99%"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    ประเภท <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-1 focus:ring-red-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    จำนวน Inbox <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={inbox}
                    onChange={(e) => setInbox(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    งบประมาณ (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    จำนวนเงินที่จ่ายจริง (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={spend}
                    onChange={(e) => setSpend(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
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
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
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
