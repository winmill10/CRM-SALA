import React, { useState } from 'react';
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
  Users,
  AlertCircle,
  X
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Row 1: งานข้อมูลลูกค้า & แคมเปญสาขา
  const row1Tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'form', label: 'ลงข้อมูลลูกค้า', icon: <UserPlus className="w-3.5 h-3.5 mr-1" /> },
    { id: 'table', label: 'ตารางลูกค้า', icon: <TableIcon className="w-3.5 h-3.5 mr-1" /> },
    { id: 'salesreport', label: 'รายงานเซลล์', icon: <Contact className="w-3.5 h-3.5 mr-1" /> },
    { id: 'salescampaign', label: 'แคมเปญเพจสาขา', icon: <Megaphone className="w-3.5 h-3.5 mr-1" /> },
    { id: 'reportcustomer', label: 'รีพอร์ตรวม', icon: <PieChart className="w-3.5 h-3.5 mr-1" /> },
  ];

  // Row 2: งบประมาณ บริหารจัดการระบบ
  const row2Tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'expenses', label: 'งบประมาณ', icon: <Wallet className="w-3.5 h-3.5 mr-1" /> },
    { id: 'reportexpenses', label: 'รีพอร์ตค่าใช้จ่าย', icon: <TrendingUp className="w-3.5 h-3.5 mr-1" /> },
    { id: 'users', label: 'จัดการผู้ใช้', icon: <Users className="w-3.5 h-3.5 mr-1" /> },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: <Settings className="w-3.5 h-3.5 mr-1" /> },
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      <header className="bg-red-700 text-white shadow-md sticky top-0 z-40 border-b border-red-800">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col gap-2.5">
          {/* Top Bar: Brand, Sync Status & User Profile Actions */}
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Brand Information */}
            <div className="flex items-center space-x-2.5">
              <div className="bg-white text-red-700 p-2 rounded-xl shadow font-bold flex items-center justify-center shrink-0">
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
                {/* Updated Subtitle */}
                <p className="text-[11px] text-red-200 hidden sm:block">
                  ระบบบันทึกข้อมูลลูกค้า รีพอร์ต และงบประมาณเพจสาขา
                </p>
              </div>
            </div>

            {/* Right Action Controls: User Profile + Logout + Sample Data */}
            <div className="flex items-center gap-2">
              {currentUser && (
                <div className="flex items-center gap-2 bg-red-800/80 px-2.5 py-1.5 rounded-xl border border-red-600/50 text-xs shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-red-900/90 flex items-center justify-center text-red-100 border border-red-500/50 shrink-0">
                    <Shield className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="flex flex-col text-left leading-tight hidden md:flex">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white font-mono text-[11px]">
                        {currentUser.username}
                      </span>
                      <span className="text-[9px] bg-red-950/70 text-amber-300 px-1 py-0.2 rounded font-semibold border border-amber-500/40 uppercase">
                        {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-red-200 truncate max-w-[120px]">
                      {currentUser.displayName || currentUser.username}
                    </span>
                  </div>

                  {/* Top Bar Quick Logout Button */}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="bg-red-950/70 hover:bg-rose-600 text-rose-200 hover:text-white px-2 py-1 rounded-lg transition-colors border border-red-500/40 flex items-center gap-1 text-[11px] font-semibold cursor-pointer ml-1"
                      title="ออกจากระบบ (Logout)"
                    >
                      <LogOut className="w-3 h-3 text-rose-300" />
                      <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                  )}
                </div>
              )}

              {/* Reset to Sample Data */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('คุณต้องการรีเซ็ตข้อมูลเป็นค่าเริ่มต้นตัวอย่างหรือไม่?')) {
                    onResetData();
                  }
                }}
                title="รีเซ็ตเป็นข้อมูลตัวอย่าง"
                className="text-xs flex items-center gap-1 bg-red-800/80 hover:bg-red-900 px-2.5 py-1.5 rounded-xl border border-red-600/60 text-red-100 transition whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden lg:inline">ข้อมูลตัวอย่าง</span>
              </button>
            </div>
          </div>

          {/* 2-Line Navigation Menu (ทำเมนูเป็น 2 บรรทัด) */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-red-600/40">
            {/* บรรทัดที่ 1: ข้อมูลลูกค้า & แคมเปญสาขา */}
            <div className="flex items-center overflow-x-auto scrollbar-none pb-0.5">
              <nav className="flex items-center gap-1 bg-red-800/60 p-1 rounded-xl text-xs backdrop-blur-xs border border-red-600/40 overflow-x-auto scrollbar-none flex-1">
                {row1Tabs.map((tab) => {
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelectTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white text-red-700 shadow-sm font-bold scale-[1.02]'
                          : 'text-red-100 hover:bg-red-700/80 hover:text-white'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* บรรทัดที่ 2: งบประมาณ การจัดการระบบ & ออกจากระบบ */}
            <div className="flex items-center overflow-x-auto scrollbar-none pb-0.5">
              <nav className="flex items-center gap-1 bg-red-800/60 p-1 rounded-xl text-xs backdrop-blur-xs border border-red-600/40 overflow-x-auto scrollbar-none flex-1 justify-between">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {row2Tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => onSelectTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-white text-red-700 shadow-sm font-bold scale-[1.02]'
                            : 'text-red-100 hover:bg-red-700/80 hover:text-white'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* เมนูออกจากระบบ (Logout) ในแถวที่ 2 */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center whitespace-nowrap bg-rose-950/80 hover:bg-rose-600 text-rose-100 hover:text-white border border-rose-500/50 cursor-pointer shadow-xs text-xs shrink-0 ml-1"
                    title="ออกจากระบบ (Logout)"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1 text-rose-300" />
                    <span>ออกจากระบบ</span>
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Confirmation Modal for Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <LogOut className="w-4 h-4" />
                <span>ยืนยันการออกจากระบบ</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2 text-xs text-slate-600 space-y-2">
              <p>คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ (Logout)?</p>
              {currentUser && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="text-[11px]">
                    <span className="font-semibold text-slate-800">{currentUser.displayName || currentUser.username}</span>
                    <span className="text-slate-500"> ({currentUser.username})</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
