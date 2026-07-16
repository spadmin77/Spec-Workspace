import { FileSpreadsheet, UserCheck, RefreshCw } from 'lucide-react'
import { Tabs, TabsTrigger } from '@/src/components/ui'
import type { User } from 'firebase/auth'
import type { AppRole } from '@/src/lib/firebase'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: 'warehouse' | 'fixed_asset') => void
  currentUser: User | null
  userRole: AppRole
  isAuthenticating: boolean
  warehouseCount: number
  recordsCount: number
  onLoginClick: () => void
  onLogout: () => void
}

export function Header({
  activeTab,
  setActiveTab,
  currentUser,
  userRole,
  isAuthenticating,
  warehouseCount,
  recordsCount,
  onLoginClick,
  onLogout,
}: HeaderProps) {
  return (
    <header className="bg-background border-b sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 py-3 lg:py-0 lg:h-16">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm lg:text-base font-bold tracking-tight leading-tight truncate">
                <span className="text-muted-foreground font-normal">የንብረት ቁጥጥር</span>{' '}
                <span className="text-primary">WORKSPACE</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono truncate">
                Bilingual Inventory Manager
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'warehouse' | 'fixed_asset')}
            className="lg:mx-auto"
          >
            <TabsTrigger
              value="warehouse"
              activeValue={activeTab}
              onClick={(v) => setActiveTab(v as 'warehouse' | 'fixed_asset')}
            >
              <span className="flex flex-col items-start">
                <span>Warehouse</span>
                <span className="text-[8px] opacity-70 font-normal">መጋዘን</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="fixed_asset"
              activeValue={activeTab}
              onClick={(v) => setActiveTab(v as 'warehouse' | 'fixed_asset')}
            >
              <span className="flex flex-col items-start">
                <span>Fixed Assets</span>
                <span className="text-[8px] opacity-70 font-normal">ቋሚ ንብረት</span>
              </span>
            </TabsTrigger>
          </Tabs>

          <div className="hidden lg:flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <div className="bg-muted/50 px-3 py-1.5 rounded-lg border">
              WH: <span className="text-foreground font-semibold">{warehouseCount}</span>
            </div>
            <div className="bg-muted/50 px-3 py-1.5 rounded-lg border">
              FA: <span className="text-foreground font-semibold">{recordsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:border-l lg:pl-4 shrink-0">
            {isAuthenticating ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Verifying...</span>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right min-w-0">
                  <span className={`text-xs font-semibold ${userRole === 'admin' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {userRole === 'admin' ? 'ADMIN' : 'REGISTERER'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={currentUser.email || ''}>
                    {currentUser.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                  VIEW ONLY
                </span>
                <button
                  onClick={onLoginClick}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
