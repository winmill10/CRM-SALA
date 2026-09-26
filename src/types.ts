export interface StatusHistoryItem {
  status: string;
  date: string;
}

export interface Customer {
  id: number;
  contactDate: string; // YYYY-MM-DD
  entryDateTime: string; // YYYY-MM-DD HH:mm:ss
  fbName: string;
  salesAgent: string;
  category: string;
  subCategory: string;
  status: 'PS' | 'BK' | 'RS' | 'CC' | 'ได้คุย' | string;
  statusHistory: StatusHistoryItem[];
  phone: string;
  image?: string;
  followUpResult: string;
  campaignId?: number; // ลิงก์กับแคมเปญเพจสาขา
  campaignName?: string; // ชื่อแคมเปญเพจสาขาที่ลิงก์
}

export interface SalesProfile {
  id: number;
  nickname: string;
  fullName: string;
  phone: string;
  facebook: string;
  avatar: string;
  note: string;
  hidden: boolean;
}

export interface Expense {
  id: number;
  month: string; // YYYY-MM
  code: string;
  name: string;
  category: string;
  budget: number;
  spend: number;
  inboxCount: number;
  link?: string;
}

export interface SalesCampaign {
  id: number;
  month: string; // YYYY-MM
  salesAgent: string;
  campaignName: string;
  category: string;
  budget: number;
  spend: number;
  inbox: number;
  ps?: number; // จำนวนลูกค้า PS (Prospect / ผู้สนใจ / นัดหมาย) จากแคมเปญ
  image?: string; // รูปภาพแคมเปญ ขนาด 600x600 pixel (Base64)
}

export type UserRole = 'superadmin' | 'admin' | 'mkt' | 'sales';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  role: UserRole;
  salesNickname?: string;
  createdAt?: string;
}

export interface AppData {
  salesAgents: string[];
  salesProfiles: SalesProfile[];
  categories: Record<string, string[]>;
  categoryColors: Record<string, string>;
  statuses: string[];
  customers: Customer[];
  expenses: Expense[];
  salesCampaigns: SalesCampaign[];
  users?: AppUser[];
}

export type TabType =
  | 'form'
  | 'table'
  | 'salesreport'
  | 'salescampaign'
  | 'reportcustomer'
  | 'expenses'
  | 'reportexpenses'
  | 'users'
  | 'settings';
