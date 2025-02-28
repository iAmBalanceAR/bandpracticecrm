import * as React from "react"
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

// Import all icons directly - this is more efficient than dynamic imports for this case
import { 
  BarChart3, Calendar, ChevronLeft, ShipWheel, ChevronRight, 
  ClipboardList, LayoutDashboard, MapPin, Music, Users, 
  LogOut, Route, BookOpen, ListVideo, LogIn, Guitar, CreditCard 
} from 'lucide-react'

interface SideMenuProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

// Define menu items outside component to prevent recreation on each render
const getMenuItems = (hasSubscription: boolean) => {
  if (hasSubscription) {
    return [
      { href: '/', icon: LayoutDashboard, text: 'Dashboard', color: '#00e396' },
      { href: '/tours', icon: Route, text: 'Tour Management', color: '#d83b34' },
      { href: '/calender', icon: Calendar, text: 'Tour Calendar', color: '#ff9920' },
      { href: '/tour-route', icon: MapPin, text: 'Tour Route', color: '#008ffb' },
      { href: '/data-tracking', icon: BarChart3, text: 'Tour Analytics', color: '#008ffb' },
      { href: '/stage-plot', icon: Guitar, text: 'Stage Plot Builder', color: '#ff9920' },
      { href: '/setlist', icon: ListVideo, text: 'Setlist Builder', color: '#008ffb' },
      { href: '/riders', icon: ShipWheel, text: 'Rider Creation', color: '#008ffb' },
      { href: '/leads', icon: ClipboardList, text: 'Lead Management', color: '#d83b34' },
      { href: '/venues', icon: Users, text: 'Venue Search', color: '#00e396' }
    ]
  } else {
    return [
      { href: '/pricing', icon: CreditCard, text: 'Pricing Information', color: '#00e396' },
      { href: 'https://docs.bandpracticecrm.com', icon: BookOpen, text: 'Band Practice Docs', color: '#d83b34' },
      { href: '/auth/signin', icon: LogIn, text: 'Sign In', color: '#ff9920', target: '_blank' }
    ]
  }
}

export default function SideMenu({ sidebarOpen, setSidebarOpen }: SideMenuProps) {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  // Only fetch profile data when user changes
  React.useEffect(() => {
    let isMounted = true
    
    async function getProfile() {
      if (!user) {
        return
      }
      
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single()
        
        if (!error && isMounted) {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    getProfile()
    
    return () => {
      isMounted = false
    }
  }, [user, supabase])

  const handleSignOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }, [supabase, router])

  // Check if user has active subscription
  const hasSubscription = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'

  // Memoize menu items to prevent recreation on each render
  const menuItems = React.useMemo(() => getMenuItems(hasSubscription), [hasSubscription])

  // Memoize the header component
  const HeaderSection = React.memo(() => (
    <div className="flex items-center justify-between h-16 mb-4">
      <Link 
        href="/" 
        className={`flex items-center hover:opacity-80 transition-opacity ${!sidebarOpen ? 'justify-center' : ''}`}
      >
        <div className={`justify-center ${!sidebarOpen ? 'flex w-full' : ''}`}>
          <Music className={`${sidebarOpen ? 'hidden !h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#008ffb]`} />
        </div>
        {sidebarOpen && (
          <Image 
            src="/images/logo-top-nav.png" 
            alt="Band Practice" 
            width={200} 
            height={45}
            className="object-contain"
            priority
          />
        )}
      </Link>
      <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <ChevronLeft className="h-7 w-7 text-white" /> : <ChevronRight className="h-7 w-7 text-white" />}
      </Button>
    </div>
  ))

  // Memoize the user profile section
  const UserProfileSection = React.memo(() => {
    if (!user) return null
    
    return (
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
                  onClick={() => router.push('/account/user-stats')}
                >
                  Usage Stats
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-[#242f6a] text-white rounded-md"
                  onClick={() => router.push('/account/billing')}
                >
                  Billing
                </DropdownMenuItem>
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
    )
  })

  // Memoize the navigation section
  const NavigationSection = React.memo(({ items }: { items: any[] }) => (
    <nav className="space-y-2">
      {items.map((item, index) => (
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
            {item.icon && <item.icon className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'}`} style={{ color: item.color }} />}
            {sidebarOpen && <span>{item.text}</span>}
          </Button>
        </Link>
      ))}
    </nav>
  ))

  // Memoize the footer section
  const FooterSection = React.memo(() => {
    if (!user) return null
    
    return (
      <div className="mt-auto">
        <Button 
          variant="ghost" 
          className={`w-full justify-${sidebarOpen ? 'start' : 'center'} text-gray-400 text-lg hover:bg-[#1B2559] hover:text-white ${!sidebarOpen ? 'p-0' : 'px-2'}`}
          onClick={() => router.push('https://docs.bandpracticecrm.com')}
        >
          <BookOpen className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-green-400`} />
          {sidebarOpen && <span>Docs</span>}
        </Button>            
        <Button 
          variant="ghost" 
          className={`w-full justify-${sidebarOpen ? 'start' : 'center'} text-gray-400 text-lg hover:bg-[#1B2559] hover:text-red-400 ${!sidebarOpen ? 'p-0' : 'px-2'}`}
          onClick={handleSignOut}
        >
          <LogOut className={`${sidebarOpen ? '!h-7 !w-7 mr-2' : '!h-10 !w-10'} text-[#d83b34]`} />
          {sidebarOpen && <span>Sign Out</span>}
        </Button>
      </div>
    )
  })

  // Show a minimal loading state if we're still loading and have a user
  if (loading && user) {
    return (
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out shadow-green-400 shadow-[2px_0_6px_-1px_rgba(0,0,0,0.1)] ${sidebarOpen ? '!w-72' : '!w-16'}`}
        style={{ width: sidebarOpen ? '18rem' : '4rem' }}
      >
        <div className="h-full px-3 py-4 bg-[#111c44] shadow-lg">
          <HeaderSection />
          <div className="flex items-center justify-center p-4">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out shadow-green-400 shadow-[2px_0_6px_-1px_rgba(0,0,0,0.1)] ${sidebarOpen ? '!w-72' : '!w-16'}`}
      style={{ width: sidebarOpen ? '18rem' : '4rem' }}
    >
      <div className="h-full px-3 py-4 bg-[#111c44] shadow-lg flex flex-col justify-between">
        <div>
          <HeaderSection />
          <UserProfileSection />
          <NavigationSection items={menuItems} />
        </div>
        <FooterSection />
      </div>
    </aside>
  )
}