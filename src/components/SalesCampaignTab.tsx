import React, { useState, useMemo } from 'react';
import { AppData, SalesCampaign, Customer } from '../types';
import { formatNum, getCurrentYearMonth, getStatusBadgeStyle } from '../hooks/useAppData';
import { compressImageTo600x600 } from '../utils/imageUtils';
import * as XLSX from 'xlsx';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Wallet,
  CreditCard,
  MessageSquare,
  TrendingUp,
  X,
  Save,
  Filter,
  FileSpreadsheet,
  Calendar,
  Users,
  Layers,
  Search,
  RotateCcw,
  BarChart3,
  Award,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Target,
  Image as ImageIcon,
  Upload,
  Maximize2,
  Loader2,
  BookmarkCheck,
  PieChart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SalesCampaignTabProps {
  appData: AppData;
  onSaveCampaign: (campaign: Omit<SalesCampaign, 'id'> & { id?: number }) => void;
  onDeleteCampaign: (id: number) => void;
  availableYears: string[];
  canExport?: boolean;
}

export const SalesCampaignTab: React.FC<SalesCampaignTabProps> = ({
  appData,
  onSaveCampaign,
  onDeleteCampaign,
  availableYears,
  canExport = true,
}) => {
  const currentYM = getCurrentYearMonth();
  const [currentYearStr, currentMonthNum] = currentYM.split('-');

  // Filter States
  const [filterYear, setFilterYear] = useState<string>(availableYears[0] || currentYearStr);
  const [filterMonth, setFilterMonth] = useState<string>(''); // '' = all months, or '01'-'12'
  const [filterSales, setFilterSales] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active view mode for summary breakdown
  const [viewMode, setViewMode] = useState<'table' | 'sales_summary' | 'category_summary' | 'monthly_summary'>('table');

  // Toggle for Category Expense Report Box (ช่องรายงานสรุปค่าใช้จ่ายแยกประเภท)
  const [showCategoryWidget, setShowCategoryWidget] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [modalMonth, setModalMonth] = useState(currentYM);
  const [modalSalesAgent, setModalSalesAgent] = useState('');
  const [modalCampaignName, setModalCampaignName] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalBudget, setModalBudget] = useState<string | number>('');
  const [modalSpend, setModalSpend] = useState<string | number>('');
  const [modalInbox, setModalInbox] = useState<string | number>('');
  const [modalPS, setModalPS] = useState<string | number>('');
  const [modalBK, setModalBK] = useState<string | number>('');
  const [modalRS, setModalRS] = useState<string | number>('');
  const [modalImage, setModalImage] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [compressionInfo, setCompressionInfo] = useState<{ orig: number; comp: number } | null>(null);
  const [imageError, setImageError] = useState<string>('');

  // Customer List Modal State (ดูรายชื่อลูกค้าที่เชื่อมโยงกับแคมเปญ)
  const [customerListModal, setCustomerListModal] = useState<{
    title: string;
    campaignName: string;
    customers: Customer[];
  } | null>(null);

  // Lightbox Preview Modal State
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    agent: string;
    month: string;
    category: string;
  } | null>(null);

  const months = [
    { value: '', label: 'ทุกเดือน' },
    { value: '01', label: 'ม.ค. (01)', fullName: 'มกราคม' },
    { value: '02', label: 'ก.พ. (02)', fullName: 'กุมภาพันธ์' },
    { value: '03', label: 'มี.ค. (03)', fullName: 'มีนาคม' },
    { value: '04', label: 'เม.ย. (04)', fullName: 'เมษายน' },
    { value: '05', label: 'พ.ค. (05)', fullName: 'พฤษภาคม' },
    { value: '06', label: 'มิ.ย. (06)', fullName: 'มิถุนายน' },
    { value: '07', label: 'ก.ค. (07)', fullName: 'กรกฎาคม' },
    { value: '08', label: 'ส.ค. (08)', fullName: 'สิงหาคม' },
    { value: '09', label: 'ก.ย. (09)', fullName: 'กันยายน' },
    { value: '10', label: 'ต.ค. (10)', fullName: 'ตุลาคม' },
    { value: '11', label: 'พ.ย. (11)', fullName: 'พฤศจิกายน' },
    { value: '12', label: 'ธ.ค. (12)', fullName: 'ธันวาคม' },
  ];

  const categories = Object.keys(appData.categories);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return (appData.salesCampaigns || []).filter((sc) => {
      // Filter Year
      if (filterYear && !sc.month.startsWith(filterYear)) return false;

      // Filter Month ('01'-'12')
      if (filterMonth) {
        const scMonth = sc.month.split('-')[1];
        if (scMonth !== filterMonth) return false;
      }

      // Filter Sales Agent
      if (filterSales && sc.salesAgent !== filterSales) return false;

      // Filter Category
      if (filterCategory && sc.category !== filterCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = sc.campaignName.toLowerCase().includes(query);
        const matchSales = sc.salesAgent.toLowerCase().includes(query);
        const matchCat = sc.category.toLowerCase().includes(query);
        if (!matchName && !matchSales && !matchCat) return false;
      }

      return true;
    });
  }, [appData.salesCampaigns, filterYear, filterMonth, filterSales, filterCategory, searchQuery]);

  // ดึงสถิติตัวเลขลูกค้าจริง (PS, BK, RS) จากตารางลูกค้า (appData.customers) เชื่อมโยงเข้ากับแต่ละแคมเปญ
  const campaignCustomerMap = useMemo(() => {
    const map = new Map<
      number,
      {
        total: number;
        ps: number;
        bk: number;
        rs: number;
        talked: number;
        cc: number;
        customers: Customer[];
      }
    >();

    (appData.customers || []).forEach((c) => {
      // 1. ค้นหาแคมเปญที่เชื่อมโยงตรงผ่าน campaignId หรือชื่อ campaignName
      let matchingCampaign = (appData.salesCampaigns || []).find((sc) => {
        if (c.campaignId && c.campaignId === sc.id) return true;
        if (c.campaignName && sc.campaignName && c.campaignName.trim().toLowerCase() === sc.campaignName.trim().toLowerCase()) return true;
        return false;
      });

      // 2. หากยังไม่พบการเชื่อมโยงตรง ให้ค้นหาจากเซลล์เจ้าของเพจ + เดือนที่ติดต่อ + ประเภทรถ
      if (!matchingCampaign && c.salesAgent && c.contactDate) {
        const cMonth = c.contactDate.substring(0, 7);
        matchingCampaign = (appData.salesCampaigns || []).find((sc) => {
          const matchAgent = sc.salesAgent.trim() === c.salesAgent.trim();
          const matchMonth = sc.month === cMonth;
          const matchCat = !c.category || sc.category === c.category;
          return matchAgent && matchMonth && matchCat;
        });

        // 3. หากยังไม่พบ ให้ค้นหาจากเซลล์ + เดือน
        if (!matchingCampaign) {
          matchingCampaign = (appData.salesCampaigns || []).find((sc) => {
            return sc.salesAgent.trim() === c.salesAgent.trim() && sc.month === cMonth;
          });
        }
      }

      if (!matchingCampaign) return;

      const scId = matchingCampaign.id;
      const current = map.get(scId) || {
        total: 0,
        ps: 0,
        bk: 0,
        rs: 0,
        talked: 0,
        cc: 0,
        customers: [],
      };

      current.total += 1;
      current.customers.push(c);

      // ตรวจสอบสถานะที่ลูกค้าผ่าน (PS, BK, RS)
      const hasReachedPS =
        c.status === 'PS' ||
        c.status === 'BK' ||
        c.status === 'RS' ||
        (c.statusHistory && c.statusHistory.some((h) => h.status === 'PS'));

      const hasReachedBK =
        c.status === 'BK' ||
        c.status === 'RS' ||
        (c.statusHistory && c.statusHistory.some((h) => h.status === 'BK'));

      const hasReachedRS =
        c.status === 'RS' ||
        (c.statusHistory && c.statusHistory.some((h) => h.status === 'RS'));

      if (c.status === 'ได้คุย') current.talked += 1;
      if (hasReachedPS) current.ps += 1;
      if (hasReachedBK) current.bk += 1;
      if (hasReachedRS) current.rs += 1;
      if (c.status === 'CC') current.cc += 1;

      map.set(scId, current);
    });

    return map;
  }, [appData.customers, appData.salesCampaigns]);

  // ฟังก์ชันดึงตัวเลข PS, BK, RS สำหรับแคมเปญ โดยดึงจากตารางลูกค้าเป็นหลัก
  const getCampaignMetrics = (sc: SalesCampaign) => {
    const custInfo = campaignCustomerMap.get(sc.id);
    const hasCust = custInfo !== undefined && custInfo.total > 0;
    const custPS = custInfo ? custInfo.ps : 0;
    const custBK = custInfo ? custInfo.bk : 0;
    const custRS = custInfo ? custInfo.rs : 0;

    // ดึงตัวเลขจากตารางลูกค้าเป็นหลัก: หากมีข้อมูลลูกค้าที่เชื่อมโยง ให้ใช้ตัวเลขจริงจากตารางลูกค้า
    // หากยังไม่มีลูกค้าในตาราง ให้ใช้ตัวเลขที่บันทึกไว้ในแคมเปญ
    const ps = hasCust ? custPS : (Number(sc.ps) || 0);
    const bk = hasCust ? custBK : (Number(sc.bk) || 0);
    const rs = hasCust ? custRS : (Number(sc.rs) || 0);

    const spend = Number(sc.spend) || 0;
    const inbox = Number(sc.inbox) || 0;
    const cpi = inbox > 0 ? spend / inbox : 0;
    const cpps = ps > 0 ? spend / ps : 0;
    const cpbk = bk > 0 ? spend / bk : 0;
    const cprs = rs > 0 ? spend / rs : 0;
    const convInboxPS = inbox > 0 ? (ps / inbox) * 100 : 0;
    const convInboxBK = inbox > 0 ? (bk / inbox) * 100 : 0;
    const convBKRS = bk > 0 ? (rs / bk) * 100 : 0;

    return {
      ps,
      bk,
      rs,
      custPS,
      custBK,
      custRS,
      custTotal: custInfo ? custInfo.total : 0,
      custTalked: custInfo ? custInfo.talked : 0,
      custCC: custInfo ? custInfo.cc : 0,
      customers: custInfo ? custInfo.customers : [],
      hasCustData: hasCust,
      cpi,
      cpps,
      cpbk,
      cprs,
      convInboxPS,
      convInboxBK,
      convBKRS,
    };
  };

  // High-level KPI aggregations (ดึง PS, BK, RS จากตารางลูกค้า)
  const {
    totalBudget,
    totalSpend,
    totalDiff,
    totalInbox,
    totalPS,
    totalBK,
    totalRS,
    avgCPI,
    avgCPPS,
    avgCPBK,
    avgCPRS,
    convInboxToPS,
    convInboxToBK,
    convPSToBK,
    convBKToRS,
    convInboxToRS,
    budgetUsageRate,
  } = useMemo(() => {
    let b = 0;
    let s = 0;
    let i = 0;
    let p = 0;
    let k = 0;
    let r = 0;

    filteredCampaigns.forEach((sc) => {
      b += Number(sc.budget) || 0;
      s += Number(sc.spend) || 0;
      i += Number(sc.inbox) || 0;
      const metrics = getCampaignMetrics(sc);
      p += metrics.ps;
      k += metrics.bk;
      r += metrics.rs;
    });

    const cpi = i > 0 ? s / i : 0;
    const cpps = p > 0 ? s / p : 0;
    const cpbk = k > 0 ? s / k : 0;
    const cprs = r > 0 ? s / r : 0;
    const convInboxPS = i > 0 ? (p / i) * 100 : 0;
    const convInboxBK = i > 0 ? (k / i) * 100 : 0;
    const convPSBK = p > 0 ? (k / p) * 100 : 0;
    const convBKRS = k > 0 ? (r / k) * 100 : 0;
    const convInboxRS = i > 0 ? (r / i) * 100 : 0;
    const diff = b - s;
    const usage = b > 0 ? (s / b) * 100 : 0;

    return {
      totalBudget: b,
      totalSpend: s,
      totalDiff: diff,
      totalInbox: i,
      totalPS: p,
      totalBK: k,
      totalRS: r,
      avgCPI: cpi,
      avgCPPS: cpps,
      avgCPBK: cpbk,
      avgCPRS: cprs,
      convInboxToPS: convInboxPS,
      convInboxToBK: convInboxBK,
      convPSToBK: convPSBK,
      convBKToRS: convBKRS,
      convInboxToRS: convInboxRS,
      budgetUsageRate: usage,
    };
  }, [filteredCampaigns, campaignCustomerMap]);

  // Breakdown Summary by Sales Agent (ดึง PS, BK, RS จากตารางลูกค้า)
  const salesSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        salesAgent: string;
        count: number;
        budget: number;
        spend: number;
        inbox: number;
        ps: number;
        bk: number;
        rs: number;
      }
    >();

    // Initialize all sales agents in system
    appData.salesAgents.forEach((agent) => {
      map.set(agent, {
        salesAgent: agent,
        count: 0,
        budget: 0,
        spend: 0,
        inbox: 0,
        ps: 0,
        bk: 0,
        rs: 0,
      });
    });

    // Populate data from filtered campaigns
    filteredCampaigns.forEach((sc) => {
      const existing = map.get(sc.salesAgent) || {
        salesAgent: sc.salesAgent,
        count: 0,
        budget: 0,
        spend: 0,
        inbox: 0,
        ps: 0,
        bk: 0,
        rs: 0,
      };
      const metrics = getCampaignMetrics(sc);
      existing.count += 1;
      existing.budget += Number(sc.budget) || 0;
      existing.spend += Number(sc.spend) || 0;
      existing.inbox += Number(sc.inbox) || 0;
      existing.ps += metrics.ps;
      existing.bk += metrics.bk;
      existing.rs += metrics.rs;
      map.set(sc.salesAgent, existing);
    });

    return Array.from(map.values())
      .filter((item) => item.count > 0 || !filterSales)
      .map((item) => {
        const diff = item.budget - item.spend;
        const cpi = item.inbox > 0 ? item.spend / item.inbox : 0;
        const cpps = item.ps > 0 ? item.spend / item.ps : 0;
        const cpbk = item.bk > 0 ? item.spend / item.bk : 0;
        const cprs = item.rs > 0 ? item.spend / item.rs : 0;
        const convRate = item.inbox > 0 ? (item.ps / item.inbox) * 100 : 0;
        const convBKRate = item.inbox > 0 ? (item.bk / item.inbox) * 100 : 0;
        const convRSRate = item.bk > 0 ? (item.rs / item.bk) * 100 : 0;
        const usageRate = item.budget > 0 ? (item.spend / item.budget) * 100 : 0;
        const inboxShare = totalInbox > 0 ? (item.inbox / totalInbox) * 100 : 0;
        const psShare = totalPS > 0 ? (item.ps / totalPS) * 100 : 0;
        const bkShare = totalBK > 0 ? (item.bk / totalBK) * 100 : 0;
        const rsShare = totalRS > 0 ? (item.rs / totalRS) * 100 : 0;
        return {
          ...item,
          diff,
          cpi,
          cpps,
          cpbk,
          cprs,
          convRate,
          convBKRate,
          convRSRate,
          usageRate,
          inboxShare,
          psShare,
          bkShare,
          rsShare,
        };
      })
      .sort((a, b) => b.inbox - a.inbox);
  }, [filteredCampaigns, appData.salesAgents, filterSales, totalInbox, totalPS, totalBK, totalRS, campaignCustomerMap]);

  // Breakdown Summary by Category (ดึง PS, BK, RS จากตารางลูกค้า)
  const categorySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        count: number;
        budget: number;
        spend: number;
        inbox: number;
        ps: number;
        bk: number;
        rs: number;
      }
    >();

    categories.forEach((cat) => {
      map.set(cat, {
        category: cat,
        count: 0,
        budget: 0,
        spend: 0,
        inbox: 0,
        ps: 0,
        bk: 0,
        rs: 0,
      });
    });

    filteredCampaigns.forEach((sc) => {
      const existing = map.get(sc.category) || {
        category: sc.category,
        count: 0,
        budget: 0,
        spend: 0,
        inbox: 0,
        ps: 0,
        bk: 0,
        rs: 0,
      };
      const metrics = getCampaignMetrics(sc);
      existing.count += 1;
      existing.budget += Number(sc.budget) || 0;
      existing.spend += Number(sc.spend) || 0;
      existing.inbox += Number(sc.inbox) || 0;
      existing.ps += metrics.ps;
      existing.bk += metrics.bk;
      existing.rs += metrics.rs;
      map.set(sc.category, existing);
    });

    return Array.from(map.values())
      .filter((item) => item.count > 0)
      .map((item) => {
        const diff = item.budget - item.spend;
        const cpi = item.inbox > 0 ? item.spend / item.inbox : 0;
        const cpps = item.ps > 0 ? item.spend / item.ps : 0;
        const cpbk = item.bk > 0 ? item.spend / item.bk : 0;
        const cprs = item.rs > 0 ? item.spend / item.rs : 0;
        const convRate = item.inbox > 0 ? (item.ps / item.inbox) * 100 : 0;
        const convBKRate = item.inbox > 0 ? (item.bk / item.inbox) * 100 : 0;
        const convRSRate = item.bk > 0 ? (item.rs / item.bk) * 100 : 0;
        const spendShare = totalSpend > 0 ? (item.spend / totalSpend) * 100 : 0;
        const budgetUsageRate = item.budget > 0 ? (item.spend / item.budget) * 100 : 0;
        const avgPerCampaign = item.count > 0 ? item.spend / item.count : 0;
        return {
          ...item,
          diff,
          cpi,
          cpps,
          cpbk,
          cprs,
          convRate,
          convBKRate,
          convRSRate,
          spendShare,
          budgetUsageRate,
          avgPerCampaign,
        };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [filteredCampaigns, categories, totalSpend, campaignCustomerMap]);

  // Breakdown Summary by Month (ดึง PS, BK, RS จากตารางลูกค้า)
  const monthlySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        month: string;
        count: number;
        budget: number;
        spend: number;
        inbox: number;
        ps: number;
        bk: number;
        rs: number;
      }
    >();

    filteredCampaigns.forEach((sc) => {
      const existing = map.get(sc.month) || {
        month: sc.month,
        count: 0,
        budget: 0,
        spend: 0,
        inbox: 0,
        ps: 0,
        bk: 0,
        rs: 0,
      };
      const metrics = getCampaignMetrics(sc);
      existing.count += 1;
      existing.budget += Number(sc.budget) || 0;
      existing.spend += Number(sc.spend) || 0;
      existing.inbox += Number(sc.inbox) || 0;
      existing.ps += metrics.ps;
      existing.bk += metrics.bk;
      existing.rs += metrics.rs;
      map.set(sc.month, existing);
    });

    return Array.from(map.values())
      .map((item) => {
        const diff = item.budget - item.spend;
        const cpi = item.inbox > 0 ? item.spend / item.inbox : 0;
        const cpps = item.ps > 0 ? item.spend / item.ps : 0;
        const cpbk = item.bk > 0 ? item.spend / item.bk : 0;
        const cprs = item.rs > 0 ? item.spend / item.rs : 0;
        const convRate = item.inbox > 0 ? (item.ps / item.inbox) * 100 : 0;
        const convBKRate = item.inbox > 0 ? (item.bk / item.inbox) * 100 : 0;
        const convRSRate = item.bk > 0 ? (item.rs / item.bk) * 100 : 0;
        return {
          ...item,
          diff,
          cpi,
          cpps,
          cpbk,
          cprs,
          convRate,
          convBKRate,
          convRSRate,
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredCampaigns, campaignCustomerMap]);

  // Image Upload and Compression (600x600 px)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (เช่น JPG, PNG, WebP)');
      return;
    }

    setImageError('');
    setImageLoading(true);

    try {
      const result = await compressImageTo600x600(file, 600, 600, 0.85);
      setModalImage(result.base64);
      setCompressionInfo({
        orig: result.originalSizeKB,
        comp: result.compressedSizeKB,
      });
    } catch (err) {
      console.error('Image compression error:', err);
      setImageError('เกิดข้อผิดพลาดในการประมวลผลและบีบอัดรูปภาพ');
    } finally {
      setImageLoading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setModalImage('');
    setCompressionInfo(null);
    setImageError('');
  };

  // Modal Handlers
  const openAddModal = () => {
    setEditId(null);
    const targetMonth =
      filterYear && filterMonth
        ? `${filterYear}-${filterMonth}`
        : filterYear
        ? `${filterYear}-${currentMonthNum}`
        : currentYM;
    setModalMonth(targetMonth);
    setModalSalesAgent(filterSales || appData.salesAgents[0] || '');
    setModalCampaignName('');
    setModalCategory(filterCategory || categories[0] || 'MU-X');
    setModalBudget('');
    setModalSpend('');
    setModalInbox('');
    setModalPS('');
    setModalBK('');
    setModalRS('');
    setModalImage('');
    setCompressionInfo(null);
    setImageError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sc: SalesCampaign) => {
    setEditId(sc.id);
    setModalMonth(sc.month);
    setModalSalesAgent(sc.salesAgent);
    setModalCampaignName(sc.campaignName);
    setModalCategory(sc.category);
    setModalBudget(sc.budget);
    setModalSpend(sc.spend);
    setModalInbox(sc.inbox);
    const custInfo = campaignCustomerMap.get(sc.id);
    const initialPS = custInfo && custInfo.ps > 0 ? custInfo.ps : (sc.ps !== undefined && sc.ps !== null ? sc.ps : '');
    const initialBK = custInfo && custInfo.bk > 0 ? custInfo.bk : (sc.bk !== undefined && sc.bk !== null ? sc.bk : '');
    const initialRS = custInfo && custInfo.rs > 0 ? custInfo.rs : (sc.rs !== undefined && sc.rs !== null ? sc.rs : '');
    setModalPS(initialPS);
    setModalBK(initialBK);
    setModalRS(initialRS);
    setModalImage(sc.image || '');
    setCompressionInfo(null);
    setImageError('');
    setIsModalOpen(true);
  };

  const handleDuplicateCampaign = (sc: SalesCampaign) => {
    setEditId(null);
    setModalMonth(currentYM);
    setModalSalesAgent(sc.salesAgent);
    setModalCampaignName(`${sc.campaignName} (คัดลอก)`);
    setModalCategory(sc.category);
    setModalBudget(sc.budget);
    setModalSpend(sc.spend);
    setModalInbox(sc.inbox);
    setModalPS(sc.ps !== undefined && sc.ps !== null ? sc.ps : '');
    setModalBK(sc.bk !== undefined && sc.bk !== null ? sc.bk : '');
    setModalRS(sc.rs !== undefined && sc.rs !== null ? sc.rs : '');
    setModalImage(sc.image || '');
    setCompressionInfo(null);
    setImageError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCompressionInfo(null);
    setImageError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSalesAgent || !modalCampaignName.trim()) return;

    onSaveCampaign({
      id: editId || undefined,
      month: modalMonth,
      salesAgent: modalSalesAgent,
      campaignName: modalCampaignName.trim(),
      category: modalCategory || categories[0] || 'MU-X',
      budget: parseFloat(String(modalBudget)) || 0,
      spend: parseFloat(String(modalSpend)) || 0,
      inbox: parseInt(String(modalInbox), 10) || 0,
      ps: parseInt(String(modalPS), 10) || 0,
      bk: parseInt(String(modalBK), 10) || 0,
      rs: parseInt(String(modalRS), 10) || 0,
      image: modalImage || '',
    });

    closeModal();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterYear(availableYears[0] || currentYearStr);
    setFilterMonth('');
    setFilterSales('');
    setFilterCategory('');
    setSearchQuery('');
  };

  // Export Excel with Details and Summaries
  const handleExportExcel = () => {
    if (filteredCampaigns.length === 0) {
      alert('ไม่มีข้อมูลแคมเปญเพจสาขาสำหรับ Export Excel');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // 1. Sheet รายการแคมเปญทั้งหมด
    const detailRows = filteredCampaigns.map((sc, idx) => {
      const b = Number(sc.budget) || 0;
      const s = Number(sc.spend) || 0;
      const diff = b - s;
      const inb = Number(sc.inbox) || 0;
      const metrics = getCampaignMetrics(sc);
      const psNum = metrics.ps;
      const bkNum = metrics.bk;
      const rsNum = metrics.rs;
      const cpi = metrics.cpi;
      const cpps = metrics.cpps;
      const cpbk = metrics.cpbk;
      const cprs = metrics.cprs;
      const conv = metrics.convInboxPS;
      const convBK = metrics.convInboxBK;
      const convRS = metrics.convBKRS;
      const statusText = s > b ? 'เกินงบประมาณ' : diff === 0 ? 'ใช้พอดิบพอดี' : 'งบคงเหลือ';
      return {
        'ลำดับ': idx + 1,
        'เดือน': sc.month,
        'เซลล์เจ้าของเพจ': sc.salesAgent,
        'ชื่อแคมเปญเพจสาขา': sc.campaignName,
        'ประเภท/รุ่นรถ': sc.category,
        'รูปภาพ': sc.image ? 'มีรูปภาพ (600x600)' : 'ไม่มี',
        'งบประมาณ (บาท)': b,
        'ยอดใช้จ่ายจริง (บาท)': s,
        'ส่วนต่างคงเหลือ (บาท)': diff,
        'สถานะการใช้งบ': statusText,
        'Inbox (ข้อความ)': inb,
        'PS (คน - ตารางลูกค้า)': psNum,
        'BK (จองรถ - ตารางลูกค้า)': bkNum,
        'RS (ออกรถสำเร็จ - ตารางลูกค้า)': rsNum,
        'ต้นทุนต่อ Inbox (บาท)': Number(cpi.toFixed(2)),
        'ต้นทุนต่อ PS (บาท)': Number(cpps.toFixed(2)),
        'ต้นทุนต่อ BK (บาท)': Number(cpbk.toFixed(2)),
        'ต้นทุนต่อ RS (บาท)': Number(cprs.toFixed(2)),
        'อัตราแปลง PS (%)': Number(conv.toFixed(1)),
        'อัตราแปลง BK (%)': Number(convBK.toFixed(1)),
        'อัตราแปลง RS (%)': Number(convRS.toFixed(1)),
      };
    });

    // Summary row for details
    detailRows.push({
      'ลำดับ': 'รวมทั้งหมด' as any,
      'เดือน': `${filteredCampaigns.length} รายการ`,
      'เซลล์เจ้าของเพจ': '-',
      'ชื่อแคมเปญเพจสาขา': 'สรุปภาพรวมแคมเปญเพจสาขา',
      'ประเภท/รุ่นรถ': '-',
      'รูปภาพ': '-',
      'งบประมาณ (บาท)': totalBudget,
      'ยอดใช้จ่ายจริง (บาท)': totalSpend,
      'ส่วนต่างคงเหลือ (บาท)': totalDiff,
      'สถานะการใช้งบ': totalSpend > totalBudget ? 'เกินงบรวม' : 'งบคงเหลือรวม',
      'Inbox (ข้อความ)': totalInbox,
      'PS (คน - ตารางลูกค้า)': totalPS,
      'BK (จองรถ - ตารางลูกค้า)': totalBK,
      'RS (ออกรถสำเร็จ - ตารางลูกค้า)': totalRS,
      'ต้นทุนต่อ Inbox (บาท)': Number(avgCPI.toFixed(2)),
      'ต้นทุนต่อ PS (บาท)': Number(avgCPPS.toFixed(2)),
      'ต้นทุนต่อ BK (บาท)': Number(avgCPBK.toFixed(2)),
      'ต้นทุนต่อ RS (บาท)': Number(avgCPRS.toFixed(2)),
      'อัตราแปลง PS (%)': Number(convInboxToPS.toFixed(1)),
      'อัตราแปลง BK (%)': Number(convInboxToBK.toFixed(1)),
      'อัตราแปลง RS (%)': Number(convBKToRS.toFixed(1)),
    });

    const worksheetDetails = XLSX.utils.json_to_sheet(detailRows);
    worksheetDetails['!cols'] = [
      { wch: 8 },
      { wch: 12 },
      { wch: 18 },
      { wch: 34 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheetDetails, 'รายละเอียดแคมเปญ');

    // 2. Sheet สรุปแยกตามเซลล์
    const salesSummaryRows = salesSummary.map((item, idx) => ({
      'ลำดับ': idx + 1,
      'เซลล์เจ้าของเพจ': item.salesAgent,
      'จำนวนแคมเปญ': item.count,
      'งบประมาณรวม (บาท)': item.budget,
      'ยอดจ่ายจริงรวม (บาท)': item.spend,
      'ส่วนต่าง (บาท)': item.diff,
      'Inbox รวม (ข้อความ)': item.inbox,
      'PS รวม (ตารางลูกค้า)': item.ps,
      'BK รวม (จอง - ตารางลูกค้า)': item.bk,
      'RS รวม (ออกรถ - ตารางลูกค้า)': item.rs,
      'ต้นทุนเฉลี่ย/Inbox (บาท)': Number(item.cpi.toFixed(2)),
      'ต้นทุนเฉลี่ย/PS (บาท)': Number(item.cpps.toFixed(2)),
      'ต้นทุนเฉลี่ย/BK (บาท)': Number(item.cpbk.toFixed(2)),
      'ต้นทุนเฉลี่ย/RS (บาท)': Number(item.cprs.toFixed(2)),
      'แปลงเป็น PS (%)': Number(item.convRate.toFixed(1)),
      'แปลงเป็น BK (%)': Number(item.convBKRate.toFixed(1)),
      'แปลงเป็น RS (%)': Number(item.convRSRate.toFixed(1)),
      'อัตราการใช้งบ (%)': Number(item.usageRate.toFixed(1)),
      'สัดส่วน Inbox (%)': Number(item.inboxShare.toFixed(1)),
    }));
    const worksheetSales = XLSX.utils.json_to_sheet(salesSummaryRows);
    worksheetSales['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheetSales, 'สรุปแยกตามเซลล์');

    // 3. Sheet สรุปค่าใช้จ่ายแยกประเภทแคมเปญ
    const catSummaryRows = categorySummary.map((item, idx) => ({
      'ลำดับ': idx + 1,
      'ประเภทแคมเปญ': item.category,
      'จำนวนแคมเปญ': item.count,
      'งบประมาณรวม (บาท)': item.budget,
      'ยอดจ่ายจริงรวม/ค่าใช้จ่าย (บาท)': item.spend,
      'สัดส่วนค่าใช้จ่าย (%)': Number(item.spendShare.toFixed(1)),
      'เฉลี่ยค่าใช้จ่าย/แคมเปญ (บาท)': Number(item.avgPerCampaign.toFixed(2)),
      'ส่วนต่าง (บาท)': item.diff,
      'Inbox รวม (ข้อความ)': item.inbox,
      'PS รวม (ตารางลูกค้า)': item.ps,
      'BK รวม (จอง - ตารางลูกค้า)': item.bk,
      'RS รวม (ออกรถ - ตารางลูกค้า)': item.rs,
      'ต้นทุนเฉลี่ย/Inbox (บาท)': Number(item.cpi.toFixed(2)),
      'ต้นทุนเฉลี่ย/PS (บาท)': Number(item.cpps.toFixed(2)),
      'ต้นทุนเฉลี่ย/BK (บาท)': Number(item.cpbk.toFixed(2)),
      'ต้นทุนเฉลี่ย/RS (บาท)': Number(item.cprs.toFixed(2)),
      'แปลงเป็น PS (%)': Number(item.convRate.toFixed(1)),
      'แปลงเป็น BK (%)': Number(item.convBKRate.toFixed(1)),
      'แปลงเป็น RS (%)': Number(item.convRSRate.toFixed(1)),
    }));

    // Add summary row for category sheet
    catSummaryRows.push({
      'ลำดับ': 'รวมทั้งหมด' as any,
      'ประเภทแคมเปญ': `${categorySummary.length} ประเภท`,
      'จำนวนแคมเปญ': filteredCampaigns.length,
      'งบประมาณรวม (บาท)': totalBudget,
      'ยอดจ่ายจริงรวม/ค่าใช้จ่าย (บาท)': totalSpend,
      'สัดส่วนค่าใช้จ่าย (%)': 100,
      'เฉลี่ยค่าใช้จ่าย/แคมเปญ (บาท)': filteredCampaigns.length > 0 ? Number((totalSpend / filteredCampaigns.length).toFixed(2)) : 0,
      'ส่วนต่าง (บาท)': totalDiff,
      'Inbox รวม (ข้อความ)': totalInbox,
      'PS รวม (ตารางลูกค้า)': totalPS,
      'BK รวม (จอง - ตารางลูกค้า)': totalBK,
      'RS รวม (ออกรถ - ตารางลูกค้า)': totalRS,
      'ต้นทุนเฉลี่ย/Inbox (บาท)': Number(avgCPI.toFixed(2)),
      'ต้นทุนเฉลี่ย/PS (บาท)': Number(avgCPPS.toFixed(2)),
      'ต้นทุนเฉลี่ย/BK (บาท)': Number(avgCPBK.toFixed(2)),
      'ต้นทุนเฉลี่ย/RS (บาท)': Number(avgCPRS.toFixed(2)),
      'แปลงเป็น PS (%)': Number(convInboxToPS.toFixed(1)),
      'แปลงเป็น BK (%)': Number(convInboxToBK.toFixed(1)),
      'แปลงเป็น RS (%)': Number(convBKToRS.toFixed(1)),
    });

    const worksheetCat = XLSX.utils.json_to_sheet(catSummaryRows);
    worksheetCat['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 14 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheetCat, 'สรุปค่าใช้จ่ายแยกประเภท');

    // 4. Sheet สรุปเปรียบเทียบรายเดือน
    const monthlySummaryRows = monthlySummary.map((item, idx) => ({
      'ลำดับ': idx + 1,
      'เดือน (YYYY-MM)': item.month,
      'จำนวนแคมเปญ': item.count,
      'งบประมาณรวม (บาท)': item.budget,
      'ยอดจ่ายจริงรวม (บาท)': item.spend,
      'ส่วนต่าง (บาท)': item.diff,
      'Inbox รวม (ข้อความ)': item.inbox,
      'PS รวม (ตารางลูกค้า)': item.ps,
      'BK รวม (จอง - ตารางลูกค้า)': item.bk,
      'RS รวม (ออกรถ - ตารางลูกค้า)': item.rs,
      'ต้นทุนเฉลี่ย/Inbox (บาท)': Number(item.cpi.toFixed(2)),
      'ต้นทุนเฉลี่ย/PS (บาท)': Number(item.cpps.toFixed(2)),
      'ต้นทุนเฉลี่ย/BK (บาท)': Number(item.cpbk.toFixed(2)),
      'ต้นทุนเฉลี่ย/RS (บาท)': Number(item.cprs.toFixed(2)),
      'แปลงเป็น PS (%)': Number(item.convRate.toFixed(1)),
      'แปลงเป็น BK (%)': Number(item.convBKRate.toFixed(1)),
      'แปลงเป็น RS (%)': Number(item.convRSRate.toFixed(1)),
    }));
    const worksheetMonthly = XLSX.utils.json_to_sheet(monthlySummaryRows);
    worksheetMonthly['!cols'] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheetMonthly, 'สรุปเปรียบเทียบรายเดือน');

    const fileSuffix = filterMonth ? `${filterYear}-${filterMonth}` : filterYear || 'All';
    XLSX.writeFile(workbook, `Sales_Branch_Campaigns_${fileSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Modal live calculations
  const modalBudgetValue = parseFloat(String(modalBudget)) || 0;
  const modalSpendValue = parseFloat(String(modalSpend)) || 0;
  const modalInboxValue = parseInt(String(modalInbox), 10) || 0;
  const modalPSValue = parseInt(String(modalPS), 10) || 0;
  const modalBKValue = parseInt(String(modalBK), 10) || 0;
  const modalRSValue = parseInt(String(modalRS), 10) || 0;
  const modalDiff = modalBudgetValue - modalSpendValue;
  const modalCPI = modalInboxValue > 0 ? modalSpendValue / modalInboxValue : 0;
  const modalCPPS = modalPSValue > 0 ? modalSpendValue / modalPSValue : 0;
  const modalCPBK = modalBKValue > 0 ? modalSpendValue / modalBKValue : 0;
  const modalCPRS = modalRSValue > 0 ? modalSpendValue / modalRSValue : 0;
  const modalConvRate = modalInboxValue > 0 ? (modalPSValue / modalInboxValue) * 100 : 0;
  const modalConvBKRate = modalInboxValue > 0 ? (modalBKValue / modalInboxValue) * 100 : 0;
  const modalConvRSRate = modalBKValue > 0 ? (modalRSValue / modalBKValue) * 100 : 0;
  const modalUsageRate = modalBudgetValue > 0 ? (modalSpendValue / modalBudgetValue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-700 rounded-xl">
                <Megaphone className="w-5 h-5 text-red-700" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  บันทึกและสรุปข้อมูลแคมเปญเพจสาขา
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  บันทึกแคมเปญโฆษณาเพจเซลล์ คำนวณงบประมาณ ค่าใช้จ่ายจริง ยอด Inbox และต้นทุนต่อ Inbox พร้อมฟิลเตอร์เดือน/ปี
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {canExport && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                title="ดาวน์โหลดข้อมูลแคมเปญเพจสาขาและสรุปยอดเป็น Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel ({filteredCampaigns.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={openAddModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มแคมเปญเพจสาขา</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-red-600" />
              <span>ตัวกรองข้อมูล (Filter Data)</span>
              {(filterMonth || filterSales || filterCategory || searchQuery || filterYear !== currentYearStr) && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                  กรองอยู่
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-slate-200/60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Filter Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
            {/* Year Selector */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                เลือกปี:
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">ทุกปี (All Years)</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector - Dropdown */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                เลือกเดือน (Filter Month):
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.fullName ? `${m.fullName} (${m.value})` : m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Agent Filter */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                เซลล์เจ้าของเพจ:
              </label>
              <select
                value={filterSales}
                onChange={(e) => setFilterSales(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">ทุกเซลล์ (All Agents)</option>
                {appData.salesAgents.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                หมวดหมู่/รุ่นรถ:
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">ทุกประเภท (All Categories)</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Query */}
            <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                ค้นหาแคมเปญ:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อแคมเปญ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pr-7 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Month Filter Bar (12 Months Pills) */}
          <div className="pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-[11px]">
              <span className="font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> ทางลัดเดือน:
              </span>
              <button
                type="button"
                onClick={() => setFilterMonth('')}
                className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                  filterMonth === ''
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ทุกเดือน
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterYear(currentYearStr);
                  setFilterMonth(currentMonthNum);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition flex items-center gap-1 ${
                  filterYear === currentYearStr && filterMonth === currentMonthNum
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                เดือนนี้ ({currentMonthNum})
              </button>

              {months.slice(1).map((m) => {
                const isActive = filterMonth === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setFilterMonth(m.value)}
                    className={`px-2 py-1 rounded-lg font-medium shrink-0 transition ${
                      isActive
                        ? 'bg-red-700 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* High-level KPI Summary Cards - ครอบคลุม Budget, Spend, Inbox, PS, BK และอัตราการแปลง */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
          {/* 1. Total Budget */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>งบประมาณรวม</span>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg md:text-xl font-bold text-slate-900 mt-1 font-mono">
              ฿{formatNum(totalBudget)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>แคมเปญ:</span>
              <span className="font-bold text-slate-700 font-mono">{filteredCampaigns.length} รายการ</span>
            </div>
          </div>

          {/* 2. Total Spend */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>ยอดจ่ายจริงรวม</span>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg md:text-xl font-bold text-slate-900 mt-1 font-mono">
              ฿{formatNum(totalSpend)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>อัตราการใช้งบ:</span>
              <span className={`font-bold font-mono ${budgetUsageRate > 100 ? 'text-rose-600' : 'text-slate-700'}`}>
                {budgetUsageRate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 3. Budget Variance (Diff) */}
          <div
            className={`border p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between ${
              totalDiff >= 0
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/60 border-rose-200 text-rose-900'
            }`}
          >
            <div className="text-xs font-semibold flex items-center justify-between opacity-80">
              <span>{totalDiff >= 0 ? 'งบคงเหลือรวม' : 'ยอดเกินงบ'}</span>
              {totalDiff >= 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div
              className={`text-lg md:text-xl font-bold mt-1 font-mono ${
                totalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              ฿{formatNum(Math.abs(totalDiff))}
            </div>
            <div className="text-[11px] opacity-80 mt-1">
              {totalDiff >= 0 ? 'อยู่ในกรอบงบ' : 'เกินงบประมาณ'}
            </div>
          </div>

          {/* 4. Total Inbox */}
          <div className="bg-sky-50/70 border border-sky-200 p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs text-sky-800 font-semibold flex items-center justify-between">
              <span>Inbox ข้อความรวม</span>
              <MessageSquare className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-lg md:text-xl font-bold text-sky-900 mt-1 font-mono">
              {formatNum(totalInbox)} <span className="text-xs font-normal text-sky-700">ข้อความ</span>
            </div>
            <div className="text-[11px] text-sky-700 mt-1 flex items-center justify-between">
              <span>ต้นทุน/Inbox:</span>
              <span className="font-bold font-mono">฿{formatNum(avgCPI)}</span>
            </div>
          </div>

          {/* 5. Total PS (Prospects - ดึงจากตารางลูกค้า) */}
          <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs text-indigo-800 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="bg-indigo-600 text-white text-[9px] px-1 rounded font-bold">PS</span>
                <span>PS (ตารางลูกค้า)</span>
              </span>
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-lg md:text-xl font-bold text-indigo-950 mt-1 font-mono">
              {formatNum(totalPS)} <span className="text-xs font-normal text-indigo-700">คน</span>
            </div>
            <div className="text-[11px] text-indigo-800 mt-1 flex items-center justify-between">
              <span>ต้นทุนเฉลี่ย/PS:</span>
              <span className="font-bold font-mono text-indigo-900">
                {totalPS > 0 ? `฿${formatNum(avgCPPS)}` : '-'}
              </span>
            </div>
          </div>

          {/* 6. Total BK (Bookings - ดึงจากตารางลูกค้า) */}
          <div className="bg-amber-50/80 border border-amber-300 p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-2xs">
            <div className="text-xs text-amber-900 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">BK</span>
                <span>BK (จอง) ตารางลูกค้า</span>
              </span>
              <BookmarkCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg md:text-xl font-bold text-amber-950 mt-1 font-mono">
              {formatNum(totalBK)} <span className="text-xs font-normal text-amber-800">คัน/คน</span>
            </div>
            <div className="text-[11px] text-amber-800 mt-1 flex items-center justify-between">
              <span>ต้นทุนเฉลี่ย/BK:</span>
              <span className="font-bold font-mono text-amber-950">
                {totalBK > 0 ? `฿${formatNum(avgCPBK)}` : '-'}
              </span>
            </div>
          </div>

          {/* 7. Total RS (Retail Sales / ออกรถสำเร็จ - ดึงจากตารางลูกค้า) */}
          <div className="bg-emerald-50/80 border border-emerald-300 p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-2xs">
            <div className="text-xs text-emerald-900 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">RS</span>
                <span>RS (ออกรถ) ตารางลูกค้า</span>
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg md:text-xl font-bold text-emerald-950 mt-1 font-mono">
              {formatNum(totalRS)} <span className="text-xs font-normal text-emerald-800">คัน</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-1 flex items-center justify-between">
              <span>ต้นทุนเฉลี่ย/RS:</span>
              <span className="font-bold font-mono text-emerald-950">
                {totalRS > 0 ? `฿${formatNum(avgCPRS)}` : '-'}
              </span>
            </div>
          </div>

          {/* 8. Conversion Rates: Inbox ➔ PS / BK ➔ RS */}
          <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs text-purple-900 font-semibold flex items-center justify-between">
              <span>แปลง BK ➔ RS (ส่งมอบ)</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg md:text-xl font-bold text-purple-950 mt-1 font-mono">
              {convBKToRS.toFixed(1)}%
            </div>
            <div className="text-[11px] text-purple-800 mt-1 truncate">
              Inbox ➔ RS: <span className="font-bold font-mono">{convInboxToRS.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* ช่องรายงานสรุปค่าใช้จ่ายแยกตามประเภทแคมเปญ (Campaign Expense by Category Report) */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-red-50/20 rounded-2xl border border-slate-200 p-4 mb-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-100 text-red-700 shadow-2xs">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>ช่องรายงานสรุปค่าใช้จ่ายแยกตามประเภทแคมเปญ</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-mono">
                    {categorySummary.length} ประเภท
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">
                    (รวมค่าใช้จ่าย: <strong className="text-red-700 font-mono">฿{formatNum(totalSpend)}</strong>)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  สรุปรวมค่าใช้จ่ายจริง (ยอดจ่ายจริง) งบประมาณ และสัดส่วนค่าใช้จ่ายของแต่ละประเภทแคมเปญ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setViewMode('category_summary')}
                className="text-xs text-red-700 hover:text-red-900 font-semibold px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ดูตารางสรุปละเอียด</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryWidget(!showCategoryWidget)}
                className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-200 bg-white"
                title={showCategoryWidget ? 'ย่อช่องรายงาน' : 'ขยายช่องรายงาน'}
              >
                {showCategoryWidget ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showCategoryWidget && (
            <>
              {categorySummary.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  ไม่มีข้อมูลแคมเปญในช่วงเวลาหรือเงื่อนไขที่เลือก
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {categorySummary.map((item) => {
                    const catColor = appData.categoryColors[item.category] || '#ef4444';
                    const isSelected = filterCategory === item.category;

                    return (
                      <div
                        key={item.category}
                        onClick={() => {
                          setFilterCategory(isSelected ? '' : item.category);
                        }}
                        className={`bg-white rounded-xl p-3.5 border transition cursor-pointer relative overflow-hidden group hover:shadow-sm flex flex-col justify-between ${
                          isSelected
                            ? 'border-red-500 ring-2 ring-red-400 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        title="คลิกเพื่อกรองตารางแคมเปญเฉพาะประเภทนี้"
                      >
                        <div>
                          {/* Header badge & count */}
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="px-2.5 py-0.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${catColor}15`,
                                borderColor: `${catColor}40`,
                                color: catColor,
                              }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                              <span>{item.category}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 font-mono">
                              {item.count} แคมเปญ
                            </span>
                          </div>

                          {/* รวมค่าใช้จ่าย (Total Spend) */}
                          <div className="mb-2">
                            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                              <span>รวมค่าใช้จ่ายจริง:</span>
                              <span className="text-[11px] font-bold text-slate-700 font-mono">
                                {item.spendShare.toFixed(1)}% ของทั้งหมด
                              </span>
                            </div>
                            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                              ฿{formatNum(item.spend)}
                            </div>
                          </div>

                          {/* Progress bar of spend share */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(4, item.spendShare))}%`,
                                backgroundColor: catColor,
                              }}
                            />
                          </div>

                          {/* Budget & Variance */}
                          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">งบประมาณรวม:</span>
                              <span className="font-semibold text-slate-700 font-mono">
                                ฿{formatNum(item.budget)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px]">ส่วนต่างงบ:</span>
                              <span
                                className={`font-semibold font-mono ${
                                  item.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {item.diff >= 0 ? `+฿${formatNum(item.diff)}` : `-฿${formatNum(Math.abs(item.diff))}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Customer Funnel Metrics (ดึงจากตารางลูกค้า: PS, BK, RS) */}
                        <div className="grid grid-cols-4 gap-1 bg-slate-50/90 p-1.5 rounded-xl text-center font-mono text-[11px] mt-2.5 border border-slate-100">
                          <div className="bg-white rounded-lg p-1 border border-slate-200/60 shadow-2xs">
                            <span className="text-[10px] text-sky-700 block font-semibold">Inbox</span>
                            <span className="font-extrabold text-sky-950">{formatNum(item.inbox)}</span>
                          </div>
                          <div className="bg-indigo-50/60 rounded-lg p-1 border border-indigo-200/80 shadow-2xs">
                            <span className="text-[10px] text-indigo-700 block font-bold">PS</span>
                            <span className="font-extrabold text-indigo-950">{formatNum(item.ps)}</span>
                          </div>
                          <div className="bg-amber-50/60 rounded-lg p-1 border border-amber-200/80 shadow-2xs">
                            <span className="text-[10px] text-amber-700 block font-bold">BK</span>
                            <span className="font-extrabold text-amber-950">{formatNum(item.bk)}</span>
                          </div>
                          <div className="bg-emerald-50/60 rounded-lg p-1 border border-emerald-200/80 shadow-2xs">
                            <span className="text-[10px] text-emerald-700 block font-bold">RS</span>
                            <span className="font-extrabold text-emerald-950">{formatNum(item.rs)}</span>
                          </div>
                        </div>

                        {/* Performance metrics footer with Costs & Conversions */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-slate-100 text-[10px] text-slate-600">
                          <span className="text-slate-500">ต้นทุน:</span>
                          <span className="flex items-center gap-1.5 font-mono text-[10px]">
                            <span className="text-indigo-700 font-bold" title="ต้นทุนเฉลี่ยต่อ PS">
                              {item.ps > 0 ? `฿${formatNum(item.cpps)}` : '-'}/PS
                            </span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold" title="ต้นทุนเฉลี่ยต่อ BK (จอง)">
                              {item.bk > 0 ? `฿${formatNum(item.cpbk)}` : '-'}/BK
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold" title="ต้นทุนเฉลี่ยต่อ RS (ออกรถ)">
                              {item.rs > 0 ? `฿${formatNum(item.cprs)}` : '-'}/RS
                            </span>
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                            กำลังกรอง
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary Strip */}
              {categorySummary.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-100/70 p-2.5 rounded-xl">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">รวมค่าใช้จ่ายทุกประเภท:</span>
                      <strong className="text-slate-900 font-mono text-sm">฿{formatNum(totalSpend)}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">รวมงบประมาณ:</span>
                      <span className="text-slate-700 font-mono font-semibold">฿{formatNum(totalBudget)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">ประเภทที่ใช้จ่ายสูงสุด:</span>
                      <span className="font-bold text-red-700">
                        {categorySummary[0]?.category} (฿{formatNum(categorySummary[0]?.spend)})
                      </span>
                    </div>
                  </div>

                  {filterCategory && (
                    <button
                      type="button"
                      onClick={() => setFilterCategory('')}
                      className="text-[11px] text-red-600 hover:text-red-800 font-semibold underline cursor-pointer"
                    >
                      ล้างตัวกรองประเภท ({filterCategory})
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* View Mode Tabs (สลับมุมมอง รายการแคมเปญ / สรุปแยกตามเซลล์ / รายงานค่าใช้จ่ายแยกประเภท / สรุปรายเดือน) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>รายการแคมเปญทั้งหมด ({filteredCampaigns.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('sales_summary')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'sales_summary'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>สรุปแยกตามเซลล์ / เพจสาขา ({salesSummary.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('category_summary')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'category_summary'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>รายงานค่าใช้จ่ายแยกประเภทแคมเปญ ({categorySummary.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('monthly_summary')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'monthly_summary'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>สรุปรายเดือน ({monthlySummary.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            ช่วงเวลา:{' '}
            <span className="font-bold text-red-700">
              {filterYear ? `ปี ${filterYear}` : 'ทุกปี'}
              {filterMonth ? ` / ${months.find((m) => m.value === filterMonth)?.fullName || filterMonth}` : ' (ทุกเดือน)'}
            </span>
          </div>
        </div>

        {/* View 1: Detailed Table (ตารางแคมเปญทั้งหมด) */}
        {viewMode === 'table' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-red-700 text-white font-semibold">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 text-center w-14">รูปภาพ</th>
                    <th className="p-3">เดือน</th>
                    <th className="p-3">เซลล์เจ้าของเพจ</th>
                    <th className="p-3">ชื่อแคมเปญเพจสาขา</th>
                    <th className="p-3">ประเภท</th>
                    <th className="p-3 text-right">งบประมาณ</th>
                    <th className="p-3 text-right">ยอดจ่ายจริง</th>
                    <th className="p-3 text-right">ส่วนต่าง</th>
                    <th className="p-3 text-center">Inbox</th>
                    <th className="p-3 text-center">PS (ลูกค้า)</th>
                    <th className="p-3 text-center">BK (จอง)</th>
                    <th className="p-3 text-center">RS (ออกรถ)</th>
                    <th className="p-3 text-right">ต้นทุน/Inbox</th>
                    <th className="p-3 text-right">ต้นทุน/PS</th>
                    <th className="p-3 text-right">ต้นทุน/BK</th>
                    <th className="p-3 text-right">ต้นทุน/RS</th>
                    <th className="p-3 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="text-center py-10 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Megaphone className="w-8 h-8 text-slate-300" />
                          <p>ไม่พบข้อมูลแคมเปญเพจสาขาตามเงื่อนไขที่เลือก</p>
                          <button
                            type="button"
                            onClick={openAddModal}
                            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 underline"
                          >
                            + เพิ่มข้อมูลแคมเปญใหม่ตอนนี้
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((sc, idx) => {
                      const b = Number(sc.budget) || 0;
                      const s = Number(sc.spend) || 0;
                      const diff = b - s;
                      const inb = Number(sc.inbox) || 0;
                      const metrics = getCampaignMetrics(sc);
                      const psNum = metrics.ps;
                      const bkNum = metrics.bk;
                      const rsNum = metrics.rs;
                      const cpi = metrics.cpi;
                      const cpps = metrics.cpps;
                      const cpbk = metrics.cpbk;
                      const cprs = metrics.cprs;
                      const isOver = s > b;

                      return (
                        <tr key={sc.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                          <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-2 text-center whitespace-nowrap">
                            {sc.image ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage({
                                    url: sc.image!,
                                    title: sc.campaignName,
                                    agent: sc.salesAgent,
                                    month: sc.month,
                                    category: sc.category,
                                  })
                                }
                                className="relative group block mx-auto cursor-pointer"
                                title="คลิกดูรูปแคมเปญ 600x600 px"
                              >
                                <img
                                  src={sc.image}
                                  alt={sc.campaignName}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-xs group-hover:scale-105 group-hover:border-red-400 transition"
                                />
                                <span className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-300 border border-slate-200/60" title="ไม่มีรูปภาพ">
                                <ImageIcon className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-slate-700 font-mono whitespace-nowrap">
                            {sc.month}
                          </td>
                          <td className="p-3 font-bold text-red-700 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setFilterSales(sc.salesAgent)}
                              className="hover:underline text-left"
                              title="คลิกเพื่อกรองเฉพาะเซลล์นี้"
                            >
                              {sc.salesAgent}
                            </button>
                          </td>
                          <td className="p-3 font-semibold text-slate-900 max-w-xs">
                            <span className="line-clamp-2" title={sc.campaignName}>
                              {sc.campaignName}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              onClick={() => setFilterCategory(sc.category)}
                              className="px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer hover:opacity-80 transition inline-block"
                              style={{
                                backgroundColor: `${appData.categoryColors[sc.category] || '#ef4444'}15`,
                                borderColor: `${appData.categoryColors[sc.category] || '#ef4444'}50`,
                                color: appData.categoryColors[sc.category] || '#ef4444',
                              }}
                              title="คลิกเพื่อกรองหมวดหมู่นี้"
                            >
                              {sc.category}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                            ฿{formatNum(b)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            ฿{formatNum(s)}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-semibold whitespace-nowrap ${
                              isOver ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {diff >= 0 ? `+฿${formatNum(diff)}` : `-฿${formatNum(Math.abs(diff))}`}
                          </td>
                          <td className="p-3 text-center font-bold text-sky-800 font-mono whitespace-nowrap">
                            {formatNum(inb)}
                          </td>
                          <td className="p-3 text-center font-mono font-bold whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (metrics.customers.length > 0) {
                                  setCustomerListModal({
                                    title: `ลูกค้าสถานะ PS (${metrics.ps} คน)`,
                                    campaignName: sc.campaignName,
                                    customers: metrics.customers.filter(
                                      (c) => c.status === 'PS' || (c.statusHistory && c.statusHistory.some((h) => h.status === 'PS'))
                                    ),
                                  });
                                }
                              }}
                              className={`inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-indigo-900 transition ${
                                metrics.customers.length > 0 ? 'hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer shadow-2xs' : ''
                              }`}
                              title={metrics.hasCustData ? `ดึงจากตารางลูกค้า: ${metrics.ps} คน (คลิกดูรายชื่อ)` : `ระบุในแคมเปญ: ${metrics.ps} คน`}
                            >
                              <span>{formatNum(psNum)}</span>
                              {metrics.hasCustData && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="ดึงจากตารางลูกค้า" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center font-mono font-bold whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (metrics.customers.length > 0) {
                                  setCustomerListModal({
                                    title: `ลูกค้าสถานะ BK จองรถ (${metrics.bk} คัน/คน)`,
                                    campaignName: sc.campaignName,
                                    customers: metrics.customers.filter(
                                      (c) => c.status === 'BK' || (c.statusHistory && c.statusHistory.some((h) => h.status === 'BK'))
                                    ),
                                  });
                                }
                              }}
                              className={`inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-900 transition ${
                                metrics.customers.length > 0 ? 'hover:bg-amber-100 hover:border-amber-300 cursor-pointer shadow-2xs' : ''
                              }`}
                              title={metrics.hasCustData ? `ดึงจากตารางลูกค้า: ${metrics.bk} คัน (คลิกดูรายชื่อ)` : `ระบุในแคมเปญ: ${metrics.bk} คัน`}
                            >
                              <span>{formatNum(bkNum)}</span>
                              {metrics.hasCustData && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="ดึงจากตารางลูกค้า" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center font-mono font-bold whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (metrics.customers.length > 0) {
                                  setCustomerListModal({
                                    title: `ลูกค้าสถานะ RS ออกรถสำเร็จ (${metrics.rs} คัน)`,
                                    campaignName: sc.campaignName,
                                    customers: metrics.customers.filter(
                                      (c) => c.status === 'RS' || (c.statusHistory && c.statusHistory.some((h) => h.status === 'RS'))
                                    ),
                                  });
                                }
                              }}
                              className={`inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-emerald-900 transition ${
                                metrics.customers.length > 0 ? 'hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer shadow-2xs' : ''
                              }`}
                              title={metrics.hasCustData ? `ดึงจากตารางลูกค้า: ${metrics.rs} คัน (คลิกดูรายชื่อ)` : `ระบุในแคมเปญ: ${metrics.rs} คัน`}
                            >
                              <span>{formatNum(rsNum)}</span>
                              {metrics.hasCustData && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="ดึงจากตารางลูกค้า" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-right font-bold text-red-700 font-mono whitespace-nowrap">
                            ฿{formatNum(cpi)}
                          </td>
                          <td className="p-3 text-right font-bold text-indigo-700 font-mono whitespace-nowrap">
                            {psNum > 0 ? `฿${formatNum(cpps)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-amber-700 font-mono whitespace-nowrap">
                            {bkNum > 0 ? `฿${formatNum(cpbk)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700 font-mono whitespace-nowrap">
                            {rsNum > 0 ? `฿${formatNum(cprs)}` : '-'}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleDuplicateCampaign(sc)}
                                title="คัดลอกแคมเปญนี้เพื่อลงเดือนใหม่"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(sc)}
                                title="แก้ไขข้อมูลแคมเปญ"
                                className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`ยืนยันการลบแคมเปญ "${sc.campaignName}" หรือไม่?`)) {
                                    onDeleteCampaign(sc.id);
                                  }
                                }}
                                title="ลบข้อมูลแคมเปญ"
                                className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
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

                {/* Table Footer with Summary */}
                {filteredCampaigns.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-800">
                    <tr>
                      <td colSpan={6} className="p-3 text-right">
                        สรุปรวมทั้งหมด ({filteredCampaigns.length} รายการ):
                      </td>
                      <td className="p-3 text-right font-mono text-slate-900">
                        ฿{formatNum(totalBudget)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-900">
                        ฿{formatNum(totalSpend)}
                      </td>
                      <td
                        className={`p-3 text-right font-mono ${
                          totalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {totalDiff >= 0 ? `+฿${formatNum(totalDiff)}` : `-฿${formatNum(Math.abs(totalDiff))}`}
                      </td>
                      <td className="p-3 text-center font-mono text-sky-800">
                        {formatNum(totalInbox)}
                      </td>
                      <td className="p-3 text-center font-mono text-indigo-900 font-bold">
                        {formatNum(totalPS)}
                      </td>
                      <td className="p-3 text-center font-mono text-amber-900 font-bold">
                        {formatNum(totalBK)}
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-900 font-bold">
                        {formatNum(totalRS)}
                      </td>
                      <td className="p-3 text-right font-mono text-red-700">
                        ฿{formatNum(avgCPI)}
                      </td>
                      <td className="p-3 text-right font-mono text-indigo-700 font-bold">
                        ฿{formatNum(avgCPPS)}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-700 font-bold">
                        ฿{formatNum(avgCPBK)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                        ฿{formatNum(avgCPRS)}
                      </td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* View 2: Summary by Sales Agent (สรุปแยกตามเซลล์ / เพจสาขา) */}
        {viewMode === 'sales_summary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                ตารางสรุปประสิทธิภาพแคมเปญเพจแยกตามเซลล์และสาขา
              </span>
              <span>เรียงตามยอด Inbox สูงสุด</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-red-700 text-white font-semibold">
                  <tr>
                    <th className="p-3 w-10 text-center">อันดับ</th>
                    <th className="p-3">เซลล์เจ้าของเพจ</th>
                    <th className="p-3 text-center">จำนวนแคมเปญ</th>
                    <th className="p-3 text-right">งบประมาณรวม</th>
                    <th className="p-3 text-right">ยอดจ่ายจริงรวม</th>
                    <th className="p-3 text-right">ส่วนต่างคงเหลือ</th>
                    <th className="p-3 text-center">Inbox รวม</th>
                    <th className="p-3 text-center">PS รวม (ลูกค้า)</th>
                    <th className="p-3 text-center">BK รวม (จอง)</th>
                    <th className="p-3 text-center">RS รวม (ออกรถ)</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/Inbox</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/PS</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/BK</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/RS</th>
                    <th className="p-3 text-center">แปลงเป็น PS</th>
                    <th className="p-3 text-center">แปลงเป็น BK</th>
                    <th className="p-3 text-center">แปลงเป็น RS</th>
                    <th className="p-3 text-center">อัตราการใช้งบ</th>
                    <th className="p-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {salesSummary.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="text-center py-8 text-slate-400">
                        ไม่มีข้อมูลสรุปตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    salesSummary.map((item, idx) => {
                      const isTop = idx === 0 && item.inbox > 0;
                      const isOver = item.spend > item.budget && item.budget > 0;

                      return (
                        <tr key={item.salesAgent} className="hover:bg-slate-50 transition border-b border-slate-100">
                          <td className="p-3 text-center">
                            {isTop ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                                🏆
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">{idx + 1}</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{item.salesAgent}</span>
                              {isTop && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Top Inbox
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-700">
                            {item.count}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            ฿{formatNum(item.budget)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ฿{formatNum(item.spend)}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-semibold ${
                              item.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.diff >= 0 ? `+฿${formatNum(item.diff)}` : `-฿${formatNum(Math.abs(item.diff))}`}
                          </td>
                          <td className="p-3 text-center font-bold text-sky-800 font-mono">
                            {formatNum(item.inbox)}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-900">
                            <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[11px]">
                              {formatNum(item.ps)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-900">
                            <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                              {formatNum(item.bk)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-900">
                            <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px]">
                              {formatNum(item.rs)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-red-700">
                            ฿{formatNum(item.cpi)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-700">
                            {item.ps > 0 ? `฿${formatNum(item.cpps)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {item.bk > 0 ? `฿${formatNum(item.cpbk)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {item.rs > 0 ? `฿${formatNum(item.cprs)}` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-700">
                            {item.convRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-amber-700">
                            {item.convBKRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-emerald-700">
                            {item.convRSRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isOver
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {item.usageRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterSales(item.salesAgent);
                                setViewMode('table');
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                            >
                              ดูรายการแคมเปญ
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {salesSummary.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={2} className="p-3 text-slate-700">สรุปรวมทั้งหมด ({salesSummary.length} ท่าน):</td>
                      <td className="p-3 text-center font-mono">{filteredCampaigns.length}</td>
                      <td className="p-3 text-right font-mono">฿{formatNum(totalBudget)}</td>
                      <td className="p-3 text-right font-mono text-slate-900">฿{formatNum(totalSpend)}</td>
                      <td className={`p-3 text-right font-mono ${totalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {totalDiff >= 0 ? `+฿${formatNum(totalDiff)}` : `-฿${formatNum(Math.abs(totalDiff))}`}
                      </td>
                      <td className="p-3 text-center font-mono text-sky-800">{formatNum(totalInbox)}</td>
                      <td className="p-3 text-center font-mono text-indigo-900">{formatNum(totalPS)}</td>
                      <td className="p-3 text-center font-mono text-amber-900">{formatNum(totalBK)}</td>
                      <td className="p-3 text-center font-mono text-emerald-900">{formatNum(totalRS)}</td>
                      <td className="p-3 text-right font-mono text-red-700">฿{formatNum(avgCPI)}</td>
                      <td className="p-3 text-right font-mono text-indigo-700">฿{formatNum(avgCPPS)}</td>
                      <td className="p-3 text-right font-mono text-amber-700">฿{formatNum(avgCPBK)}</td>
                      <td className="p-3 text-right font-mono text-emerald-700">฿{formatNum(avgCPRS)}</td>
                      <td className="p-3 text-center font-mono">{convInboxToPS.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-amber-700">{convInboxToBK.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-emerald-700">{convBKToRS.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-slate-700">{budgetUsageRate.toFixed(1)}%</td>
                      <td className="p-3 text-center text-slate-400">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* View 3: Summary by Category (รายงานค่าใช้จ่ายแยกประเภทแคมเปญ) */}
        {viewMode === 'category_summary' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 mb-2 gap-2">
              <span className="font-semibold flex items-center gap-1.5 text-slate-800">
                <Layers className="w-4 h-4 text-red-600" />
                ตารางรายงานสรุปค่าใช้จ่ายและประสิทธิภาพ แยกตามประเภทแคมเปญ (Campaign Expense & Performance by Category)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                รวมค่าใช้จ่ายทั้งหมด: <strong className="text-red-700 font-mono text-xs">฿{formatNum(totalSpend)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-red-700 text-white font-semibold">
                  <tr>
                    <th className="p-3">ประเภท / รุ่นรถ</th>
                    <th className="p-3 text-center">จำนวนแคมเปญ</th>
                    <th className="p-3 text-right">งบประมาณรวม</th>
                    <th className="p-3 text-right bg-red-800/80">ยอดจ่ายจริงรวม (ค่าใช้จ่าย)</th>
                    <th className="p-3 text-right">สัดส่วนค่าใช้จ่าย</th>
                    <th className="p-3 text-right">ส่วนต่างงบ</th>
                    <th className="p-3 text-center">Inbox รวม</th>
                    <th className="p-3 text-center">PS รวม (ลูกค้า)</th>
                    <th className="p-3 text-center">BK รวม (จอง)</th>
                    <th className="p-3 text-center">RS รวม (ออกรถ)</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/Inbox</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/PS</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/BK</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/RS</th>
                    <th className="p-3 text-center">แปลงเป็น PS</th>
                    <th className="p-3 text-center">แปลงเป็น BK</th>
                    <th className="p-3 text-center">แปลงเป็น RS</th>
                    <th className="p-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {categorySummary.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="text-center py-8 text-slate-400">
                        ไม่มีข้อมูลแคมเปญตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    categorySummary.map((item) => {
                      // Filter all customers in this category
                      const categoryCustomers = (appData.customers || []).filter((c) => {
                        const matchCat = c.category === item.category;
                        const matchYear = !filterYear || c.contactDate.startsWith(filterYear);
                        const matchMonth = !filterMonth || c.contactDate.substring(5, 7) === filterMonth;
                        const matchSales = !filterSales || c.salesAgent === filterSales;
                        return matchCat && matchYear && matchMonth && matchSales;
                      });

                      return (
                        <tr key={item.category} className="hover:bg-slate-50 transition border-b border-slate-100">
                          <td className="p-3 font-bold">
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-bold border inline-block"
                              style={{
                                backgroundColor: `${appData.categoryColors[item.category] || '#ef4444'}15`,
                                borderColor: `${appData.categoryColors[item.category] || '#ef4444'}50`,
                                color: appData.categoryColors[item.category] || '#ef4444',
                              }}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-700">
                            {item.count}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            ฿{formatNum(item.budget)}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-slate-50/60">
                            ฿{formatNum(item.spend)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-red-700">
                            {item.spendShare.toFixed(1)}%
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-semibold ${
                              item.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.diff >= 0 ? `+฿${formatNum(item.diff)}` : `-฿${formatNum(Math.abs(item.diff))}`}
                          </td>
                          <td className="p-3 text-center font-bold text-sky-800 font-mono">
                            {formatNum(item.inbox)}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-900">
                            <button
                              type="button"
                              onClick={() => {
                                if (categoryCustomers.length > 0) {
                                  setCustomerListModal({
                                    title: `ลูกค้าประเภท ${item.category} สถานะ PS (${item.ps} คน)`,
                                    campaignName: `ประเภทแคมเปญ: ${item.category}`,
                                    customers: categoryCustomers.filter(
                                      (c) => c.status === 'PS' || (c.statusHistory && c.statusHistory.some((h) => h.status === 'PS'))
                                    ),
                                  });
                                }
                              }}
                              className={`bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                                categoryCustomers.length > 0 ? 'hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer shadow-2xs' : ''
                              }`}
                              title={`ดึงจากตารางลูกค้า: ${item.ps} คน (คลิกดูรายชื่อ)`}
                            >
                              <span>{formatNum(item.ps)}</span>
                              {categoryCustomers.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-900">
                            <button
                              type="button"
                              onClick={() => {
                                if (categoryCustomers.length > 0) {
                                  setCustomerListModal({
                                    title: `ลูกค้าประเภท ${item.category} สถานะ BK จองรถ (${item.bk} คัน/คน)`,
                                    campaignName: `ประเภทแคมเปญ: ${item.category}`,
                                    customers: categoryCustomers.filter(
                                      (c) => c.status === 'BK' || (c.statusHistory && c.statusHistory.some((h) => h.status === 'BK'))
                                    ),
                                  });
                                }
                              }}
                              className={`bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                                categoryCustomers.length > 0 ? 'hover:bg-amber-100 hover:border-amber-300 cursor-pointer shadow-2xs' : ''
                              }`}
                              title={`ดึงจากตารางลูกค้า: ${item.bk} คัน (คลิกดูรายชื่อ)`}
                            >
                              <span>{formatNum(item.bk)}</span>
                              {categoryCustomers.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-900">
                            <button
                              type="button"
                              onClick={() => {
                                if (categoryCustomers.length > 0) {
                                  setCustomerListModal({
                                    title: `ลูกค้าประเภท ${item.category} สถานะ RS ออกรถสำเร็จ (${item.rs} คัน)`,
                                    campaignName: `ประเภทแคมเปญ: ${item.category}`,
                                    customers: categoryCustomers.filter(
                                      (c) => c.status === 'RS' || (c.statusHistory && c.statusHistory.some((h) => h.status === 'RS'))
                                    ),
                                  });
                                }
                              }}
                              className={`bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                                categoryCustomers.length > 0 ? 'hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer shadow-2xs' : ''
                              }`}
                              title={`ดึงจากตารางลูกค้า: ${item.rs} คัน (คลิกดูรายชื่อ)`}
                            >
                              <span>{formatNum(item.rs)}</span>
                              {categoryCustomers.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-red-700">
                            ฿{formatNum(item.cpi)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-700">
                            {item.ps > 0 ? `฿${formatNum(item.cpps)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {item.bk > 0 ? `฿${formatNum(item.cpbk)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {item.rs > 0 ? `฿${formatNum(item.cprs)}` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-700">
                            {item.convRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-amber-700">
                            {item.convBKRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-emerald-700">
                            {item.convRSRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterCategory(item.category);
                                setViewMode('table');
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold underline cursor-pointer"
                            >
                              ดูรายการแคมเปญ
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {categorySummary.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td className="p-3 text-red-800">รวมทุกประเภทแคมเปญ</td>
                      <td className="p-3 text-center font-mono">{filteredCampaigns.length}</td>
                      <td className="p-3 text-right font-mono">฿{formatNum(totalBudget)}</td>
                      <td className="p-3 text-right font-mono text-red-700 text-sm">฿{formatNum(totalSpend)}</td>
                      <td className="p-3 text-right font-mono text-red-700">100.0%</td>
                      <td
                        className={`p-3 text-right font-mono ${
                          totalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {totalDiff >= 0 ? `+฿${formatNum(totalDiff)}` : `-฿${formatNum(Math.abs(totalDiff))}`}
                      </td>
                      <td className="p-3 text-center font-mono text-sky-800">{formatNum(totalInbox)}</td>
                      <td className="p-3 text-center font-mono text-indigo-900">{formatNum(totalPS)}</td>
                      <td className="p-3 text-center font-mono text-amber-900">{formatNum(totalBK)}</td>
                      <td className="p-3 text-center font-mono text-emerald-900">{formatNum(totalRS)}</td>
                      <td className="p-3 text-right font-mono text-red-700">฿{formatNum(avgCPI)}</td>
                      <td className="p-3 text-right font-mono text-indigo-700">฿{formatNum(avgCPPS)}</td>
                      <td className="p-3 text-right font-mono text-amber-700">฿{formatNum(avgCPBK)}</td>
                      <td className="p-3 text-right font-mono text-emerald-700">฿{formatNum(avgCPRS)}</td>
                      <td className="p-3 text-center font-mono">{convInboxToPS.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-amber-700">{convInboxToBK.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-emerald-700">{convBKToRS.toFixed(1)}%</td>
                      <td className="p-3 text-center text-slate-400">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* View 4: Monthly Summary (สรุปเปรียบเทียบรายเดือน) */}
        {viewMode === 'monthly_summary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-600" />
                ตารางสรุปเปรียบเทียบสถิติและค่าใช้จ่ายรายเดือน (Monthly Comparison)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-red-700 text-white font-semibold">
                  <tr>
                    <th className="p-3">เดือน (YYYY-MM)</th>
                    <th className="p-3 text-center">จำนวนแคมเปญ</th>
                    <th className="p-3 text-right">งบประมาณรวม</th>
                    <th className="p-3 text-right">ยอดจ่ายจริงรวม</th>
                    <th className="p-3 text-right">ส่วนต่าง</th>
                    <th className="p-3 text-center">Inbox รวม</th>
                    <th className="p-3 text-center">PS รวม (ลูกค้า)</th>
                    <th className="p-3 text-center">BK รวม (จอง)</th>
                    <th className="p-3 text-center">RS รวม (ออกรถ)</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/Inbox</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/PS</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/BK</th>
                    <th className="p-3 text-right">ต้นทุนเฉลี่ย/RS</th>
                    <th className="p-3 text-center">แปลงเป็น PS</th>
                    <th className="p-3 text-center">แปลงเป็น BK</th>
                    <th className="p-3 text-center">แปลงเป็น RS</th>
                    <th className="p-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {monthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="text-center py-8 text-slate-400">
                        ไม่มีข้อมูลแคมเปญตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    monthlySummary.map((item) => {
                      const mParts = item.month.split('-');
                      const mObj = months.find((m) => m.value === mParts[1]);
                      const mTitle = mObj?.fullName ? `${mObj.fullName} ${mParts[0]}` : item.month;

                      return (
                        <tr key={item.month} className="hover:bg-slate-50 transition border-b border-slate-100">
                          <td className="p-3 font-bold text-slate-900 font-mono">
                            <div>{item.month}</div>
                            <div className="text-[11px] font-normal text-slate-500 font-sans">{mTitle}</div>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-700">
                            {item.count}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            ฿{formatNum(item.budget)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ฿{formatNum(item.spend)}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-semibold ${
                              item.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.diff >= 0 ? `+฿${formatNum(item.diff)}` : `-฿${formatNum(Math.abs(item.diff))}`}
                          </td>
                          <td className="p-3 text-center font-bold text-sky-800 font-mono">
                            {formatNum(item.inbox)}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-900">
                            <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[11px]">
                              {formatNum(item.ps)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-900">
                            <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                              {formatNum(item.bk)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-900">
                            <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px]">
                              {formatNum(item.rs)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-red-700">
                            ฿{formatNum(item.cpi)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-700">
                            {item.ps > 0 ? `฿${formatNum(item.cpps)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {item.bk > 0 ? `฿${formatNum(item.cpbk)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {item.rs > 0 ? `฿${formatNum(item.cprs)}` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-700">
                            {item.convRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-amber-700">
                            {item.convBKRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-emerald-700">
                            {item.convRSRate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterYear(mParts[0]);
                                setFilterMonth(mParts[1]);
                                setViewMode('table');
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                            >
                              กรองดูเฉพาะเดือนนี้
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {monthlySummary.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td className="p-3 text-slate-700">รวมทั้งหมด ({monthlySummary.length} เดือน):</td>
                      <td className="p-3 text-center font-mono">{filteredCampaigns.length}</td>
                      <td className="p-3 text-right font-mono">฿{formatNum(totalBudget)}</td>
                      <td className="p-3 text-right font-mono text-slate-900">฿{formatNum(totalSpend)}</td>
                      <td className={`p-3 text-right font-mono ${totalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {totalDiff >= 0 ? `+฿${formatNum(totalDiff)}` : `-฿${formatNum(Math.abs(totalDiff))}`}
                      </td>
                      <td className="p-3 text-center font-mono text-sky-800">{formatNum(totalInbox)}</td>
                      <td className="p-3 text-center font-mono text-indigo-900">{formatNum(totalPS)}</td>
                      <td className="p-3 text-center font-mono text-amber-900">{formatNum(totalBK)}</td>
                      <td className="p-3 text-center font-mono text-emerald-900">{formatNum(totalRS)}</td>
                      <td className="p-3 text-right font-mono text-red-700">฿{formatNum(avgCPI)}</td>
                      <td className="p-3 text-right font-mono text-indigo-700">฿{formatNum(avgCPPS)}</td>
                      <td className="p-3 text-right font-mono text-amber-700">฿{formatNum(avgCPBK)}</td>
                      <td className="p-3 text-right font-mono text-emerald-700">฿{formatNum(avgCPRS)}</td>
                      <td className="p-3 text-center font-mono">{convInboxToPS.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-amber-700">{convInboxToBK.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono text-emerald-700">{convBKToRS.toFixed(1)}%</td>
                      <td className="p-3 text-center text-slate-400">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: เพิ่ม / แก้ไข แคมเปญเพจสาขา */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" />
                {editId ? 'แก้ไขข้อมูลแคมเปญเพจสาขา' : 'เพิ่มแคมเปญเพจสาขาใหม่'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
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
                    value={modalMonth}
                    onChange={(e) => setModalMonth(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    เซลล์เจ้าของเพจ <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={modalSalesAgent}
                    onChange={(e) => setModalSalesAgent(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="" disabled>-- เลือกเซลล์ --</option>
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
                  ชื่อแคมเปญ / โพสต์แอด <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เพจสมชาย - แคมเปญ MU-X ดอกเบี้ยพิเศษ 0.99%"
                  value={modalCampaignName}
                  onChange={(e) => setModalCampaignName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    ประเภท / รุ่นรถ <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
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
                    งบประมาณ (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="เช่น 10000"
                    value={modalBudget}
                    onChange={(e) => setModalBudget(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    จำนวนเงินที่จ่ายจริง (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="เช่น 9500"
                    value={modalSpend}
                    onChange={(e) => setModalSpend(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 flex items-center justify-between">
                    <span>จำนวน Inbox (ข้อความ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="เช่น 45"
                    value={modalInbox}
                    onChange={(e) => setModalInbox(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono font-bold text-sky-900 bg-sky-50/20"
                  />
                </div>
              </div>

              {/* ช่องกรอก PS (Prospect / นัดหมาย) */}
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">PS</span>
                    <span>จำนวนลูกค้า PS (Prospect / ผู้สนใจ / นัดหมาย)</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-medium">
                    {modalInboxValue > 0 && modalPSValue > 0
                      ? `แปลงได้ ${( (modalPSValue / modalInboxValue) * 100 ).toFixed(1)}%`
                      : 'ระบุผลลัพธ์ PS'}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="เช่น 8 (จำนวนลูกค้าสถานะ PS ที่ได้จากแคมเปญนี้)"
                  value={modalPS}
                  onChange={(e) => setModalPS(e.target.value)}
                  className="w-full p-2.5 border border-indigo-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-indigo-950 text-sm"
                />
                <p className="text-[10px] text-indigo-600/80 mt-1">
                  ใช้คำนวณต้นทุนต่อ PS (Cost Per Prospect) และอัตราเปลี่ยน Inbox เป็นผู้สนใจ
                </p>
              </div>

              {/* ช่องกรอก BK (Booking / จองรถ) */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">BK</span>
                    <span>จำนวนลูกค้า BK (Booking / จองรถสำเร็จ)</span>
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium">
                    {modalInboxValue > 0 && modalBKValue > 0
                      ? `แปลงได้ ${( (modalBKValue / modalInboxValue) * 100 ).toFixed(1)}%`
                      : 'ระบุผลลัพธ์ BK'}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="เช่น 3 (จำนวนลูกค้าสถานะ BK จองรถที่ได้จากแคมเปญนี้)"
                  value={modalBK}
                  onChange={(e) => setModalBK(e.target.value)}
                  className="w-full p-2.5 border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-amber-950 text-sm"
                />
                <div className="flex items-center justify-between text-[10px] text-amber-700/90 mt-1">
                  <span>ใช้คำนวณต้นทุนต่อการจอง (Cost Per Booking: CPBK)</span>
                  {modalBKValue > 0 && modalSpendValue > 0 && (
                    <span className="font-mono font-bold">
                      ต้นทุน/BK: ฿{(modalSpendValue / modalBKValue).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                  )}
                </div>
              </div>

              {/* ช่องกรอก RS (Retail Sale / ออกรถสำเร็จ) */}
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">RS</span>
                    <span>จำนวนลูกค้า RS (Retail Sale / ออกรถสำเร็จ)</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {modalBKValue > 0 && modalRSValue > 0
                      ? `แปลงจาก BK ได้ ${( (modalRSValue / modalBKValue) * 100 ).toFixed(1)}%`
                      : 'ระบุผลลัพธ์ RS'}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="เช่น 1 (จำนวนลูกค้าสถานะ RS ออกรถที่ได้จากแคมเปญนี้)"
                  value={modalRS}
                  onChange={(e) => setModalRS(e.target.value)}
                  className="w-full p-2.5 border border-emerald-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-950 text-sm"
                />
                <div className="flex items-center justify-between text-[10px] text-emerald-700/90 mt-1">
                  <span>ใช้คำนวณต้นทุนต่อการออกรถสำเร็จ (Cost Per Retail Sale: CPRS)</span>
                  {modalRSValue > 0 && modalSpendValue > 0 && (
                    <span className="font-mono font-bold">
                      ต้นทุน/RS: ฿{(modalSpendValue / modalRSValue).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                  )}
                </div>
              </div>

              {/* อัปโหลดรูปภาพแคมเปญ & บีบอัด 600x600 pixel */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-red-600" />
                    <span>รูปภาพแคมเปญ / ครีเอทีฟโฆษณา</span>
                  </label>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    บีบอัดอัตโนมัติ 600 × 600 px
                  </span>
                </div>

                {modalImage ? (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="relative group shrink-0">
                      <img
                        src={modalImage}
                        alt="Campaign preview"
                        className="w-20 h-20 rounded-lg object-cover border border-slate-200 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: modalImage,
                            title: modalCampaignName || 'พรีวิวรูปภาพแคมเปญ',
                            agent: modalSalesAgent || '-',
                            month: modalMonth,
                            category: modalCategory || '-',
                          })
                        }
                        className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                        title="ดูรูปขนาด 600x600 px"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          บีบอัดรูปขนาด 600 × 600 px เรียบร้อย
                        </span>
                      </div>

                      {compressionInfo && (
                        <div className="text-[10px] text-slate-600 font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                          <div>ขนาดเดิม: <span className="font-semibold">{compressionInfo.orig} KB</span></div>
                          <div className="text-emerald-700">
                            บีบอัดเหลือ: <span className="font-bold">{compressionInfo.comp} KB</span>{' '}
                            ({compressionInfo.orig > 0
                              ? `ลดลง ${Math.max(0, Math.round(((compressionInfo.orig - compressionInfo.comp) / compressionInfo.orig) * 100))}%`
                              : ''})
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        <label className="text-[11px] font-semibold text-red-600 hover:text-red-700 cursor-pointer underline flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          เปลี่ยนรูปภาพ
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          ลบรูปภาพ
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3.5 cursor-pointer transition ${
                        imageLoading
                          ? 'bg-slate-100 border-slate-300 cursor-wait'
                          : 'bg-white border-slate-300 hover:border-red-500 hover:bg-red-50/20'
                      }`}
                    >
                      {imageLoading ? (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                          <span className="text-xs font-semibold text-slate-700">
                            กำลังย่อและบีบอัดรูปภาพเป็น 600x600 px...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-center py-1">
                          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-xs">คลิกเพื่ออัปโหลดรูปภาพ</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              ระบบจะครอบตัดและบีบอัดเป็น 600×600 pixel คุณภาพสูงอัตโนมัติ (JPG, PNG, WebP)
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={imageLoading}
                        className="hidden"
                      />
                    </label>
                    {imageError && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {imageError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Live Preview of Calculated Metrics */}
              {(modalBudgetValue > 0 || modalSpendValue > 0 || modalInboxValue > 0 || modalPSValue > 0 || modalBKValue > 0 || modalRSValue > 0) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[11px]">
                  <div>
                    <span className="text-slate-500 block">ส่วนต่างงบ:</span>
                    <span
                      className={`font-mono font-bold ${
                        modalDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {modalDiff >= 0 ? `+฿${formatNum(modalDiff)}` : `-฿${formatNum(Math.abs(modalDiff))}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ต้นทุน/Inbox:</span>
                    <span className="font-mono font-bold text-red-700">
                      {modalInboxValue > 0 ? `฿${formatNum(modalCPI)}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ต้นทุน/PS:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {modalPSValue > 0 ? `฿${formatNum(modalCPPS)}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ต้นทุน/BK:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {modalBKValue > 0 ? `฿${formatNum(modalCPBK)}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ต้นทุน/RS:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {modalRSValue > 0 ? `฿${formatNum(modalCPRS)}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">แปลงเป็น PS:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {modalInboxValue > 0 && modalPSValue > 0 ? `${modalConvRate.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">แปลง BK ➔ RS:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {modalBKValue > 0 && modalRSValue > 0 ? `${modalConvRSRate.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={imageLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal: ดูรูปภาพแคมเปญขนาด 600x600 px แบบเต็มตา */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-150">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 truncate pr-2">
                <ImageIcon className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-bold truncate">{previewImage.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center justify-center bg-slate-950">
              <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-900">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] object-cover"
                />
                <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                  600 × 600 px
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white border-t border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-[10px]">เซลล์เจ้าของเพจ:</span>
                <span className="font-bold text-red-700">{previewImage.agent}</span>
                <span className="text-slate-500 ml-1 font-medium">({previewImage.category})</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">เดือน:</span>
                <span className="font-mono font-semibold text-slate-800">{previewImage.month}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer List Modal: แสดงรายชื่อลูกค้าจากตารางลูกค้าที่เชื่อมโยงกับแคมเปญ */}
      {customerListModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold">{customerListModal.title}</h3>
                  <p className="text-[11px] text-slate-300">{customerListModal.campaignName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomerListModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {customerListModal.customers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ไม่พบรายชื่อลูกค้าจากตารางลูกค้าในเงื่อนไขนี้
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 mb-2 flex justify-between items-center">
                    <span>
                      พบข้อมูลลูกค้าจากตารางลูกค้า <strong>{customerListModal.customers.length}</strong> ราย
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ ซิงก์ข้อมูลจากตารางลูกค้า
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 text-center w-8">#</th>
                          <th className="p-2.5">วันที่ทัก</th>
                          <th className="p-2.5">ชื่อ Facebook / ลูกค้า</th>
                          <th className="p-2.5">เซลล์ดูแล</th>
                          <th className="p-2.5">รุ่นรถ</th>
                          <th className="p-2.5 text-center">สถานะ</th>
                          <th className="p-2.5">เบอร์โทรศัพท์</th>
                          <th className="p-2.5">ผลการติดตาม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {customerListModal.customers.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition">
                            <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">{c.contactDate}</td>
                            <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{c.fbName}</td>
                            <td className="p-2.5 text-red-700 font-semibold whitespace-nowrap">{c.salesAgent}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{c.category}</span>
                              {c.subCategory && <span className="text-slate-500 text-[11px] ml-1">({c.subCategory})</span>}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getStatusBadgeStyle(c.status)}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{c.phone || '-'}</td>
                            <td className="p-2.5 text-slate-600 text-[11px] max-w-xs truncate" title={c.followUpResult}>
                              {c.followUpResult || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs flex justify-end">
              <button
                type="button"
                onClick={() => setCustomerListModal(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-semibold transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
