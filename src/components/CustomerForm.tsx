import React, { useState, useEffect } from 'react';
import { AppData, Customer } from '../types';
import { getCurrentFormattedDateTime } from '../hooks/useAppData';
import { UserPlus, Save, RotateCcw, Trash2, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface CustomerFormProps {
  appData: AppData;
  onSaveCustomer: (customer: Omit<Customer, 'id' | 'entryDateTime' | 'statusHistory'>) => void;
  onNavigateToTable: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  appData,
  onSaveCustomer,
  onNavigateToTable,
}) => {
  const [contactDate, setContactDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entryDateTime, setEntryDateTime] = useState('');
  const [fbName, setFbName] = useState('');
  const [salesAgent, setSalesAgent] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [status, setStatus] = useState('PS');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('');
  const [followUpResult, setFollowUpResult] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    setEntryDateTime(getCurrentFormattedDateTime());
    const interval = setInterval(() => {
      setEntryDateTime(getCurrentFormattedDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const categories = Object.keys(appData.categories);

  useEffect(() => {
    if (appData.salesAgents.length > 0 && !salesAgent) {
      setSalesAgent(appData.salesAgents[0]);
    }
  }, [appData.salesAgents, salesAgent]);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  useEffect(() => {
    if (category && appData.categories[category]) {
      const subs = appData.categories[category];
      if (subs.length > 0) {
        setSubCategory(subs[0]);
      } else {
        setSubCategory('');
      }
    }
  }, [category, appData.categories]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setContactDate(new Date().toISOString().split('T')[0]);
    setFbName('');
    setPhone('');
    setImage('');
    setFollowUpResult('');
    if (categories.length > 0) setCategory(categories[0]);
    if (appData.salesAgents.length > 0) setSalesAgent(appData.salesAgents[0]);
    setStatus('PS');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesAgent) {
      alert('กรุณาเพิ่มและเลือกเซลล์ที่ดูแลก่อนบันทึกข้อมูล');
      return;
    }
    if (!category || !subCategory) {
      alert('กรุณาเลือกประเภทและรุ่นย่อยของรถยนต์');
      return;
    }

    onSaveCustomer({
      contactDate,
      fbName: fbName.trim(),
      salesAgent,
      category,
      subCategory,
      status,
      phone: phone.trim(),
      image,
      followUpResult: followUpResult.trim(),
    });

    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
    handleReset();
  };

  const currentSubs = category && appData.categories[category] ? appData.categories[category] : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-2">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              บันทึกข้อมูลลูกค้าใหม่
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">กรอกรายละเอียดลูกค้าที่ทักเพจเข้ามาเพื่อจัดเก็บลงฐานข้อมูล</p>
          </div>

          {successToast && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              <span>บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. วันที่ลูกค้าทักเข้ามา <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={contactDate}
              onChange={(e) => setContactDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. วันเวลาที่ลงข้อมูล (ระบบ)
            </label>
            <input
              type="text"
              disabled
              value={entryDateTime}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              3. ชื่อ Facebook ลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ชื่อโปรไฟล์ลูกค้า"
              value={fbName}
              onChange={(e) => setFbName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              4. เซลล์ที่ดูแล <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={salesAgent}
              onChange={(e) => setSalesAgent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-medium"
            >
              {appData.salesAgents.length > 0 ? (
                appData.salesAgents.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              ) : (
                <option value="">(ยังไม่มีรายชื่อเซลล์ - ไปที่ตั้งค่า/รายงานเซลล์)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              5. ประเภทที่สนใจ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-medium"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              6. รุ่นย่อย <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-medium"
            >
              {currentSubs.length > 0 ? (
                currentSubs.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))
              ) : (
                <option value="">(ไม่มีรุ่นย่อยในประเภทนี้)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              7. สถานะ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white font-bold text-red-700"
            >
              {appData.statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              8. เบอร์โทร / ช่องทางติดต่อ
            </label>
            <input
              type="text"
              placeholder="เช่น 081-234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              9. รูปภาพประกอบ / สลิปโอน / แชท
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="w-full p-1 border border-slate-300 rounded-xl bg-slate-50 text-slate-500 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            {image && (
              <div className="mt-2 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <img src={image} alt="Preview" className="w-12 h-12 rounded-lg object-cover border" />
                <div className="flex-1 text-[11px] text-slate-600">แนบรูปเรียบร้อย</div>
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบรูป
                </button>
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              10. ผลการติดตาม / บันทึกการพูดคุย
            </label>
            <textarea
              rows={3}
              placeholder="ระบุรายละเอียดการพูดคุย นัดหมายทดลองขับ ข้อมูลไฟแนนซ์..."
              value={followUpResult}
              onChange={(e) => setFollowUpResult(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs bg-white"
            />
          </div>

          <div className="md:col-span-3 flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToTable}
              className="text-xs text-slate-600 hover:text-red-700 underline font-medium"
            >
              ดูตารางข้อมูลลูกค้าทั้งหมด ({appData.customers.length} รายการ) &rarr;
            </button>

            <div className="flex space-x-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ล้างข้อมูล
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-7 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
