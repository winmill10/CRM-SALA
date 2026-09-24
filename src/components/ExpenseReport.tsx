import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppData } from '../types';
import { formatNum, getCurrentYearMonth } from '../hooks/useAppData';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  TrendingUp,
  Wallet,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  BarChart3,
  PieChart as PieIcon,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface ExpenseReportProps {
  appData: AppData;
  availableYears: string[];
  canExport?: boolean;
}

export const ExpenseReport: React.FC<ExpenseReportProps> = ({
  appData,
  availableYears,
  canExport = true,
}) => {
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year');
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || '2026');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [chartTypeExpense, setChartTypeExpense] = useState<'bar' | 'line'>('bar');
  const [chartTypeDoughnut, setChartTypeDoughnut] = useState<'doughnut' | 'pie'>('doughnut');

  const expChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const expChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);

  const categories = Object.keys(appData.categories);

  // Filter expenses based on mode and category
  const filteredExpenses = useMemo(() => {
    let list = appData.expenses || [];
    if (viewMode === 'year') {
      list = list.filter((e) => e.month && e.month.startsWith(selectedYear));
    } else {
      list = list.filter((e) => e.month === selectedMonth);
    }
    if (categoryFilter) {
      list = list.filter((e) => e.category === categoryFilter);
    }
    return list;
  }, [appData.expenses, viewMode, selectedYear, selectedMonth, categoryFilter]);

  // Aggregate KPI figures
  const { totalBudget, totalSpend, totalOver, totalInbox, netDiff } = useMemo(() => {
    let b = 0;
    let s = 0;
    let over = 0;
    let inb = 0;

    filteredExpenses.forEach((e) => {
      const budget = Number(e.budget) || 0;
      const spend = Number(e.spend) || 0;
      b += budget;
      s += spend;
      inb += Number(e.inboxCount) || 0;
      if (spend > budget) {
        over += spend - budget;
      }
    });

    return {
      totalBudget: b,
      totalSpend: s,
      totalOver: over,
      totalInbox: inb,
      netDiff: b - s,
    };
  }, [filteredExpenses]);

  // Chart Rendering
  useEffect(() => {
    if (!expChartRef.current || !pieChartRef.current) return;

    if (expChartInstance.current) expChartInstance.current.destroy();
    if (pieChartInstance.current) pieChartInstance.current.destroy();

    let labels: string[] = [];
    let budgetData: number[] = [];
    let spendData: number[] = [];

    if (viewMode === 'year') {
      labels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      for (let i = 1; i <= 12; i++) {
        const mStr = `${selectedYear}-${String(i).padStart(2, '0')}`;
        const mItems = filteredExpenses.filter((e) => e.month === mStr);
        budgetData.push(mItems.reduce((sum, item) => sum + (Number(item.budget) || 0), 0));
        spendData.push(mItems.reduce((sum, item) => sum + (Number(item.spend) || 0), 0));
      }
    } else {
      labels = filteredExpenses.map((e) => e.name || e.code);
      budgetData = filteredExpenses.map((e) => Number(e.budget) || 0);
      spendData = filteredExpenses.map((e) => Number(e.spend) || 0);
    }

    const expCtx = expChartRef.current.getContext('2d');
    if (expCtx) {
      expChartInstance.current = new Chart(expCtx, {
        type: chartTypeExpense,
        data: {
          labels,
          datasets: [
            {
              label: 'งบประมาณ',
              data: budgetData,
              backgroundColor: '#3b82f6',
              borderColor: '#3b82f6',
              borderWidth: 2,
              tension: 0.2,
            },
            {
              label: 'จ่ายจริง',
              data: spendData,
              backgroundColor: '#ef4444',
              borderColor: '#ef4444',
              borderWidth: 2,
              tension: 0.2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    // Spend distribution by category
    const catSpendMap: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      catSpendMap[e.category] = (catSpendMap[e.category] || 0) + (Number(e.spend) || 0);
    });

    const pieLabels = Object.keys(catSpendMap).length > 0 ? Object.keys(catSpendMap) : ['ไม่มีข้อมูล'];
    const pieData = Object.keys(catSpendMap).length > 0 ? Object.values(catSpendMap) : [1];
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    const pieCtx = pieChartRef.current.getContext('2d');
    if (pieCtx) {
      pieChartInstance.current = new Chart(pieCtx, {
        type: chartTypeDoughnut,
        data: {
          labels: pieLabels,
          datasets: [
            {
              data: pieData,
              backgroundColor: colors.slice(0, pieLabels.length),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
          },
        },
      });
    }

    return () => {
      if (expChartInstance.current) expChartInstance.current.destroy();
      if (pieChartInstance.current) pieChartInstance.current.destroy();
    };
  }, [filteredExpenses, viewMode, selectedYear, chartTypeExpense, chartTypeDoughnut]);

  const handleExportReport = () => {
    if (filteredExpenses.length === 0) {
      alert('ไม่มีข้อมูลค่าใช้จ่ายสำหรับ Export Excel');
      return;
    }

    // 1. Data Rows
    const campaignRows = filteredExpenses.map((e, idx) => {
      const b = Number(e.budget) || 0;
      const s = Number(e.spend) || 0;
      const inb = Number(e.inboxCount) || 0;
      return {
        'ลำดับ': idx + 1,
        'เดือน': e.month,
        'รหัส': e.code || '-',
        'ชื่อแคมเปญ': e.name,
        'หมวดหมู่': e.category,
        'งบประมาณ (บาท)': b,
        'ใช้จริง (บาท)': s,
        'ส่วนต่าง (บาท)': b - s,
        'งบเกิน (บาท)': s > b ? s - b : 0,
        'จำนวน Inbox': inb,
        'ต้นทุน/Inbox (บาท)': inb > 0 ? Number((s / inb).toFixed(2)) : 0,
      };
    });

    // 2. Category Summary
    const catMap: Record<string, { budget: number; spend: number; inbox: number }> = {};
    filteredExpenses.forEach((e) => {
      if (!catMap[e.category]) {
        catMap[e.category] = { budget: 0, spend: 0, inbox: 0 };
      }
      catMap[e.category].budget += Number(e.budget) || 0;
      catMap[e.category].spend += Number(e.spend) || 0;
      catMap[e.category].inbox += Number(e.inboxCount) || 0;
    });

    const categorySummaryRows = Object.entries(catMap).map(([cat, val]) => ({
      'หมวดหมู่': cat,
      'งบประมาณรวม (บาท)': val.budget,
      'ใช้จริงรวม (บาท)': val.spend,
      'ผลต่างสุทธิ (บาท)': val.budget - val.spend,
      'งบเกิน (บาท)': val.spend > val.budget ? val.spend - val.budget : 0,
      'Inbox รวม': val.inbox,
      'ต้นทุนเฉลี่ย/Inbox (บาท)': val.inbox > 0 ? Number((val.spend / val.inbox).toFixed(2)) : 0,
    }));

    const workbook = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(categorySummaryRows);
    wsSummary['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'สรุปแยกตามหมวดหมู่');

    const wsDetail = XLSX.utils.json_to_sheet(campaignRows);
    wsDetail['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsDetail, 'รายการแคมเปญทั้งหมด');

    const titleMode = viewMode === 'year' ? `Year_${selectedYear}` : `Month_${selectedMonth}`;
    XLSX.writeFile(workbook, `Expense_Report_${titleMode}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              รายงานค่าใช้จ่ายและต้นทุนต่อ Inbox
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กราฟสรุปงบประมาณเปรียบเทียบค่าใช้จ่ายจริง สถิติงบเกิน และประสิทธิภาพแคมเปญ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canExport && (
              <button
                type="button"
                onClick={handleExportReport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                title="ดาวน์โหลดรายงานสรุปเป็น Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export สรุปงบ (Excel)</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-200">
              <label className="text-xs font-bold text-red-800">รูปแบบ:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'year' | 'month')}
                className="px-2 py-0.5 rounded border border-red-300 text-xs bg-white font-semibold text-red-800"
              >
                <option value="year">ดูแบบรายปี</option>
                <option value="month">ดูแบบรายเดือน</option>
              </select>
            </div>

            {viewMode === 'year' ? (
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
            ) : (
              <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-200">
                <label className="text-xs font-bold text-red-800">เลือกเดือน:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-0.5 rounded border border-red-300 text-xs bg-white font-semibold text-red-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* View Options & Chart Type Controls */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              กรองเฉพาะประเภทแคมเปญ
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">ทุกประเภท</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              เลือกรูปแบบกราฟเปรียบเทียบงบ
            </label>
            <select
              value={chartTypeExpense}
              onChange={(e) => setChartTypeExpense(e.target.value as 'bar' | 'line')}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="bar">กราฟแท่ง (Bar Chart)</option>
              <option value="line">กราฟเส้น (Line Chart)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <PieIcon className="w-3.5 h-3.5 text-slate-400" />
              เลือกรูปแบบกราฟสัดส่วนงบใช้จริง
            </label>
            <select
              value={chartTypeDoughnut}
              onChange={(e) => setChartTypeDoughnut(e.target.value as 'doughnut' | 'pie')}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="doughnut">กราฟวงแหวน (Doughnut)</option>
              <option value="pie">กราฟวงกลม (Pie)</option>
            </select>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>{viewMode === 'year' ? 'งบประมาณรวมทั้งปี' : 'งบประมาณรอบเดือน'}</span>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
              ฿{formatNum(totalBudget)}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>งบที่ใช้จริงรวม</span>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
              ฿{formatNum(totalSpend)}
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              netDiff >= 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="text-xs font-semibold flex items-center justify-between">
              <span className={netDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {netDiff >= 0 ? 'งบคงเหลือรวม' : 'ส่วนต่างงบเกินสุทธิ'}
              </span>
              {netDiff >= 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div
              className={`text-2xl font-bold mt-1 font-mono ${
                netDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              ฿{formatNum(Math.abs(netDiff))}
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
            <div className="text-xs text-rose-700 font-semibold flex items-center justify-between">
              <span>ยอดงบที่เกินรวม</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
              ฿{formatNum(totalOver)}
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl">
            <div className="text-xs text-sky-700 font-semibold flex items-center justify-between">
              <span>Inbox รวมทั้งหมด</span>
              <MessageSquare className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-700 mt-1 font-mono">
              {totalInbox}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 text-red-600 mr-1.5" />
              เปรียบเทียบงบประมาณ กับ งบที่ใช้จริง (บาท)
            </h3>
            <div className="relative h-64 w-full">
              <canvas ref={expChartRef}></canvas>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <PieIcon className="w-4 h-4 text-red-600 mr-1.5" />
              สัดส่วนค่าใช้จ่ายจริง แยกตามประเภทแคมเปญ
            </h3>
            <div className="relative h-64 w-full">
              <canvas ref={pieChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Expense Summary Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-red-700 text-white font-semibold">
              <tr>
                <th className="p-3">{viewMode === 'year' ? 'เดือน' : 'ชื่อแคมเปญ'}</th>
                <th className="p-3 text-right">งบประมาณรวม</th>
                <th className="p-3 text-right">งบที่ใช้จริงรวม</th>
                <th className="p-3 text-right">ผลต่างงบ</th>
                <th className="p-3 text-right text-rose-200">จำนวนที่ใช้เกิน</th>
                <th className="p-3 text-center">สถานะ</th>
                <th className="p-3 text-center">Inbox รวม</th>
                <th className="p-3 text-right">ต้นทุนเฉลี่ย/Inbox</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {viewMode === 'year'
                ? Array.from({ length: 12 }, (_, i) => {
                    const mStr = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
                    const mItems = filteredExpenses.filter((e) => e.month === mStr);
                    const b = mItems.reduce((sum, item) => sum + (Number(item.budget) || 0), 0);
                    const s = mItems.reduce((sum, item) => sum + (Number(item.spend) || 0), 0);
                    const inbox = mItems.reduce((sum, item) => sum + (Number(item.inboxCount) || 0), 0);
                    const diff = b - s;
                    const over = s > b ? s - b : 0;
                    const cpi = inbox > 0 ? s / inbox : 0;

                    return (
                      <tr key={mStr} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="p-3 font-semibold text-slate-700">{mStr}</td>
                        <td className="p-3 text-right">฿{formatNum(b)}</td>
                        <td className="p-3 text-right font-semibold text-slate-800">฿{formatNum(s)}</td>
                        <td className={`p-3 text-right font-bold ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ฿{formatNum(Math.abs(diff))}
                        </td>
                        <td className="p-3 text-right text-rose-600 font-bold">฿{formatNum(over)}</td>
                        <td className="p-3 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s > b
                                ? 'bg-rose-50 text-rose-700 border border-rose-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            }`}
                          >
                            {s > b ? 'งบเกิน' : 'ปกติ'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{inbox}</td>
                        <td className="p-3 text-right font-bold text-red-700">฿{formatNum(cpi)}</td>
                      </tr>
                    );
                  })
                : filteredExpenses.map((e) => {
                    const b = Number(e.budget) || 0;
                    const s = Number(e.spend) || 0;
                    const inbox = Number(e.inboxCount) || 0;
                    const diff = b - s;
                    const over = s > b ? s - b : 0;
                    const cpi = inbox > 0 ? s / inbox : 0;

                    return (
                      <tr key={e.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="p-3 font-semibold text-slate-700 font-sans">{e.name}</td>
                        <td className="p-3 text-right">฿{formatNum(b)}</td>
                        <td className="p-3 text-right font-semibold text-slate-800">฿{formatNum(s)}</td>
                        <td className={`p-3 text-right font-bold ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ฿{formatNum(Math.abs(diff))}
                        </td>
                        <td className="p-3 text-right text-rose-600 font-bold">฿{formatNum(over)}</td>
                        <td className="p-3 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s > b
                                ? 'bg-rose-50 text-rose-700 border border-rose-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            }`}
                          >
                            {s > b ? 'งบเกิน' : 'ปกติ'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{inbox}</td>
                        <td className="p-3 text-right font-bold text-red-700">฿{formatNum(cpi)}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
