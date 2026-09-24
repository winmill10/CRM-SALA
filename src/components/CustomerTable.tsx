import React, { useState, useMemo } from 'react';
import { AppData, Customer } from '../types';
import { formatDateTime, getStatusBadgeStyle } from '../hooks/useAppData';
import * as XLSX from 'xlsx';
import {
  Search,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
  Save,
  FilterX
} from 'lucide-react';

interface CustomerTableProps {
  appData: AppData;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: number) => void;
  onViewImage: (src: string) => void;
  availableYears: string[];
  canExport?: boolean;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  appData,
  onUpdateCustomer,
  onDeleteCustomer,
  onViewImage,
  availableYears,
  canExport = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterSales, setFilterSales] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');

  // Expand status history per customer id
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  // Edit Modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editContactDate, setEditContactDate] = useState('');
  const [editFbName, setEditFbName] = useState('');
  const [editSalesAgent, setEditSalesAgent] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editImage, setEditImage] = useState('');

  const toggleHistory = (id: number) => {
    setExpandedHistory((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Distinct subcategories for filter
  const allSubCategories = useMemo(() => {
    const list: string[] = [];
    Object.values(appData.categories).forEach((subs) => list.push(...subs));
    return Array.from(new Set(list));
  }, [appData.categories]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return appData.customers.filter((c) => {
      if (filterYear && !c.contactDate.startsWith(filterYear)) return false;
      if (filterMonth && !c.contactDate.startsWith(filterMonth)) return false;
      if (filterSales && c.salesAgent !== filterSales) return false;
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterSubCategory && c.subCategory !== filterSubCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchName = (c.fbName || '').toLowerCase().includes(q);
        const matchFollow = (c.followUpResult || '').toLowerCase().includes(q);
        if (!matchPhone && !matchName && !matchFollow) return false;
      }
      return true;
    });
  }, [
    appData.customers,
    filterYear,
    filterMonth,
    filterSales,
    filterCategory,
    filterSubCategory,
    searchQuery,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterYear('');
    setFilterMonth('');
    setFilterSales('');
    setFilterCategory('');
    setFilterSubCategory('');
  };

  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      alert('ไม่มีข้อมูลสำหรับ Export Excel');
      return;
    }

    const rows = filteredCustomers.map((c) => ({
      'วันที่ทัก': c.contactDate,
      'วันเวลาบันทึก': c.entryDateTime,
      'ชื่อ Facebook': c.fbName,
      'เบอร์โทรศัพท์': c.phone || '-',
      'เซลล์ผู้ดูแล': c.salesAgent,
      'ประเภทรถ': c.category,
      'รุ่นย่อย': c.subCategory,
      'สถานะปัจจุบัน': c.status,
      'ผลการติดตาม': c.followUpResult || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, `Customer_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditContactDate(customer.contactDate);
    setEditFbName(customer.fbName);
    setEditSalesAgent(customer.salesAgent);
    setEditPhone(customer.phone || '');
    setEditCategory(customer.category);
    setEditSubCategory(customer.subCategory);
    setEditStatus(customer.status);
    setEditFollowUp(customer.followUpResult || '');
    setEditImage(customer.image || '');
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
  };

  const handleEditCategoryChange = (newCat: string) => {
    setEditCategory(newCat);
    const subs = appData.categories[newCat] || [];
    setEditSubCategory(subs[0] || '');
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setEditImage(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    onUpdateCustomer({
      ...editingCustomer,
      contactDate: editContactDate,
      fbName: editFbName.trim(),
      salesAgent: editSalesAgent,
      phone: editPhone.trim(),
      category: editCategory,
      subCategory: editSubCategory,
      status: editStatus,
      followUpResult: editFollowUp.trim(),
      image: editImage,
    });

    closeEditModal();
  };

  const getCategoryColor = (cat: string) => {
    return appData.categoryColors[cat] || '#64748b';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
        {/* Header & Legend */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-3 mb-4 gap-3">
          <div>
            <h2 className="text-lg font-bold text-red-700 flex items-center">
              ตารางข้อมูลลูกค้าทั้งหมด
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span>สัญลักษณ์สถานะ:</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-300">PS ติดตาม</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300">BK จองรถ</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">RS ออกรถ</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">CC ยกเลิก</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-300">ได้คุย</span>
            </div>
          </div>
          {canExport && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ค้นหา เบอร์โทรศัพท์, ชื่อ Facebook หรือ ผลการติดตาม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">เลือกปีที่ทัก</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-red-700"
              >
                <option value="">ทุกปี</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">เดือนที่ทัก</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">เซลล์ดูแล</label>
              <select
                value={filterSales}
                onChange={(e) => setFilterSales(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
              >
                <option value="">ทั้งหมด</option>
                {appData.salesAgents.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">ประเภทรุ่น</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
              >
                <option value="">ทั้งหมด</option>
                {Object.keys(appData.categories).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">รุ่นที่สนใจ</label>
              <select
                value={filterSubCategory}
                onChange={(e) => setFilterSubCategory(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
              >
                <option value="">ทั้งหมด</option>
                {allSubCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={clearFilters}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center justify-center gap-1 transition"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>ล้างตัวกรอง</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-red-700 text-white font-semibold tracking-wide">
              <tr>
                <th className="py-2.5 px-3 w-14 text-center border-r border-red-600">รูป</th>
                <th className="py-2.5 px-3 w-32 border-r border-red-600">วันที่ทัก / คีย์</th>
                <th className="py-2.5 px-3 w-36 border-r border-red-600">ชื่อ Facebook</th>
                <th className="py-2.5 px-3 w-28 border-r border-red-600">เบอร์โทร</th>
                <th className="py-2.5 px-3 w-28 border-r border-red-600">เซลล์ดูแล</th>
                <th className="py-2.5 px-3 w-36 border-r border-red-600">ประเภท / รุ่นย่อย</th>
                <th className="py-2.5 px-3 w-56 border-r border-red-600">สถานะปัจจุบัน & ประวัติ</th>
                <th className="py-2.5 px-3 border-r border-red-600">ผลการติดตาม / บันทึก</th>
                <th className="py-2.5 px-2 text-center w-20">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">
                    ไม่พบข้อมูลลูกค้าที่ตรงตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const catColor = getCategoryColor(c.category);
                  const isExpanded = !!expandedHistory[c.id];
                  const hasHistory = c.statusHistory && c.statusHistory.length > 1;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
                      {/* Image Thumbnail */}
                      <td className="p-2 align-top text-center border-r border-slate-100">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt="Customer"
                            onClick={() => onViewImage(c.image || '')}
                            title="คลิกเพื่อดูรูปภาพเต็ม"
                            className="w-10 h-10 rounded-lg object-cover cursor-pointer border border-slate-200 hover:scale-105 transition mx-auto"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Contact & Entry Dates */}
                      <td className="p-2.5 align-top border-r border-slate-100">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-red-600 shrink-0" />
                          <span>{formatDateTime(c.contactDate)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>คีย์: {formatDateTime(c.entryDateTime)}</span>
                        </div>
                      </td>

                      {/* Facebook Name */}
                      <td className="p-2.5 align-top border-r border-slate-100 font-bold text-slate-900">
                        {c.fbName}
                      </td>

                      {/* Phone */}
                      <td className="p-2.5 align-top border-r border-slate-100 font-mono">
                        {c.phone || '-'}
                      </td>

                      {/* Sales Agent */}
                      <td className="p-2.5 align-top border-r border-slate-100 font-medium text-slate-700">
                        {c.salesAgent}
                      </td>

                      {/* Category & SubCategory */}
                      <td className="p-2.5 align-top border-r border-slate-100">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold inline-block"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                            border: `1px solid ${catColor}40`,
                          }}
                        >
                          {c.category}
                        </span>
                        <div className="text-[11px] text-slate-600 font-semibold mt-1">
                          {c.subCategory}
                        </div>
                      </td>

                      {/* Status & Timeline */}
                      <td className="p-2.5 align-top border-r border-slate-100">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold inline-block shadow-2xs ${getStatusBadgeStyle(c.status)}`}>
                            {c.status}
                          </span>

                          {c.statusHistory && c.statusHistory.length > 0 && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              อัปเดต: {formatDateTime(c.statusHistory[c.statusHistory.length - 1].date)}
                            </div>
                          )}

                          {hasHistory && (
                            <div className="mt-1.5">
                              <button
                                type="button"
                                onClick={() => toggleHistory(c.id)}
                                className="text-[10px] text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition"
                              >
                                <span>{isExpanded ? 'ซ่อนประวัติ' : `ประวัติ (${c.statusHistory.length} ครั้ง)`}</span>
                                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                              </button>

                              {isExpanded && (
                                <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                                  <div className="font-bold text-[10px] text-slate-600 border-b border-slate-200 pb-1 mb-1">
                                    ไทม์ไลน์สถานะทั้งหมด:
                                  </div>
                                  {c.statusHistory.map((h, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[10px] py-0.5 border-b border-slate-100 last:border-0">
                                      <span className={`px-1.5 py-0.2 rounded font-bold ${getStatusBadgeStyle(h.status)}`}>
                                        {h.status}
                                      </span>
                                      <span className="text-slate-500 font-mono">{formatDateTime(h.date)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Follow-up Note */}
                      <td className="p-2.5 align-top border-r border-slate-100 text-slate-700">
                        {c.followUpResult || '-'}
                      </td>

                      {/* Actions */}
                      <td className="p-2.5 align-top text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(c)}
                            title="แก้ไขข้อมูลลูกค้า"
                            className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`คุณแน่ใจว่าต้องการลบข้อมูลของ "${c.fbName}" หรือไม่?`)) {
                                onDeleteCustomer(c.id);
                              }
                            }}
                            title="ลบข้อมูลลูกค้า"
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

        <div className="mt-3 text-xs text-slate-500 flex justify-between items-center">
          <span>แสดง {filteredCustomers.length} จากทั้งหมด {appData.customers.length} รายการ</span>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                แก้ไขข้อมูลลูกค้า: {editingCustomer.fbName}
              </h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    วันที่ทัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editContactDate}
                    onChange={(e) => setEditContactDate(e.target.value)}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    ชื่อ Facebook <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFbName}
                    onChange={(e) => setEditFbName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    เซลล์ดูแล <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editSalesAgent}
                    onChange={(e) => setEditSalesAgent(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white focus:ring-1 focus:ring-red-500"
                  >
                    {appData.salesAgents.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    ประเภท <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editCategory}
                    onChange={(e) => handleEditCategoryChange(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white focus:ring-1 focus:ring-red-500"
                  >
                    {Object.keys(appData.categories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    รุ่นย่อย <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white focus:ring-1 focus:ring-red-500"
                  >
                    {(appData.categories[editCategory] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  สถานะ <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white font-bold text-red-700 focus:ring-1 focus:ring-red-500"
                >
                  {appData.statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">เปลี่ยน/อัปเดตรูปภาพ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="w-full p-1.5 border rounded-xl bg-slate-50 text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
                {editImage && (
                  <div className="mt-2 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <img src={editImage} alt="Edit preview" className="w-12 h-12 rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => setEditImage('')}
                      className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      ลบรูปภาพ
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">ผลการติดตาม / บันทึกการพูดคุย</label>
                <textarea
                  rows={3}
                  value={editFollowUp}
                  onChange={(e) => setEditFollowUp(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-red-500 bg-white"
                  placeholder="รายละเอียดการติดตามลูกค้า..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
