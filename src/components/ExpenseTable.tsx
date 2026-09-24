import React, { useState, useMemo } from 'react';
import { AppData, Expense } from '../types';
import { formatNum, getCurrentYearMonth } from '../hooks/useAppData';
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  ExternalLink
} from 'lucide-react';

interface ExpenseTableProps {
  appData: AppData;
  onSaveExpense: (expense: Omit<Expense, 'id'> & { id?: number }) => void;
  onDeleteExpense: (id: number) => void;
  availableYears: string[];
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  appData,
  onSaveExpense,
  onDeleteExpense,
  availableYears,
}) => {
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState<string | number>('');
  const [spend, setSpend] = useState<string | number>('');
  const [inboxCount, setInboxCount] = useState<string | number>('');
  const [link, setLink] = useState('');

  const categories = Object.keys(appData.categories);

  const filteredExpenses = useMemo(() => {
    return (appData.expenses || []).filter((e) => {
      if (filterYear && !e.month.startsWith(filterYear)) return false;
      if (filterMonth && e.month !== filterMonth) return false;
      return true;
    });
  }, [appData.expenses, filterYear, filterMonth]);

  const openAddModal = () => {
    setEditId(null);
    setMonth(getCurrentYearMonth());
    setCode(`CMP-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-0${(appData.expenses.length + 1)}`);
    setName('');
    setCategory(categories[0] || '');
    setBudget('');
    setSpend('');
    setInboxCount('');
    setLink('');
    setIsModalOpen(true);
  };

  const openEditModal = (e: Expense) => {
    setEditId(e.id);
    setMonth(e.month);
    setCode(e.code);
    setName(e.name);
    setCategory(e.category);
    setBudget(e.budget);
    setSpend(e.spend);
    setInboxCount(e.inboxCount);
    setLink(e.link || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim() || !category) return;

    onSaveExpense({
      id: editId || undefined,
      month,
      code: code.trim(),
      name: name.trim(),
      category,
      budget: parseFloat(String(budget)) || 0,
      spend: parseFloat(String(spend)) || 0,
      inboxCount: parseInt(String(inboxCount), 10) || 0,
      link: link.trim(),
    });

    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              บันทึกและจัดการงบประมาณรายเดือน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกงบแคมเปญ คำนวณต้นทุนต่อ Inbox และตรวจสอบงบเกิน
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มแคมเปญใหม่</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
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

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">เลือกเดือน:</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
            {filterMonth && (
              <button
                type="button"
                onClick={() => setFilterMonth('')}
                className="text-slate-500 hover:text-red-700 underline text-xs"
              >
                ดูทุกเดือนในปีนี้
              </button>
            )}
          </div>
        </div>

        {/* Expense Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-red-700 text-white font-semibold">
              <tr>
                <th className="p-3">เดือน</th>
                <th className="p-3">รหัส</th>
                <th className="p-3">ชื่อแคมเปญ</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3 text-right">งบประมาณ</th>
                <th className="p-3 text-right">งบที่ใช้จริง</th>
                <th className="p-3 text-right">ส่วนต่าง / ผลต่าง</th>
                <th className="p-3 text-center">สถานะงบ</th>
                <th className="p-3 text-center">Inbox</th>
                <th className="p-3 text-right">ต้นทุน/Inbox</th>
                <th className="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-400 font-sans">
                    ยังไม่มีข้อมูลรายการงบประมาณ
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => {
                  const budgetVal = Number(e.budget) || 0;
                  const spendVal = Number(e.spend) || 0;
                  const diff = budgetVal - spendVal;
                  const inbox = Number(e.inboxCount) || 0;
                  const cpi = inbox > 0 ? spendVal / inbox : 0;
                  const isOver = spendVal > budgetVal;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="p-3 font-semibold text-slate-700">{e.month}</td>
                      <td className="p-3 text-slate-500">{e.code}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{e.name}</span>
                          {e.link && (
                            <a
                              href={e.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                              title="เปิดลิงก์แคมเปญ"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-sans">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-3 text-right">฿{formatNum(budgetVal)}</td>
                      <td className="p-3 text-right font-semibold text-slate-800">฿{formatNum(spendVal)}</td>
                      <td className={`p-3 text-right font-bold ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ฿{formatNum(Math.abs(diff))} {isOver ? '(เกิน)' : '(เหลือ)'}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOver
                              ? 'bg-rose-50 text-rose-700 border border-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          }`}
                        >
                          {isOver ? 'งบเกิน' : 'ปกติ'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">{inbox}</td>
                      <td className="p-3 text-right font-bold text-red-700">฿{formatNum(cpi)}</td>
                      <td className="p-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(e)}
                            title="แก้ไขแคมเปญ"
                            className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('ต้องการลบรายการงบประมาณนี้ใช่หรือไม่?')) {
                                onDeleteExpense(e.id);
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

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                {editId ? 'แก้ไขข้อมูลแคมเปญ' : 'เพิ่มแคมเปญใหม่'}
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
                    รหัสแคมเปญ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  ชื่อแคมเปญ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โฆษณา MU-X ดอกเบี้ยพิเศษ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                    value={inboxCount}
                    onChange={(e) => setInboxCount(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    งบประมาณตั้งไว้ (บาท) <span className="text-red-500">*</span>
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
                    งบที่ใช้จริง (บาท) <span className="text-red-500">*</span>
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

              <div>
                <label className="block font-semibold mb-1 text-slate-700">ลิงค์แคมเปญ (URL ถ้ามี)</label>
                <input
                  type="url"
                  placeholder="https://facebook.com/ads/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-red-500 font-mono text-[11px]"
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
