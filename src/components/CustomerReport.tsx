import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppData } from '../types';
import { formatDateTime, getCurrentYearMonth } from '../hooks/useAppData';
import {
  Chart,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  PieChart,
  CheckSquare,
  BarChart2,
  Award,
  Car,
  Layers
} from 'lucide-react';

Chart.register(
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface CustomerReportProps {
  appData: AppData;
  availableYears: string[];
}

export const CustomerReport: React.FC<CustomerReportProps> = ({ appData, availableYears }) => {
  const currentYM = getCurrentYearMonth();
  const currentMonthStr = currentYM.split('-')[1];

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || '2026');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([currentMonthStr]);

  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);

  const monthsList = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return m;
  });

  const toggleMonth = (m: string) => {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    );
  };

  const selectAllMonths = () => {
    setSelectedMonths(monthsList);
  };

  const clearAllMonths = () => {
    setSelectedMonths([]);
  };

  // Filter customers by selected year and checked months
  const filteredCustomers = useMemo(() => {
    return appData.customers.filter((c) => {
      if (!c.contactDate.startsWith(selectedYear)) return false;
      const m = c.contactDate.substring(5, 7);
      if (selectedMonths.length > 0 && !selectedMonths.includes(m)) return false;
      return true;
    });
  }, [appData.customers, selectedYear, selectedMonths]);

  // Filter expenses by selected year and checked months for Total Inbox counter
  const filteredExpenses = useMemo(() => {
    return (appData.expenses || []).filter((e) => {
      if (!e.month || !e.month.startsWith(selectedYear)) return false;
      const m = e.month.substring(5, 7);
      if (selectedMonths.length > 0 && !selectedMonths.includes(m)) return false;
      return true;
    });
  }, [appData.expenses, selectedYear, selectedMonths]);

  const totalExpenseInbox = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.inboxCount) || 0), 0);
  }, [filteredExpenses]);

  // Aggregate stats
  const psCount = filteredCustomers.filter((c) => c.status === 'PS').length;
  const bkCount = filteredCustomers.filter((c) => c.status === 'BK').length;
  const rsCount = filteredCustomers.filter((c) => c.status === 'RS').length;
  const ccCount = filteredCustomers.filter((c) => c.status === 'CC').length;
  const talkedCount = filteredCustomers.filter((c) => c.status === 'ได้คุย').length;

  // Category & SubCategory breakdown
  const catSubSummary = useMemo(() => {
    const map: Record<
      string,
      { category: string; subCategory: string; ps: number; bk: number; rs: number; cc: number; talked: number; total: number }
    > = {};

    filteredCustomers.forEach((c) => {
      const key = `${c.category}||${c.subCategory}`;
      if (!map[key]) {
        map[key] = {
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
      map[key].total += 1;
      if (c.status === 'PS') map[key].ps += 1;
      if (c.status === 'BK') map[key].bk += 1;
      if (c.status === 'RS') map[key].rs += 1;
      if (c.status === 'CC') map[key].cc += 1;
      if (c.status === 'ได้คุย') map[key].talked += 1;
    });

    return Object.values(map).sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredCustomers]);

  // Model ranking
  const modelRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCustomers.forEach((c) => {
      const key = `${c.category} - ${c.subCategory}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredCustomers]);

  // Released / Delivered Customers (RS)
  const rsCustomers = useMemo(() => {
    return filteredCustomers.filter((c) => c.status === 'RS');
  }, [filteredCustomers]);

  // Chart Rendering
  useEffect(() => {
    if (!barChartRef.current || !doughnutChartRef.current) return;

    // Destroy prior instances
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }
    if (doughnutChartInstance.current) {
      doughnutChartInstance.current.destroy();
    }

    // Prepare Bar Chart: Category status stats
    const categoriesList = Object.keys(appData.categories);
    const categoryStats: Record<string, { ps: number; bk: number; rs: number; cc: number; talked: number }> = {};
    categoriesList.forEach((cat) => {
      categoryStats[cat] = { ps: 0, bk: 0, rs: 0, cc: 0, talked: 0 };
    });

    filteredCustomers.forEach((c) => {
      if (!categoryStats[c.category]) {
        categoryStats[c.category] = { ps: 0, bk: 0, rs: 0, cc: 0, talked: 0 };
      }
      if (c.status === 'PS') categoryStats[c.category].ps++;
      if (c.status === 'BK') categoryStats[c.category].bk++;
      if (c.status === 'RS') categoryStats[c.category].rs++;
      if (c.status === 'CC') categoryStats[c.category].cc++;
      if (c.status === 'ได้คุย') categoryStats[c.category].talked++;
    });

    const barCtx = barChartRef.current.getContext('2d');
    if (barCtx) {
      barChartInstance.current = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: categoriesList,
          datasets: [
            { label: 'PS', data: categoriesList.map((c) => categoryStats[c]?.ps || 0), backgroundColor: '#0284c7' },
            { label: 'BK', data: categoriesList.map((c) => categoryStats[c]?.bk || 0), backgroundColor: '#d97706' },
            { label: 'RS', data: categoriesList.map((c) => categoryStats[c]?.rs || 0), backgroundColor: '#059669' },
            { label: 'CC', data: categoriesList.map((c) => categoryStats[c]?.cc || 0), backgroundColor: '#e11d48' },
            { label: 'ได้คุย', data: categoriesList.map((c) => categoryStats[c]?.talked || 0), backgroundColor: '#4f46e5' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      });
    }

    // Prepare Doughnut Chart: Model shares
    const doughnutCtx = doughnutChartRef.current.getContext('2d');
    if (doughnutCtx) {
      const topModels = modelRanking.slice(0, 6);
      const labels = topModels.length > 0 ? topModels.map((m) => m[0]) : ['ไม่มีข้อมูล'];
      const data = topModels.length > 0 ? topModels.map((m) => m[1]) : [1];
      const colors = ['#dc2626', '#2563eb', '#059669', '#d97706', '#8b5cf6', '#ec4899', '#64748b'];

      doughnutChartInstance.current = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors.slice(0, labels.length),
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
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    };
  }, [filteredCustomers, appData.categories, modelRanking]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              รายงานสถิติภาพรวม
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุป Inbox สถิติตามรุ่น ประเภท และเซลล์รายบุคคล
            </p>
          </div>

          <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-200">
            <label className="text-xs font-bold text-red-800">เลือกปี:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1 rounded border border-red-300 text-xs bg-white font-semibold text-red-800"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-Month Filter */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center mb-2.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-red-600" />
              เลือกเดือนที่ต้องการดู (เลือกได้มากกว่า 1 เดือน):
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllMonths}
                className="text-[11px] text-red-700 hover:underline font-semibold"
              >
                เลือกทั้งหมด
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearAllMonths}
                className="text-[11px] text-slate-500 hover:underline"
              >
                ล้างที่เลือก
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 text-xs">
            {monthsList.map((m) => {
              const isChecked = selectedMonths.includes(m);
              return (
                <label
                  key={m}
                  className={`flex items-center justify-center space-x-1 cursor-pointer p-2 rounded-lg border transition font-medium ${
                    isChecked
                      ? 'bg-red-50 text-red-800 border-red-300 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleMonth(m)}
                    className="sr-only"
                  />
                  <span>เดือน {m}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-4 rounded-2xl shadow-xs">
            <div className="text-xs opacity-90">Inbox ทั้งหมด (จากงบ)</div>
            <div className="text-2xl font-bold mt-1 font-mono">{totalExpenseInbox}</div>
          </div>
          <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl">
            <div className="text-xs text-sky-700 font-semibold">สถานะ PS</div>
            <div className="text-2xl font-bold text-sky-800 mt-1 font-mono">{psCount}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <div className="text-xs text-amber-700 font-semibold">สถานะ BK</div>
            <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">{bkCount}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
            <div className="text-xs text-emerald-700 font-semibold">สถานะ RS (ออกรถ)</div>
            <div className="text-2xl font-bold text-emerald-800 mt-1 font-mono">{rsCount}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
            <div className="text-xs text-rose-700 font-semibold">สถานะ CC</div>
            <div className="text-2xl font-bold text-rose-800 mt-1 font-mono">{ccCount}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
            <div className="text-xs text-indigo-700 font-semibold">สถานะ ได้คุย</div>
            <div className="text-2xl font-bold text-indigo-800 mt-1 font-mono">{talkedCount}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <BarChart2 className="w-4 h-4 text-red-600 mr-1.5" />
              สถิติสถานะแยกตามประเภทรถ
            </h3>
            <div className="relative h-64 w-full">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <PieChart className="w-4 h-4 text-red-600 mr-1.5" />
              สัดส่วนความสนใจตามรุ่นย่อย (Inbox)
            </h3>
            <div className="relative h-64 w-full">
              <canvas ref={doughnutChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Category & Model Summary Table */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6">
          <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
            <Layers className="w-4 h-4 text-red-600 mr-1.5" />
            สรุปสถิติจำนวนแยกตามประเภท และ รุ่นย่อย
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200">
              <thead className="bg-red-700 text-white font-semibold">
                <tr>
                  <th className="p-2.5">ประเภท (Category)</th>
                  <th className="p-2.5">รุ่นย่อย (Model)</th>
                  <th className="p-2.5 text-center bg-sky-800 w-16">PS</th>
                  <th className="p-2.5 text-center bg-amber-800 w-16">BK</th>
                  <th className="p-2.5 text-center bg-emerald-800 w-16">RS</th>
                  <th className="p-2.5 text-center bg-rose-800 w-16">CC</th>
                  <th className="p-2.5 text-center bg-indigo-800 w-16">ได้คุย</th>
                  <th className="p-2.5 text-center w-20">รวม Inbox</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {catSubSummary.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400 font-sans">
                      ไม่พบข้อมูลลูกค้าในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                ) : (
                  catSubSummary.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="p-2.5 font-sans font-bold text-slate-800">
                        {row.category}
                      </td>
                      <td className="p-2.5 font-sans text-slate-700">{row.subCategory}</td>
                      <td className="p-2.5 text-center text-sky-700 font-semibold">{row.ps}</td>
                      <td className="p-2.5 text-center text-amber-700 font-semibold">{row.bk}</td>
                      <td className="p-2.5 text-center text-emerald-700 font-bold">{row.rs}</td>
                      <td className="p-2.5 text-center text-rose-700 font-semibold">{row.cc}</td>
                      <td className="p-2.5 text-center text-indigo-700 font-semibold">{row.talked}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900 bg-slate-50">
                        {row.total}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Ranking and Released List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <Award className="w-4 h-4 text-red-600 mr-1.5" />
              จัดอันดับรุ่นที่ลูกค้าสนใจมากที่สุด
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {modelRanking.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">ไม่มีข้อมูล</div>
              ) : (
                modelRanking.map(([model, count], idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs"
                  >
                    <span className="font-medium text-slate-800">
                      <span className="font-bold text-red-600 mr-2 font-mono">#{idx + 1}</span>
                      {model}
                    </span>
                    <span className="bg-red-50 text-red-800 border border-red-200 px-2.5 py-0.5 rounded-full font-bold font-mono">
                      {count} เคส
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <Car className="w-4 h-4 text-emerald-600 mr-1.5" />
              รายชื่อลูกค้าที่ออกรถ (RS - ปิดการขายสำเร็จ)
            </h3>
            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2">ชื่อ Facebook</th>
                    <th className="p-2">รุ่นย่อย</th>
                    <th className="p-2">เซลล์</th>
                    <th className="p-2">วันที่ทัก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rsCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        ยังไม่มีข้อมูลออกรถในช่วงนี้
                      </td>
                    </tr>
                  ) : (
                    rsCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-800">{c.fbName}</td>
                        <td className="p-2 text-slate-600">{c.subCategory}</td>
                        <td className="p-2 text-slate-600">{c.salesAgent}</td>
                        <td className="p-2 text-slate-500 font-mono">{formatDateTime(c.contactDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
