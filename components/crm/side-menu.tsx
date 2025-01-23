import * as React from "react"
import { BarChart3, Calendar, Upload, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, MapPin, MessageSquare, Music, Users, LogOut, Route, Sun, Moon, Laptop, Guitar, CreditCard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  const [profile, setProfile] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function getProfile() {
      if (!user) return
      
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (!error) {
        setProfile(data)
      }
      setLoading(false)
    }
    getProfile()
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  // Check if user has active subscription
  const hasSubscription = profile?.subscription_status === 'active'

  // Define menu items based on subscription status
  const menuItems = hasSubscription ? [
    { href: '/', icon: LayoutDashboard, text: 'Dashboard', color: '#00e396' },
    { href: '/tours', icon: Route, text: 'Tour Details', color: '#d83b34' },
    { href: '/tour-route', icon: MapPin, text: 'Tour Route Management', color: '#008ffb' },
    { href: '/calender', icon: Calendar, text: 'Gig Calendar', color: '#ff9920' },
    { href: '/leads', icon: ClipboardList, text: 'Lead Management', color: '#d83b34' },
    { href: '/venues', icon: Users, text: 'Venue Database Search', color: '#00e396' },
    { href: '/data-tracking', icon: BarChart3, text: 'Data Tracking', color: '#008ffb' },
    { href: '/stage-plot', icon: Guitar, text: 'Stage Plot Generator', color: '#ff9920' }
  ] : [
    { href: '/pricing', icon: CreditCard, text: 'Subscription Plans', color: '#00e396' },
    { href: '/account/billing', icon: LayoutDashboard, text: 'Billing', color: '#d83b34' }
  ]

  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>
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
              <div className={` justify-center  ${!sidebarOpen ? 'flex w-full  ' : ''}`}>
                <Music className={`${sidebarOpen ? 'hidden !h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#008ffb]`} />
              </div>
              {sidebarOpen && (
                <Image 
                  src="/images/logo-top-nav.png" 
                  alt="Band Practice" 
                  width={200} 
                  height={45}
                  className="object-contain"
                />
              )}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft className="h-7 w-7 text-white" /> : <ChevronRight className="h-7 w-7 text-white" />}
            </Button>
          </div>

          {/* User Badge - Only show if user is logged in */}
          {user && (
            <div className="mb-6">
              <div className="bg-[#1B2559] rounded-lg">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-${sidebarOpen ? 'start' : 'center'} text-white hover:bg-[#242f6a] rounded-md transition-colors ${!sidebarOpen ? 'p-0' : 'px-2 py-1'}`}
                    >
                      <div className={`flex w-full ${!sidebarOpen ? '' : ''}`}>
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
          )}

          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <Link 
                key={index}
                href={item.href} 
                className={`block hover:bg-[#1B2559] hover:text-white rounded-md ${pathname === item.href ? 'bg-[#1B2559]' : ''}`}
              >
                <Button 
                  variant="ghost" 
                  className={`w-full justify-${sidebarOpen ? 'start' : 'center'} ${
                    pathname === item.href ? 'text-white' : 'text-gray-400 hover:text-white'
                  } text-lg ${!sidebarOpen ? 'p-0' : 'px-2'}`}
                >
                  <item.icon className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'}`} style={{ color: item.color }} />
                  {sidebarOpen && <span>{item.text}</span>}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* Only show sign out in footer if user is logged in */}
        {user && (
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
        )}
      </div>
    </aside>
  )
}