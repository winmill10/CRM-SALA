import React, { useState } from 'react';
import { Car, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppUser } from '../types';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => { success: boolean; message?: string; user?: AppUser };
  syncStatus?: 'connecting' | 'connected' | 'offline';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, syncStatus = 'connected' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = onLogin(username.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    }, 250);
  };

  const handleFillDemo = () => {
    setUsername('salacms');
    setPassword('salacms');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-800/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-fade-in">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-3 shadow-inner border border-white/20">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">CRM &amp; Campaign Management</h1>
          <p className="text-xs text-red-100 mt-1">ระบบบริหารข้อมูลลูกค้า โชว์รูมรถยนต์ และเพจแคมเปญ</p>

          {/* Sync status tag */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-black/20 text-white/90 backdrop-blur-xs border border-white/10">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === 'connected'
                  ? 'bg-emerald-400'
                  : syncStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span>{syncStatus === 'connected' ? 'Firebase Sync' : 'Offline Mode'}</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">เข้าสู่ระบบ (Sign In)</h2>
            <p className="text-xs text-slate-500 mt-0.5">กรุณาป้อนชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานระบบ</p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="เช่น salacms"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสผ่าน (Password) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="ป้อนรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>

              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                ระบบปลอดภัย
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-red-50/80 border border-red-200/80 rounded-2xl p-3.5 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-red-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                  บัญชีผู้ใช้หลัก (Super Admin):
                </span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-bold text-red-700 hover:text-red-900 bg-white hover:bg-red-100 px-2.5 py-0.5 rounded-lg border border-red-300 transition"
                >
                  คลิกกรอกอัตโนมัติ
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-slate-700 font-mono text-[11px]">
                <span>
                  User: <strong className="text-red-700">salacms</strong>
                </span>
                <span>
                  Password: <strong className="text-red-700">salacms</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Isuzu Dealership CRM &bull; Version 6.0 (Cloud Connected)
        </div>
      </div>
    </div>
  );
};
