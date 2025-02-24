import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, CreditCard, ChartBar, Home } from 'lucide-react'

const navItems = [
  {
    title: 'Profile',
    href: '/account',
    icon: User,
    description: 'Manage your personal information'
  },
  {
    title: 'Billing',
    href: '/account/billing',
    icon: CreditCard,
    description: 'Manage your subscription & payments'
  },
  {
    title: 'Usage Stats',
    href: '/account/user-stats',
    icon: ChartBar,
    description: 'View your activity statistics'
  },
  {
    title: 'Home',
    href: '/',
    icon: Home,
    description: 'Return to main dashboard'
  }
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative group"
            >
              <motion.div
                className={`
                  relative p-4 rounded-lg border overflow-hidden
                  ${isActive 
                    ? 'bg-[#1B2559] border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'bg-[#111c44] border-blue-900 hover:border-blue-700'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-blue-500/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layoutId="activeNav"
                  />
                )}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`
                      p-2 rounded-md
                      ${isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-[#0f1729] text-gray-400 group-hover:text-blue-400'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className={`
                      font-semibold text-lg
                      ${isActive ? 'text-white' : 'text-gray-300'}
                    `}>
                      <span className="text-shadow-blur-4 text-shadow-black text-shadow-sm text-shadow-x-2 text-shadow-y-2">
                        {item.title}
                      </span>
                    </h3>
                  </div>
                  <p className={`
                    text-sm
                    ${isActive ? 'text-gray-200' : 'text-gray-400'}
                  `}>
                    {item.description}
                  </p>
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
} 