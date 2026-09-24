import React from 'react';
import { TabType, AppUser } from '../types';
import {
  Car,
  UserPlus,
  Table as TableIcon,
  Contact,
  Megaphone,
  PieChart,
  Wallet,
  TrendingUp,
  Settings,
  RotateCcw,
  LogOut,
  Shield,
  User,
  Users
} from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onResetData: () => void;
  syncStatus?: 'connecting' | 'connected' | 'offline';
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onResetData,
  syncStatus = 'connected',
  currentUser,
  onLogout,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'form', label: 'ลงข้อมูลลูกค้า', icon: <UserPlus className="w-3.5 h-3.5 mr-1" /> },
    { id: 'table', label: 'ตารางลูกค้า', icon: <TableIcon className="w-3.5 h-3.5 mr-1" /> },
    { id: 'salesreport', label: 'รายงานเซลล์', icon: <Contact className="w-3.5 h-3.5 mr-1" /> },
    { id: 'salescampaign', label: 'แคมเปญเพจส่วนตัว', icon: <Megaphone className="w-3.5 h-3.5 mr-1" /> },
    { id: 'reportcustomer', label: 'รีพอร์ตรวม', icon: <PieChart className="w-3.5 h-3.5 mr-1" /> },
    { id: 'expenses', label: 'งบประมาณ', icon: <Wallet className="w-3.5 h-3.5 mr-1" /> },
    { id: 'reportexpenses', label: 'รีพอร์ตค่าใช้จ่าย', icon: <TrendingUp className="w-3.5 h-3.5 mr-1" /> },
    { id: 'users', label: 'จัดการผู้ใช้', icon: <Users className="w-3.5 h-3.5 mr-1" /> },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: <Settings className="w-3.5 h-3.5 mr-1" /> },
  ];

  return (
    <header className="bg-red-700 text-white shadow-md sticky top-0 z-40 border-b border-red-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col xl:flex-row justify-between items-center gap-3">
        {/* Brand Zone */}
        <div className="flex items-center justify-between w-full xl:w-auto">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white text-red-700 p-2 rounded-xl shadow font-bold flex items-center justify-center">
              <Car className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-bold tracking-tight">CRM &amp; Campaign Management</h1>
                <span
                  title={
                    syncStatus === 'connected'
                      ? 'เชื่อมต่อ Firebase Firestore เรียลไทม์แล้ว'
                      : syncStatus === 'connecting'
                      ? 'กำลังเชื่อมต่อ Firebase...'
                      : 'โหมดออฟไลน์ (แคชในเครื่อง)'
                  }
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                      : syncStatus === 'connecting'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'connected'
                        ? 'bg-emerald-400 animate-pulse'
                        : syncStatus === 'connecting'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {syncStatus === 'connected'
                      ? 'Firebase Sync'
                      : syncStatus === 'connecting'
                      ? 'Connecting...'
                      : 'Local Cache'}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-red-200 hidden sm:block">ระบบบันทึกข้อมูลลูกค้า รีพอร์ต และงบประมาณเพจส่วนตัวเซลล์</p>
            </div>
          </div>

          {/* User & Logout for Mobile */}
          <div className="flex items-center gap-2 xl:hidden">
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-red-800/80 px-2 py-1 rounded-lg border border-red-600/70 text-[11px]">
                <User className="w-3.5 h-3.5 text-red-200" />
                <span className="font-bold text-white max-w-[70px] truncate">{currentUser.username}</span>
                {onLogout && (
                  <button
                    onClick={() => {
                      if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                        onLogout();
                      }
                    }}
                    title="ออกจากระบบ"
                    className="ml-1 text-red-200 hover:text-white p-0.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตข้อมูลเป็นค่าเริ่มต้นตัวอย่างหรือไม่?')) {
                  onResetData();
                }
              }}
              title="รีเซ็ตเป็นข้อมูลตัวอย่าง"
              className="text-xs flex items-center gap-1 bg-red-800/80 hover:bg-red-900 px-2.5 py-1.5 rounded-lg border border-red-600 text-red-100"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tab Navigation and User Controls */}
        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          <nav className="flex flex-nowrap gap-1 bg-red-800/70 p-1 rounded-xl text-xs backdrop-blur-sm border border-red-600/40">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-red-700 shadow-sm font-semibold'
                      : 'text-red-100 hover:bg-red-700 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('คุณต้องการออกจากระบบ (Logout) หรือไม่?')) {
                    onLogout();
                  }
                }}
                className="px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center whitespace-nowrap bg-red-950/60 hover:bg-rose-600 text-rose-200 hover:text-white border border-red-500/50 cursor-pointer ml-1 text-xs shadow-xs"
                title="ออกจากระบบ (Logout)"
              >
                <LogOut className="w-3.5 h-3.5 mr-1 text-rose-300" />
                <span>ออกจากระบบ</span>
              </button>
            )}
          </nav>

          {/* Desktop User Badge & Logout */}
          {currentUser && (
            <div className="hidden xl:flex items-center gap-2 bg-red-800/70 px-3 py-1.5 rounded-xl border border-red-600/40 text-xs">
              <div className="w-6 h-6 rounded-full bg-red-900/80 flex items-center justify-center text-red-100 border border-red-500/50">
                <Shield className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-white text-[11px] leading-tight flex items-center gap-1">
                  <span>{currentUser.username}</span>
                  <span className="text-[9px] bg-red-950/60 text-amber-300 px-1.5 py-0.2 rounded font-medium border border-amber-500/30">
                    {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role}
                  </span>
                </span>
                <span className="text-[10px] text-red-200 leading-tight">
                  {currentUser.displayName}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                      onLogout();
                    }
                  }}
                  title="ออกจากระบบ"
                  className="ml-1 bg-red-900/60 hover:bg-red-900 text-red-200 hover:text-white p-1 rounded-lg transition flex items-center gap-1 text-[11px] font-medium border border-red-600/50"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-300" />
                  <span>ออก</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตข้อมูลเป็นค่าเริ่มต้นตัวอย่างหรือไม่?')) {
                onResetData();
              }
            }}
            title="รีเซ็ตเป็นข้อมูลตัวอย่าง"
            className="hidden xl:flex text-xs items-center gap-1 bg-red-800/70 hover:bg-red-900 px-3 py-1.5 rounded-xl border border-red-600/50 text-red-100 whitespace-nowrap transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ข้อมูลตัวอย่าง</span>
          </button>
        </div>
      </div>
    </header>
  );
};
