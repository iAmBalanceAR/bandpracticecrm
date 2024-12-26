import * as React from "react"
import { BarChart3, Calendar, Upload, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, MapPin, MessageSquare, Music, Users, LogOut, Route, Sun, Moon, Laptop } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '../providers/supabase-client-provider'
import { useRouter } from 'next/navigation'
import { ProfileAvatar } from '@/components/account/profile-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/lib/providers/theme-provider'

interface SideMenuProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function SideMenu({ sidebarOpen, setSidebarOpen }: SideMenuProps) {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out shadow-green-400  shadow-[2px_0_6px_-1px_rgba(0,0,0,0.1)] ${sidebarOpen ? 'w-72' : 'w-16'}`}>
      <div className="h-full px-3 py-4 bg-[#111c44] shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between h-16 mb-4">
            <Link 
              href="/" 
              className={`flex items-center hover:opacity-80 transition-opacity ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <div className={`flex justify-center ${!sidebarOpen ? 'w-full' : ''}`}>
                <Music className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#008ffb]`} />
              </div>
              {sidebarOpen && <span className="text-xl font-bold text-white whitespace-nowrap">Band Practice</span>}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft className="h-7 w-7 text-white" /> : <ChevronRight className="h-7 w-7 text-white" />}
            </Button>
          </div>

          {/* User Badge */}
          <div className="mb-6">
            <div className="bg-[#1B2559] rounded-lg">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-${sidebarOpen ? 'start' : 'center'} text-white hover:bg-[#242f6a] rounded-md transition-colors ${!sidebarOpen ? 'p-0' : 'px-2 py-1'}`}
                  >
                    <div className={`flex  w-full ${!sidebarOpen ? '' : ''}`}>
                      <div className="flex">
                        <ProfileAvatar 
                          avatarUrl={user?.user_metadata?.avatar_url} 
                          alt={user?.user_metadata?.full_name || user?.email || ''}
                          className="w-10 h-10 rounded-md border border-green-600/50"
                          iconClassName="h-6 w-6"
                        />
                      </div>
                      {sidebarOpen && (
                        <div className="ml-0 flex-1 truncate">
                          <p className="text-sm font-medium text-white truncate">
                            {user?.user_metadata?.full_name || user?.email}
                          </p>
                          {user?.user_metadata?.full_name && (
                            <p className="ml-2 text-xs text-gray-400 truncate">
                              {user?.email}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-[#111c44] border-green-600 border text-white shadow-lg shadow-green-400/20 z-[100] absolute -right-[15.5rem] top-0"
                >
                  <div className="px-3 py-3 border-b border-green-600">
                    <p className="text-sm font-medium text-white">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    {user?.user_metadata?.full_name && (
                      <p className="text-xs text-gray-400 mt-1">
                        {user?.email}
                      </p>
                    )}
                  </div>
                  <div className="p-2">
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-[#242f6a] text-white rounded-md"
                      onClick={() => router.push('/account')}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-[#242f6a] text-white rounded-md"
                      onClick={() => router.push('/account/billing')}
                    >
                      Billing
                    </DropdownMenuItem>
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex items-center justify-center rounded-md p-2 hover:bg-[#242f6a] ${
                            theme === 'light' ? 'bg-[#242f6a] text-white' : 'text-gray-400'
                          }`}
                          aria-label="Light mode"
                        >
                          <Sun className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex items-center justify-center rounded-md p-2 hover:bg-[#242f6a] ${
                            theme === 'dark' ? 'bg-[#242f6a] text-white' : 'text-gray-400'
                          }`}
                          aria-label="Dark mode"
                        >
                          <Moon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`flex items-center justify-center rounded-md p-2 hover:bg-[#242f6a] ${
                            theme === 'system' ? 'bg-[#242f6a] text-white' : 'text-gray-400'
                          }`}
                          aria-label="System theme"
                        >
                          <Laptop className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-green-600 my-2" />
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-[#242f6a] text-red-400 hover:text-red-300 rounded-md"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <LayoutDashboard className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#00e396]`} />
                {sidebarOpen && <span>Dashboard</span>}
              </Button>
            </Link>
            <Link href="/tours" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/tours' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/tours' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <Route className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#d83b34]`} />
                {sidebarOpen && <span>Tour Details</span>}
              </Button>
            </Link>
            <Link href="/tour-route" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/tour-route' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/tour-route' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <MapPin className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#008ffb]`} />
                {sidebarOpen && <span>Tour Route Management</span>}
              </Button>
            </Link>
            <Link href="/calender" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/calender' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/calender' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <Calendar className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#ff9920]`} />
                {sidebarOpen && <span>Gig Calendar</span>}
              </Button>
            </Link>
            <Link href="/leads" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/leads' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/leads' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <ClipboardList className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#d83b34]`} />
                {sidebarOpen && <span>Lead Management</span>}
              </Button>
            </Link>
            <Link href="/venues" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/venues' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/venues' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <Users className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#00e396]`} />
                {sidebarOpen && <span>Venue Database Search</span>}
              </Button>
            </Link>
            <Link href="/data-tracking" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/data-tracking' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/data-tracking' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <BarChart3 className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#008ffb]`} />
                {sidebarOpen && <span>Data Tracking</span>}
              </Button>
            </Link>
            <Link href="/notes-reminders" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/notes-reminders' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/notes-reminders' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <MessageSquare className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#ff9920]`} />
                {sidebarOpen && <span>Notes &amp; Reminders</span>}
              </Button>
            </Link>
            <Link href="/file-uploads" className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === '/file-uploads' ? 'bg-[#1B2559]' : ''}`}>
              <Button variant="ghost" className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${pathname === '/file-uploads' ? 'text-white' : 'text-gray-400 hover:text-white'} text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}>
                <Upload className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#ff9920]`} />
                {sidebarOpen && <span>File Manager</span>}
              </Button>
            </Link>
          </nav>
        </div>
        <div className="mt-auto">
          <Button 
            variant="ghost" 
            className={`w-full justify-${sidebarOpen ? 'start' : 'center'} text-gray-400 text-lg hover:bg-[#1B2559] hover:text-red-400 ${!sidebarOpen ? 'p-0' : 'px-2'}`}
            onClick={handleSignOut}
          >
            <LogOut className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#d83b34]`} />
            {sidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}