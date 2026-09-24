import React, { useState } from 'react';
import { TabType } from './types';
import { useAppData } from './hooks/useAppData';
import { Header } from './components/Header';
import { CustomerForm } from './components/CustomerForm';
import { CustomerTable } from './components/CustomerTable';
import { SalesReport } from './components/SalesReport';
import { SalesCampaignTab } from './components/SalesCampaignTab';
import { CustomerReport } from './components/CustomerReport';
import { ExpenseTable } from './components/ExpenseTable';
import { ExpenseReport } from './components/ExpenseReport';
import { UserManagementTab } from './components/UserManagementTab';
import { SettingsTab } from './components/SettingsTab';
import { ImageModal } from './components/ImageModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('form');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    data,
    currentUser,
    login,
    logout,
    saveUser,
    deleteUser,
    syncStatus,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    saveSalesProfile,
    toggleSalesVisibility,
    deleteSalesProfile,
    saveSalesCampaign,
    deleteSalesCampaign,
    saveExpense,
    deleteExpense,
    addCategory,
    deleteCategory,
    addSubCategory,
    deleteSubCategory,
    resetToDefault,
    getAvailableYears,
  } = useAppData();

  const availableYears = getAvailableYears();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const canExport = isAdmin;

  // Protect restricted tabs (users & settings) for non-admin roles (MKT & Sales)
  React.useEffect(() => {
    if (currentUser && !isAdmin && (currentTab === 'settings' || currentTab === 'users')) {
      setCurrentTab('form');
    }
  }, [currentUser, isAdmin, currentTab]);

  // If user is not logged in, show the Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={login} syncStatus={syncStatus} />;
  }

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col antialiased selection:bg-red-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onResetData={resetToDefault}
        syncStatus={syncStatus}
        currentUser={currentUser}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {currentTab === 'form' && (
          <CustomerForm
            appData={data}
            onSaveCustomer={addCustomer}
            onNavigateToTable={() => setCurrentTab('table')}
          />
        )}

        {currentTab === 'table' && (
          <CustomerTable
            appData={data}
            onUpdateCustomer={updateCustomer}
            onDeleteCustomer={deleteCustomer}
            onViewImage={setPreviewImage}
            availableYears={availableYears}
            canExport={canExport}
          />
        )}

        {currentTab === 'salesreport' && (
          <SalesReport
            appData={data}
            onSaveProfile={saveSalesProfile}
            onToggleVisibility={toggleSalesVisibility}
            onDeleteProfile={deleteSalesProfile}
            availableYears={availableYears}
          />
        )}

        {currentTab === 'salescampaign' && (
          <SalesCampaignTab
            appData={data}
            onSaveCampaign={saveSalesCampaign}
            onDeleteCampaign={deleteSalesCampaign}
            availableYears={availableYears}
            canExport={canExport}
          />
        )}

        {currentTab === 'reportcustomer' && (
          <CustomerReport
            appData={data}
            availableYears={availableYears}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpenseTable
            appData={data}
            onSaveExpense={saveExpense}
            onDeleteExpense={deleteExpense}
            availableYears={availableYears}
            canExport={canExport}
          />
        )}

        {currentTab === 'reportexpenses' && (
          <ExpenseReport
            appData={data}
            availableYears={availableYears}
            canExport={canExport}
          />
        )}

        {currentTab === 'users' && isAdmin && (
          <UserManagementTab
            appData={data}
            currentUser={currentUser}
            onSaveUser={saveUser}
            onDeleteUser={deleteUser}
            onLogout={logout}
          />
        )}

        {currentTab === 'settings' && isAdmin && (
          <SettingsTab
            appData={data}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onAddSubCategory={addSubCategory}
            onDeleteSubCategory={deleteSubCategory}
            onResetData={resetToDefault}
            onSaveUser={saveUser}
            onDeleteUser={deleteUser}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Image Preview Modal */}
      <ImageModal
        imageSrc={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>CRM &amp; Marketing Campaign Management &middot; Dealer System</span>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>ล็อกอินในชื่อ: {currentUser.username}</span>
            <span>&middot;</span>
            <span>ลูกค้า: {data.customers.length} คน</span>
            <span>&middot;</span>
            <span>เซลล์: {data.salesProfiles.length} คน</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
