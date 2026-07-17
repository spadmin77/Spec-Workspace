import { useState } from 'react'
import { Header, Footer, LoginPage, RegistererManagerModal } from '@/src/components/layout'
import { WarehouseView } from '@/src/components/warehouse'
import { FixedAssetView } from '@/src/components/fixed-asset'
import { useAuth, useWarehouse, useFixedAssets } from '@/src/hooks'

export default function App() {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'fixed_asset'>('warehouse')
  const [isRegManagerModalOpen, setIsRegManagerModalOpen] = useState(false)

  const auth = useAuth()
  const warehouse = useWarehouse(auth.isStaff)
  const fixedAssets = useFixedAssets(auth.isStaff, auth.userRole, auth.userDepartment)

  const handleLogin = async (email: string, password: string) => {
    await auth.loginWithPassword(email, password)
  }

  const handleLogout = async () => {
    try { await auth.logoutAdmin() } catch (e) { console.warn('Sign out warn:', e) }
  }

  if (auth.isAuthenticating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LoginPage onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={auth.currentUser}
        userRole={auth.userRole}
        isAuthenticating={auth.isAuthenticating}
        warehouseCount={warehouse.warehouseEntries.length}
        recordsCount={fixedAssets.visibleRecords.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {activeTab === 'warehouse' && (
          <WarehouseView
            canAdd={auth.canAdd}
            canEdit={auth.canEdit}
            warehouseEntries={warehouse.warehouseEntries}
            filteredWarehouseEntries={warehouse.filteredWarehouseEntries}
            warehouseSearch={warehouse.warehouseSearch}
            setWarehouseSearch={warehouse.setWarehouseSearch}
            warehouseFilterOwner={warehouse.warehouseFilterOwner}
            setWarehouseFilterOwner={warehouse.setWarehouseFilterOwner}
            warehouseStats={warehouse.warehouseStats}
            existingWarehouseOwners={warehouse.existingWarehouseOwners}
            onAddOrUpdateEntry={warehouse.handleAddOrUpdateEntry}
            onDeleteEntry={warehouse.handleDeleteEntry}
            onClearAll={warehouse.handleClearAll}
          />
        )}

        {activeTab === 'fixed_asset' && (
          <FixedAssetView
            isStaff={auth.isStaff}
            canAdd={auth.canAdd}
            canEdit={auth.canEdit}
            empHeader={fixedAssets.empHeader}
            setEmpHeader={fixedAssets.setEmpHeader}
            empAssetRows={fixedAssets.empAssetRows}
            setEmpAssetRows={fixedAssets.setEmpAssetRows}
            empCountedBy={fixedAssets.empCountedBy}
            setEmpCountedBy={fixedAssets.setEmpCountedBy}
            empUsername={fixedAssets.empUsername}
            setEmpUsername={fixedAssets.setEmpUsername}
            empDate={fixedAssets.empDate}
            setEmpDate={fixedAssets.setEmpDate}
            editingRecordId={fixedAssets.editingRecordId}
            selectedRecordId={fixedAssets.selectedRecordId}
            setSelectedRecordId={fixedAssets.setSelectedRecordId}
            collapsedDepts={fixedAssets.collapsedDepts}
            setCollapsedDepts={fixedAssets.setCollapsedDepts}
            existingFixedAssetDepts={fixedAssets.existingFixedAssetDepts}
            employeeSearch={fixedAssets.employeeSearch}
            setEmployeeSearch={fixedAssets.setEmployeeSearch}
            visibleRecords={fixedAssets.visibleRecords}
            recordsByDept={fixedAssets.recordsByDept}
            viewedRecord={fixedAssets.viewedRecord}
            isSaving={fixedAssets.isSaving}
            saveMessage={fixedAssets.saveMessage}
            clearSaveMessage={fixedAssets.clearSaveMessage}
            handleCancelRecordEdit={fixedAssets.handleCancelRecordEdit}
            handleSaveActiveRecord={fixedAssets.handleSaveActiveRecord}
            handleDeleteRecord={fixedAssets.handleDeleteRecord}
            handleClearAll={fixedAssets.handleClearAll}
            handleEditRecord={fixedAssets.handleEditRecord}
          />
        )}
      </main>

      <RegistererManagerModal
        isOpen={isRegManagerModalOpen}
        onClose={() => setIsRegManagerModalOpen(false)}
        apiCall={auth.apiCall}
      />

      <Footer />
    </div>
  )
}
