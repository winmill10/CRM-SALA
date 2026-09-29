import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppData, SalesCampaign, Customer } from '../types';
import { formatDateTime, formatNum, getCurrentYearMonth } from '../hooks/useAppData';
import * as XLSX from 'xlsx';
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
  Layers,
  Megaphone,
  Wallet,
  CreditCard,
  MessageSquare,
  UserCheck,
  BookmarkCheck,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  ArrowRight
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
  const [currentYearStr, currentMonthNum] = currentYM.split('-');

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || currentYearStr);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([currentMonthNum]);

  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);

  const monthsList = Array.from({ length: 12 }, (_, i) => {
    return String(i + 1).padStart(2, '0');
  });

  const monthNames: Record<string, string> = {
    '01': 'ม.ค.',
    '02': 'ก.พ.',
    '03': 'มี.ค.',
    '04': 'เม.ย.',
    '05': 'พ.ค.',
    '06': 'มิ.ย.',
    '07': 'ก.ค.',
    '08': 'ส.ค.',
    '09': 'ก.ย.',
    '10': 'ต.ค.',
    '11': 'พ.ย.',
    '12': 'ธ.ค.',
  };

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

  // 1. ดึงข้อมูลจาก "แคมเปญเพจสาขา" (Sales Campaigns) ตามปีและเดือนที่เลือก
  const filteredCampaigns = useMemo(() => {
    return (appData.salesCampaigns || []).filter((sc) => {
      if (!sc.month.startsWith(selectedYear)) return false;
      const m = sc.month.substring(5, 7);
      if (selectedMonths.length > 0 && !selectedMonths.includes(m)) return false;
      return true;
    });
  }, [appData.salesCampaigns, selectedYear, selectedMonths]);

  // สรุปยอดจากแคมเปญเพจสาขา
  const {
    campaignBudget,
    campaignSpend,
    campaignDiff,
    campaignInbox,
    campaignPS,
    campaignBK,
    costPerInbox,
    costPerPS,
    costPerBK,
    campaignConvPS,
    campaignConvBK,
  } = useMemo(() => {
    let b = 0;
    let s = 0;
    let inb = 0;
    let p = 0;
    let k = 0;

    filteredCampaigns.forEach((sc) => {
      b += Number(sc.budget) || 0;
      s += Number(sc.spend) || 0;
      inb += Number(sc.inbox) || 0;
      p += Number(sc.ps) || 0;
      k += Number(sc.bk) || 0;
    });

    const diff = b - s;
    const cpi = inb > 0 ? s / inb : 0;
    const cpps = p > 0 ? s / p : 0;
    const cpbk = k > 0 ? s / k : 0;
    const convPS = inb > 0 ? (p / inb) * 100 : 0;
    const convBK = inb > 0 ? (k / inb) * 100 : 0;

    return {
      campaignBudget: b,
      campaignSpend: s,
      campaignDiff: diff,
      campaignInbox: inb,
      campaignPS: p,
      campaignBK: k,
      costPerInbox: cpi,
      costPerPS: cpps,
      costPerBK: cpbk,
      campaignConvPS: convPS,
      campaignConvBK: convBK,
    };
  }, [filteredCampaigns]);

  // 2. ดึงข้อมูลจาก "ตารางลูกค้า" (Customers) ตามปีและเดือนที่เลือก
  const filteredCustomers = useMemo(() => {
    return (appData.customers || []).filter((c) => {
      if (!c.contactDate.startsWith(selectedYear)) return false;
      const m = c.contactDate.substring(5, 7);
      if (selectedMonths.length > 0 && !selectedMonths.includes(m)) return false;
      return true;
    });
  }, [appData.customers, selectedYear, selectedMonths]);

  // สถิติสถานะลูกค้าจากตารางลูกค้า
  const totalCustomers = filteredCustomers.length;
  const talkedCount = filteredCustomers.filter((c) => c.status === 'ได้คุย').length;
  const psCount = filteredCustomers.filter((c) => c.status === 'PS').length;
  const bkCount = filteredCustomers.filter((c) => c.status === 'BK').length;
  const rsCount = filteredCustomers.filter((c) => c.status === 'RS').length;
  const ccCount = filteredCustomers.filter((c) => c.status === 'CC').length;

  // 3. วิเคราะห์ความคุ้มค่าแบบบูรณาการ (Campaigns + Customers)
  const effectiveCostPerCustomer = totalCustomers > 0 ? campaignSpend / totalCustomers : 0;
  const effectiveCostPerBK = bkCount > 0 ? campaignSpend / bkCount : 0;
  const effectiveCostPerRS = rsCount > 0 ? campaignSpend / rsCount : 0;

  // ลูกค้าที่ลิงก์กับแคมเปญสาขา vs ลูกค้าทั่วไป/หน้าร้าน
  const linkedCustomers = useMemo(() => {
    return filteredCustomers.filter((c) => Boolean(c.campaignId));
  }, [filteredCustomers]);

  const organicCustomers = useMemo(() => {
    return filteredCustomers.filter((c) => !c.campaignId);
  }, [filteredCustomers]);

  // สรุปแยกรายแคมเปญเทียบกับลูกค้าจริงในตาราง
  const campaignAttribution = useMemo(() => {
    return filteredCampaigns.map((sc) => {
      const actualCustomers = filteredCustomers.filter((c) => c.campaignId === sc.id);
      const cTalked = actualCustomers.filter((c) => c.status === 'ได้คุย').length;
      const cPS = actualCustomers.filter((c) => c.status === 'PS').length;
      const cBK = actualCustomers.filter((c) => c.status === 'BK').length;
      const cRS = actualCustomers.filter((c) => c.status === 'RS').length;
      const cCC = actualCustomers.filter((c) => c.status === 'CC').length;
      const s = Number(sc.spend) || 0;
      const realCostPerLead = actualCustomers.length > 0 ? s / actualCustomers.length : 0;
      const realCostPerBK = cBK > 0 ? s / cBK : 0;

      return {
        campaign: sc,
        spend: s,
        inbox: Number(sc.inbox) || 0,
        reportedPS: Number(sc.ps) || 0,
        reportedBK: Number(sc.bk) || 0,
        actualTotal: actualCustomers.length,
        actualTalked: cTalked,
        actualPS: cPS,
        actualBK: cBK,
        actualRS: cRS,
        actualCC: cCC,
        realCostPerLead,
        realCostPerBK,
      };
    });
  }, [filteredCampaigns, filteredCustomers]);

  // สรุปประสิทธิภาพแยกตามเซลล์ (ดึงทั้งจากแคมเปญสาขาและตารางลูกค้า)
  const agentPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        salesAgent: string;
        campaignSpend: number;
        campaignInbox: number;
        campaignBK: number;
        customerTotal: number;
        customerTalked: number;
        customerPS: number;
        customerBK: number;
        customerRS: number;
      }
    >();

    appData.salesAgents.forEach((agent) => {
      map.set(agent, {
        salesAgent: agent,
        campaignSpend: 0,
        campaignInbox: 0,
        campaignBK: 0,
        customerTotal: 0,
        customerTalked: 0,
        customerPS: 0,
        customerBK: 0,
        customerRS: 0,
      });
    });

    filteredCampaigns.forEach((sc) => {
      const item = map.get(sc.salesAgent) || {
        salesAgent: sc.salesAgent,
        campaignSpend: 0,
        campaignInbox: 0,
        campaignBK: 0,
        customerTotal: 0,
        customerTalked: 0,
        customerPS: 0,
        customerBK: 0,
        customerRS: 0,
      };
      item.campaignSpend += Number(sc.spend) || 0;
      item.campaignInbox += Number(sc.inbox) || 0;
      item.campaignBK += Number(sc.bk) || 0;
      map.set(sc.salesAgent, item);
    });

    filteredCustomers.forEach((c) => {
      const item = map.get(c.salesAgent) || {
        salesAgent: c.salesAgent,
        campaignSpend: 0,
        campaignInbox: 0,
        campaignBK: 0,
        customerTotal: 0,
        customerTalked: 0,
        customerPS: 0,
        customerBK: 0,
        customerRS: 0,
      };
      item.customerTotal += 1;
      if (c.status === 'ได้คุย') item.customerTalked += 1;
      if (c.status === 'PS') item.customerPS += 1;
      if (c.status === 'BK') item.customerBK += 1;
      if (c.status === 'RS') item.customerRS += 1;
      map.set(c.salesAgent, item);
    });

    return Array.from(map.values())
      .filter((i) => i.campaignSpend > 0 || i.customerTotal > 0)
      .sort((a, b) => b.customerBK + b.customerRS - (a.customerBK + a.customerRS));
  }, [appData.salesAgents, filteredCampaigns, filteredCustomers]);

  // หมวดหมู่และรุ่นรถในตารางลูกค้า
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

  // จัดอันดับรุ่นยอดนิยม
  const modelRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCustomers.forEach((c) => {
      const key = `${c.category} - ${c.subCategory}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredCustomers]);

  // ลูกค้าออกรถสำเร็จ (RS)
  const rsCustomers = useMemo(() => {
    return filteredCustomers.filter((c) => c.status === 'RS');
  }, [filteredCustomers]);

  // วาดกราฟ Chart.js
  useEffect(() => {
    if (!barChartRef.current || !doughnutChartRef.current) return;

    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }
    if (doughnutChartInstance.current) {
      doughnutChartInstance.current.destroy();
    }

    // Bar Chart: สถานะลูกค้าแยกตามประเภทรถ
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
            { label: 'ได้คุย', data: categoriesList.map((c) => categoryStats[c]?.talked || 0), backgroundColor: '#4f46e5' },
            { label: 'PS (ผู้สนใจ)', data: categoriesList.map((c) => categoryStats[c]?.ps || 0), backgroundColor: '#0284c7' },
            { label: 'BK (จองรถ)', data: categoriesList.map((c) => categoryStats[c]?.bk || 0), backgroundColor: '#d97706' },
            { label: 'RS (ออกรถ)', data: categoriesList.map((c) => categoryStats[c]?.rs || 0), backgroundColor: '#059669' },
            { label: 'CC (ยกเลิก)', data: categoriesList.map((c) => categoryStats[c]?.cc || 0), backgroundColor: '#e11d48' },
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

    // Doughnut Chart: สัดส่วนความสนใจตามรุ่นรถ
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

  // Export Combined Report to Excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: สรุปภาพรวม
    const summaryRows = [
      { 'ดัชนีชี้วัด (KPI)': 'งบประมาณแคมเปญเพจสาขารวม (บาท)', 'จำนวน': campaignBudget },
      { 'ดัชนีชี้วัด (KPI)': 'ยอดใช้จ่ายจริงแคมเปญเพจสาขา (บาท)', 'จำนวน': campaignSpend },
      { 'ดัชนีชี้วัด (KPI)': 'ส่วนต่างงบคงเหลือ (บาท)', 'จำนวน': campaignDiff },
      { 'ดัชนีชี้วัด (KPI)': 'จำนวนแคมเปญเพจสาขาทั้งหมด', 'จำนวน': filteredCampaigns.length },
      { 'ดัชนีชี้วัด (KPI)': 'Inbox รวมจากแคมเปญเพจสาขา (ข้อความ)', 'จำนวน': campaignInbox },
      { 'ดัชนีชี้วัด (KPI)': 'ต้นทุนเฉลี่ยต่อ Inbox (บาท)', 'จำนวน': Number(costPerInbox.toFixed(2)) },
      { 'ดัชนีชี้วัด (KPI)': 'สรุปยอดจอง BK จากแคมเปญเพจสาขา (คัน)', 'จำนวน': campaignBK },
      { 'ดัชนีชี้วัด (KPI)': 'ต้นทุนเฉลี่ยต่อ BK แคมเปญ (บาท)', 'จำนวน': Number(costPerBK.toFixed(2)) },
      { 'ดัชนีชี้วัด (KPI)': 'ลูกค้าในตารางลูกค้าทั้งหมด (ราย)', 'จำนวน': totalCustomers },
      { 'ดัชนีชี้วัด (KPI)': 'ลูกค้าสถานะ ได้คุย (ราย)', 'จำนวน': talkedCount },
      { 'ดัชนีชี้วัด (KPI)': 'ลูกค้าสถานะ PS (ผู้สนใจ) (ราย)', 'จำนวน': psCount },
      { 'ดัชนีชี้วัด (KPI)': 'ลูกค้าสถานะ BK (จองรถในตาราง) (ราย)', 'จำนวน': bkCount },
      { 'ดัชนีชี้วัด (KPI)': 'ลูกค้าสถานะ RS (ออกรถสำเร็จ) (ราย)', 'จำนวน': rsCount },
      { 'ดัชนีชี้วัด (KPI)': 'ลูกค้าสถานะ CC (ยกเลิก) (ราย)', 'จำนวน': ccCount },
      { 'ดัชนีชี้วัด (KPI)': 'ต้นทุนเฉลี่ยต่อลูกค้า 1 รายในระบบ (บาท)', 'จำนวน': Number(effectiveCostPerCustomer.toFixed(2)) },
      { 'ดัชนีชี้วัด (KPI)': 'ต้นทุนเฉลี่ยต่อการจอง BK จริง (บาท)', 'จำนวน': Number(effectiveCostPerBK.toFixed(2)) },
      { 'ดัชนีชี้วัด (KPI)': 'ต้นทุนเฉลี่ยต่อการออกรถ RS จริง (บาท)', 'จำนวน': Number(effectiveCostPerRS.toFixed(2)) },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 45 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'สรุปดัชนีภาพรวม');

    // Sheet 2: เปรียบเทียบผลงานเซลล์
    const agentRows = agentPerformance.map((a, idx) => ({
      'ลำดับ': idx + 1,
      'เซลล์': a.salesAgent,
      'ยอดเงินใช้จ่ายแคมเปญ (บาท)': a.campaignSpend,
      'Inbox จากแคมเปญ': a.campaignInbox,
      'BK จากแคมเปญ': a.campaignBK,
      'ลูกค้าในตารางทั้งหมด': a.customerTotal,
      'ได้คุย': a.customerTalked,
      'PS': a.customerPS,
      'BK (จองรถ)': a.customerBK,
      'RS (ออกรถ)': a.customerRS,
    }));
    const wsAgent = XLSX.utils.json_to_sheet(agentRows);
    wsAgent['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsAgent, 'สรุปแยกตามเซลล์');

    // Sheet 3: ลูกค้าแยกตามรุ่นรถ
    const catRows = catSubSummary.map((row, idx) => ({
      'ลำดับ': idx + 1,
      'ประเภท': row.category,
      'รุ่นย่อย': row.subCategory,
      'ได้คุย': row.talked,
      'PS': row.ps,
      'BK': row.bk,
      'RS': row.rs,
      'CC': row.cc,
      'รวมทั้งหมด': row.total,
    }));
    const wsCat = XLSX.utils.json_to_sheet(catRows);
    wsCat['!cols'] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 24 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsCat, 'สรุปแยกตามรุ่นรถ');

    // Sheet 4: รายชื่อลูกค้าออกรถ (RS)
    const rsRows = rsCustomers.map((c, idx) => ({
      'ลำดับ': idx + 1,
      'วันที่ทัก': c.contactDate,
      'ชื่อ Facebook': c.fbName,
      'เบอร์โทร': c.phone || '-',
      'เซลล์ผู้ดูแล': c.salesAgent,
      'ประเภท': c.category,
      'รุ่นย่อย': c.subCategory,
      'แคมเปญที่ลิงก์': c.campaignName || 'ลูกค้าทั่วไป/หน้าร้าน',
      'บันทึกผลการติดตาม': c.followUpResult || '-',
    }));
    const wsRS = XLSX.utils.json_to_sheet(rsRows);
    wsRS['!cols'] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsRS, 'รายชื่อลูกค้าออกรถ(RS)');

    const fileSuffix = selectedMonths.length > 0 ? `${selectedYear}_M${selectedMonths.join('-')}` : selectedYear;
    XLSX.writeFile(workbook, `Combined_Executive_Report_${fileSuffix}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-700 rounded-xl">
                <PieChart className="w-5 h-5 text-red-700" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  รีพอร์ตรวม (บูรณาการแคมเปญเพจสาขา &amp; ตารางลูกค้า)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ประมวลผลข้อมูลเชื่อมโยงระหว่างงบโฆษณาเพจสาขา ยอด Inbox และข้อมูลสถานะลูกค้าจริง (ได้คุย, PS, BK, RS)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 md:flex-none"
              title="ดาวน์โหลดรีพอร์ตรวมทุกมิติเป็น Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export รีพอร์ตรวม Excel</span>
            </button>

            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 shrink-0">
              <label className="text-xs font-bold text-red-800">เลือกปี:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2 py-1 rounded border border-red-300 text-xs bg-white font-semibold text-red-800 focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Month Filter Section */}
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-red-600" />
              <span>เลือกช่วงเดือนที่ต้องการสรุป (เลือกได้หลายเดือนพร้อมกัน):</span>
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMonths([currentMonthNum])}
                className="text-slate-600 hover:text-red-700 hover:underline font-medium text-[11px]"
              >
                เดือนนี้ ({currentMonthNum})
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={selectAllMonths}
                className="text-red-700 hover:underline font-bold text-[11px]"
              >
                เลือกทั้งปี (12 เดือน)
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearAllMonths}
                className="text-slate-500 hover:underline text-[11px]"
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 text-xs">
            {monthsList.map((m) => {
              const isChecked = selectedMonths.includes(m);
              return (
                <label
                  key={m}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer select-none ${
                    isChecked
                      ? 'bg-red-700 text-white font-bold border-red-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleMonth(m)}
                    className="sr-only"
                  />
                  <span className="text-[10px] opacity-80">{monthNames[m]}</span>
                  <span className="text-xs font-mono">{m}</span>
                </label>
              );
            })}
          </div>

          {selectedMonths.length === 0 && (
            <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
              * กรุณาคลิกเลือกอย่างน้อย 1 เดือนเพื่อแสดงผลข้อมูลสถิติ
            </p>
          )}
        </div>

        {/* Section 1: Executive KPI Cards - ดึงจากแคมเปญสาขา และ ตารางลูกค้า */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span>สรุปภาพรวมสำคัญ: แคมเปญเพจสาขา &amp; ผลตอบรับลูกค้า</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              ข้อมูล {filteredCampaigns.length} แคมเปญ &middot; ลูกค้า {totalCustomers} ราย
            </span>
          </div>

          {/* Cards Grid: 1. แคมเปญสาขา (งบ, ใช้, Inbox, ต้นทุน) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1.1 งบประมาณแคมเปญ */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col justify-between">
              <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                <span>งบแคมเปญสาขา</span>
                <Wallet className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-slate-900 mt-1 font-mono">
                ฿{formatNum(campaignBudget)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>ใช้จริง: ฿{formatNum(campaignSpend)}</span>
                <span className={`font-semibold font-mono ${campaignDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {campaignDiff >= 0 ? `เหลือ +฿${formatNum(campaignDiff)}` : `เกิน -฿${formatNum(Math.abs(campaignDiff))}`}
                </span>
              </div>
            </div>

            {/* 1.2 ยอด Inbox รวม (จากแคมเปญสาขา) */}
            <div className="bg-sky-50/80 border border-sky-200 p-3.5 rounded-2xl flex flex-col justify-between">
              <div className="text-xs text-sky-800 font-semibold flex items-center justify-between">
                <span>Inbox แคมเปญสาขารวม</span>
                <MessageSquare className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-lg md:text-xl font-bold text-sky-950 mt-1 font-mono">
                {formatNum(campaignInbox)} <span className="text-xs font-normal text-sky-700">ข้อความ</span>
              </div>
              <div className="text-[11px] text-sky-800 mt-1 flex justify-between">
                <span>ต้นทุน/Inbox:</span>
                <span className="font-bold font-mono text-sky-900">฿{formatNum(costPerInbox)}</span>
              </div>
            </div>

            {/* 1.3 สรุป BK รวมจากแคมเปญสาขา */}
            <div className="bg-amber-50/80 border border-amber-300 p-3.5 rounded-2xl flex flex-col justify-between shadow-2xs">
              <div className="text-xs text-amber-900 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">BK</span>
                  <span>สรุป BK (จองรถจากแคมเปญ)</span>
                </span>
                <BookmarkCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg md:text-xl font-bold text-amber-950 mt-1 font-mono">
                {formatNum(campaignBK)} <span className="text-xs font-normal text-amber-800">คัน</span>
              </div>
              <div className="text-[11px] text-amber-800 mt-1 flex justify-between">
                <span>ต้นทุนเฉลี่ย/BK:</span>
                <span className="font-bold font-mono text-amber-950">฿{formatNum(costPerBK)}</span>
              </div>
            </div>

            {/* 1.4 ความคุ้มค่า: ต้นทุนต่อการออกรถจริง (RS) */}
            <div className="bg-emerald-50/80 border border-emerald-300 p-3.5 rounded-2xl flex flex-col justify-between">
              <div className="text-xs text-emerald-900 font-bold flex items-center justify-between">
                <span>ต้นทุนต่อการออกรถ (RS)</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg md:text-xl font-bold text-emerald-950 mt-1 font-mono">
                {rsCount > 0 ? `฿${formatNum(effectiveCostPerRS)}` : '-'}
              </div>
              <div className="text-[11px] text-emerald-800 mt-1 flex justify-between">
                <span>ออกรถสำเร็จในตาราง:</span>
                <span className="font-bold font-mono text-emerald-950">{rsCount} คัน</span>
              </div>
            </div>
          </div>

          {/* Cards Grid: 2. สถานะลูกค้าในตารางลูกค้า (Customer Status Breakdown) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {/* ลูกค้าทั้งหมด */}
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl">
              <div className="text-xs text-slate-500 font-semibold">ลูกค้าในระบบทั้งหมด</div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{totalCustomers}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                ผูกแคมเปญ {linkedCustomers.length} &middot; ทั่วไป {organicCustomers.length}
              </div>
            </div>

            {/* ได้คุย */}
            <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-2xl">
              <div className="text-xs text-indigo-700 font-semibold flex items-center justify-between">
                <span>สถานะ &ldquo;ได้คุย&rdquo;</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              <div className="text-xl font-bold text-indigo-950 mt-1 font-mono">{talkedCount}</div>
              <div className="text-[10px] text-indigo-700 mt-1">
                {totalCustomers > 0 ? `${((talkedCount / totalCustomers) * 100).toFixed(1)}% ของลูกค้า` : '-'}
              </div>
            </div>

            {/* PS */}
            <div className="bg-sky-50/70 border border-sky-200 p-3.5 rounded-2xl">
              <div className="text-xs text-sky-700 font-semibold flex items-center justify-between">
                <span>สถานะ &ldquo;PS&rdquo; (ผู้สนใจ)</span>
                <span className="w-2 h-2 rounded-full bg-sky-500" />
              </div>
              <div className="text-xl font-bold text-sky-950 mt-1 font-mono">{psCount}</div>
              <div className="text-[10px] text-sky-700 mt-1">
                {totalCustomers > 0 ? `${((psCount / totalCustomers) * 100).toFixed(1)}% ของลูกค้า` : '-'}
              </div>
            </div>

            {/* BK (ตารางลูกค้า) */}
            <div className="bg-amber-50/80 border border-amber-300 p-3.5 rounded-2xl">
              <div className="text-xs text-amber-800 font-bold flex items-center justify-between">
                <span>สถานะ &ldquo;BK&rdquo; (จองรถ)</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-xl font-bold text-amber-950 mt-1 font-mono">{bkCount}</div>
              <div className="text-[10px] text-amber-800 mt-1 font-mono font-semibold">
                {psCount > 0 ? `แปลงจาก PS ${( (bkCount / psCount) * 100 ).toFixed(1)}%` : '-'}
              </div>
            </div>

            {/* RS */}
            <div className="bg-emerald-50/80 border border-emerald-300 p-3.5 rounded-2xl">
              <div className="text-xs text-emerald-800 font-bold flex items-center justify-between">
                <span>สถานะ &ldquo;RS&rdquo; (ออกรถ)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-950 mt-1 font-mono">{rsCount}</div>
              <div className="text-[10px] text-emerald-800 mt-1 font-mono font-semibold">
                {bkCount > 0 ? `ปิดการขาย ${( (rsCount / bkCount) * 100 ).toFixed(1)}%` : '-'}
              </div>
            </div>

            {/* CC */}
            <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl">
              <div className="text-xs text-rose-700 font-semibold flex items-center justify-between">
                <span>สถานะ &ldquo;CC&rdquo; (ยกเลิก)</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="text-xl font-bold text-rose-950 mt-1 font-mono">{ccCount}</div>
              <div className="text-[10px] text-rose-700 mt-1">
                {totalCustomers > 0 ? `${((ccCount / totalCustomers) * 100).toFixed(1)}% ของลูกค้า` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Conversion Funnel (ช่องทางเปลี่ยนผู้สนใจเป็นยอดจองและออกรถ) */}
        <div className="bg-gradient-to-r from-red-50/80 via-white to-amber-50/80 p-5 rounded-2xl border border-red-200/80 mb-8">
          <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-red-600" />
            <span>ช่องทางการแปลงสภาพลูกค้า (Conversion Funnel: แคมเปญสาขา ➔ การขาย)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            {/* Step 1: Inbox */}
            <div className="bg-white p-3.5 rounded-xl border border-sky-200 shadow-2xs text-center">
              <div className="text-[11px] text-sky-700 font-semibold">1. Inbox แคมเปญเพจ</div>
              <div className="text-xl font-bold text-sky-900 font-mono mt-0.5">{formatNum(campaignInbox)}</div>
              <div className="text-[10px] text-slate-500 mt-1">ต้นทุน ฿{formatNum(costPerInbox)}/inbox</div>
            </div>

            {/* Step 2: ได้คุย */}
            <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs text-center">
              <div className="text-[11px] text-indigo-700 font-semibold">2. ลงข้อมูล &amp; ได้คุย</div>
              <div className="text-xl font-bold text-indigo-950 font-mono mt-0.5">{talkedCount}</div>
              <div className="text-[10px] text-indigo-700 mt-1">
                {campaignInbox > 0 ? `${((talkedCount / campaignInbox) * 100).toFixed(1)}% จาก Inbox` : '-'}
              </div>
            </div>

            {/* Step 3: PS */}
            <div className="bg-white p-3.5 rounded-xl border border-sky-300 shadow-2xs text-center">
              <div className="text-[11px] text-sky-800 font-semibold">3. PS (ผู้สนใจ/นัดหมาย)</div>
              <div className="text-xl font-bold text-sky-950 font-mono mt-0.5">{psCount}</div>
              <div className="text-[10px] text-sky-700 mt-1">
                {talkedCount > 0 ? `${((psCount / talkedCount) * 100).toFixed(1)}% จากที่ได้คุย` : '-'}
              </div>
            </div>

            {/* Step 4: BK */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-2xs text-center">
              <div className="text-[11px] text-amber-800 font-bold">4. BK (จองรถสำเร็จ)</div>
              <div className="text-xl font-bold text-amber-950 font-mono mt-0.5">{bkCount}</div>
              <div className="text-[10px] text-amber-700 mt-1 font-semibold">
                {psCount > 0 ? `${((bkCount / psCount) * 100).toFixed(1)}% จาก PS` : '-'}
              </div>
            </div>

            {/* Step 5: RS */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-2xs text-center">
              <div className="text-[11px] text-emerald-800 font-bold">5. RS (ส่งมอบรถแล้ว)</div>
              <div className="text-xl font-bold text-emerald-950 font-mono mt-0.5">{rsCount}</div>
              <div className="text-[10px] text-emerald-700 mt-1 font-bold">
                {bkCount > 0 ? `${((rsCount / bkCount) * 100).toFixed(1)}% ออกรถสำเร็จ` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Charts Grid (กราฟสถานะ & สัดส่วนรุ่นรถ) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <BarChart2 className="w-4 h-4 text-red-600 mr-1.5" />
              สถิติสถานะลูกค้า (ได้คุย, PS, BK, RS, CC) แยกตามประเภทรถ
            </h3>
            <div className="relative h-64 w-full">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <PieChart className="w-4 h-4 text-red-600 mr-1.5" />
              สัดส่วนความสนใจของลูกค้าตามรุ่นย่อย (จากตารางลูกค้า)
            </h3>
            <div className="relative h-64 w-full">
              <canvas ref={doughnutChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Section 4: ตารางสรุปเปรียบเทียบแคมเปญเพจสาขา vs ลูกค้าจริงในระบบ */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-red-600" />
                <span>สรุปผลงานแคมเปญเพจสาขา และจำนวนลูกค้าจริงในตาราง ({filteredCampaigns.length} แคมเปญ)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เปรียบเทียบงบประมาณที่ใช้จริง กับจำนวนลูกค้าและยอดจอง (BK) ที่เกิดขึ้นจริง
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200">
              <thead className="bg-red-700 text-white font-semibold">
                <tr>
                  <th className="p-2.5">เดือน</th>
                  <th className="p-2.5">เซลล์</th>
                  <th className="p-2.5">ชื่อแคมเปญเพจสาขา</th>
                  <th className="p-2.5">ประเภท</th>
                  <th className="p-2.5 text-right">ยอดใช้จ่ายจริง</th>
                  <th className="p-2.5 text-center">Inbox แคมเปญ</th>
                  <th className="p-2.5 text-center bg-amber-800">BK แคมเปญ</th>
                  <th className="p-2.5 text-center">ลูกค้าที่ผูกในตาราง</th>
                  <th className="p-2.5 text-center">ได้คุย</th>
                  <th className="p-2.5 text-center">PS</th>
                  <th className="p-2.5 text-center">BK จริง</th>
                  <th className="p-2.5 text-center">RS จริง</th>
                  <th className="p-2.5 text-right">ต้นทุน/ลูกค้าจริง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {campaignAttribution.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-6 text-slate-400 font-sans">
                      ไม่พบข้อมูลแคมเปญเพจสาขาในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                ) : (
                  campaignAttribution.map((item, idx) => (
                    <tr key={item.campaign.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="p-2.5 font-bold text-slate-700 whitespace-nowrap">{item.campaign.month}</td>
                      <td className="p-2.5 font-sans font-bold text-red-700 whitespace-nowrap">{item.campaign.salesAgent}</td>
                      <td className="p-2.5 font-sans font-semibold text-slate-900 max-w-xs truncate" title={item.campaign.campaignName}>
                        {item.campaign.campaignName}
                      </td>
                      <td className="p-2.5 font-sans whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold border inline-block"
                          style={{
                            backgroundColor: `${appData.categoryColors[item.campaign.category] || '#ef4444'}15`,
                            borderColor: `${appData.categoryColors[item.campaign.category] || '#ef4444'}50`,
                            color: appData.categoryColors[item.campaign.category] || '#ef4444',
                          }}
                        >
                          {item.campaign.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        ฿{formatNum(item.spend)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-sky-800 whitespace-nowrap">
                        {formatNum(item.inbox)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-amber-900 bg-amber-50/60 whitespace-nowrap">
                        {formatNum(item.reportedBK)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">
                          {item.actualTotal}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-indigo-700 whitespace-nowrap">{item.actualTalked}</td>
                      <td className="p-2.5 text-center text-sky-700 whitespace-nowrap">{item.actualPS}</td>
                      <td className="p-2.5 text-center text-amber-700 font-bold whitespace-nowrap">{item.actualBK}</td>
                      <td className="p-2.5 text-center text-emerald-700 font-bold whitespace-nowrap">{item.actualRS}</td>
                      <td className="p-2.5 text-right font-bold text-slate-800 whitespace-nowrap">
                        {item.actualTotal > 0 ? `฿${formatNum(item.realCostPerLead)}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: ประสิทธิภาพแยกตามเซลล์ (แคมเปญ & ลูกค้า) */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
          <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-red-600" />
            <span>สรุปผลงานแยกตามเซลล์ผู้ดูแล (ยอดเงินแคมเปญ, Inbox, ลูกค้า, ยอดจอง BK และส่งมอบ RS)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200">
              <thead className="bg-red-700 text-white font-semibold">
                <tr>
                  <th className="p-2.5">เซลล์ผู้ดูแล</th>
                  <th className="p-2.5 text-right">ยอดเงินแคมเปญที่ใช้</th>
                  <th className="p-2.5 text-center">Inbox จากแคมเปญ</th>
                  <th className="p-2.5 text-center">BK จากแคมเปญ</th>
                  <th className="p-2.5 text-center">ลูกค้าในตารางรวม</th>
                  <th className="p-2.5 text-center bg-indigo-800">ได้คุย</th>
                  <th className="p-2.5 text-center bg-sky-800">PS</th>
                  <th className="p-2.5 text-center bg-amber-800">BK จริง</th>
                  <th className="p-2.5 text-center bg-emerald-800">RS (ออกรถ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {agentPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-slate-400 font-sans">
                      ไม่มีข้อมูลเซลล์ในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                ) : (
                  agentPerformance.map((a) => (
                    <tr key={a.salesAgent} className="hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="p-2.5 font-sans font-bold text-slate-900 whitespace-nowrap">{a.salesAgent}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        ฿{formatNum(a.campaignSpend)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-sky-800 whitespace-nowrap">{formatNum(a.campaignInbox)}</td>
                      <td className="p-2.5 text-center font-bold text-amber-900 whitespace-nowrap">{formatNum(a.campaignBK)}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{a.customerTotal}</span>
                      </td>
                      <td className="p-2.5 text-center text-indigo-700 font-semibold whitespace-nowrap">{a.customerTalked}</td>
                      <td className="p-2.5 text-center text-sky-700 font-semibold whitespace-nowrap">{a.customerPS}</td>
                      <td className="p-2.5 text-center text-amber-700 font-bold bg-amber-50/50 whitespace-nowrap">{a.customerBK}</td>
                      <td className="p-2.5 text-center text-emerald-700 font-bold bg-emerald-50/50 whitespace-nowrap">{a.customerRS}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: สรุปสถิติจำนวนแยกตามประเภท และ รุ่นย่อย (จากตารางลูกค้า) */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
          <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
            <Layers className="w-4 h-4 text-red-600 mr-1.5" />
            สรุปสถิติจำนวนลูกค้าแยกตามประเภท และ รุ่นย่อย
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200">
              <thead className="bg-red-700 text-white font-semibold">
                <tr>
                  <th className="p-2.5">ประเภท (Category)</th>
                  <th className="p-2.5">รุ่นย่อย (Model)</th>
                  <th className="p-2.5 text-center bg-indigo-800 w-16">ได้คุย</th>
                  <th className="p-2.5 text-center bg-sky-800 w-16">PS</th>
                  <th className="p-2.5 text-center bg-amber-800 w-16">BK</th>
                  <th className="p-2.5 text-center bg-emerald-800 w-16">RS</th>
                  <th className="p-2.5 text-center bg-rose-800 w-16">CC</th>
                  <th className="p-2.5 text-center w-20">รวมลูกค้า</th>
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
                      <td className="p-2.5 text-center text-indigo-700 font-semibold">{row.talked}</td>
                      <td className="p-2.5 text-center text-sky-700 font-semibold">{row.ps}</td>
                      <td className="p-2.5 text-center text-amber-700 font-bold">{row.bk}</td>
                      <td className="p-2.5 text-center text-emerald-700 font-bold">{row.rs}</td>
                      <td className="p-2.5 text-center text-rose-700 font-semibold">{row.cc}</td>
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

        {/* Section 7: อันดับรุ่นยอดนิยม และ รายชื่อลูกค้าออกรถ (RS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center">
              <Award className="w-4 h-4 text-red-600 mr-1.5" />
              จัดอันดับรุ่นรถที่ลูกค้าสนใจมากที่สุด
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
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
              รายชื่อลูกค้าที่ออกรถสำเร็จ (RS - ปิดการขายสำเร็จ)
            </h3>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
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
