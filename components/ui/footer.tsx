import { Twitter, Facebook, Linkedin, Github, Mail } from "lucide-react"
import Image from "next/image"
export function Footer() {
  return (
    <footer className="w-full mt-6 ml-8 pb-4 text-white font-mono">
      <div className="w-[1200px] pl-4 m-auto">
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="flex-auto  px-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-[#008ffb]">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/pricing" className="hover:text-[#008ffb] transition-colors">Pricing</a></li>
              <li><a href="/about" className="hover:text-[#008ffb] transition-colors">About Us</a></li>
              <li><a href="/support" className="hover:text-[#008ffb] transition-colors">Support</a></li>
            </ul>
          </div>
          <div className="flex-auto   mx-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-[#008ffb]">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="hover:text-[#008ffb] transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-[#008ffb] transition-colors">Terms of Service</a></li>
              <li><a href="/cookie-policy" className="hover:text-[#008ffb] transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
          <div className="flex-auto  px-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-[#008ffb]">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/docs" className="hover:text-[#008ffb] transition-colors">Documentation</a></li>
              <li><a href="/faq" className="hover:text-[#008ffb] transition-colors">FAQ</a></li>
              <li><a href="/blog" className="hover:text-[#008ffb] transition-colors">Blog</a></li>
            </ul>
          </div>
          <div className="flex-auto  px-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-[#008ffb]">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/contact" className="hover:text-[#008ffb] transition-colors">Contact Us</a></li>
              <li><a href="/status" className="hover:text-[#008ffb] transition-colors">System Status</a></li>
              <li><a href="/feedback" className="hover:text-[#008ffb] transition-colors">Feedback</a></li>
            </ul>
          </div>
          <div className="flex-auto px-4 mb-6 ml-16">
          <Image 
                  src="/images/logo-top-nav.png" 
                  alt="Band Practice" 
                  width={200} 
                  height={45}
                  className="object-contain"
                />
            <ul className="space-y-2 text-sm">
              <li className="flex space-x-4 mt-4 ml-4">
                <a href="mailto:contact@bandpracticecrm.com" className="hover:text-[#008ffb] transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="https://twitter.com/bandpracticecrm" className="hover:text-[#008ffb] transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://facebook.com/bandpracticecrm" className="hover:text-[#008ffb] transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com/company/bandpracticecrm" className="hover:text-[#008ffb] transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://github.com/bandpracticecrm" className="hover:text-[#008ffb] transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-2  text-right mr-16">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()}  All Rights Reserved.</p>
          <p className="text-xs mt-1 text-gray-500">
            <a href="#" className="hover:text-[#008ffb] transition-colors">Site by Balance Media LLC</a>
          </p>
        </div>
      </div>
    </footer>
  )
} 