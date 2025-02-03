import { Twitter, Facebook, Linkedin, Github, Mail, createLucideIcon } from "lucide-react"
import Image from "next/image"

const Xlogo  = createLucideIcon('Xlogo', [
  ['path', { d: 'M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z', key: '1' }],
]);

export default Xlogo;

export function Footer() {
  return (
    <footer className="mt-6 ml-6 pb-0  text-white font-mono">
      <div className="max -w-[1200px] pl-0 m-auto ml-2">
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="flex-auto  px-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-[#008ffb]">CRM</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/pricing" className="hover:text-[#008ffb] transition-colors">Pricing</a></li>
              <li><a href="https://docs.bandpracticecrm.com" className="hover:text-[#008ffb] transition-colors">Documentation</a></li>
              {/* <li><a href="/faq" className="hover:text-[#008ffb] transition-colors">FAQ</a></li> */}
            </ul>
          </div>
          <div className="flex-auto   mx-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-[#008ffb]">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/legal/privacy-policy" className="hover:text-[#008ffb] transition-colors">Privacy Policy</a></li>
              <li><a href="/legal/terms-of-service" className="hover:text-[#008ffb] transition-colors">Terms of Service</a></li>
              <li><a href="/legal/cookie-policy" className="hover:text-[#008ffb] transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
       
          <div className="flex-auto  px-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-[#008ffb]">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/support/contact" className="hover:text-[#008ffb] transition-colors">Contact Us</a></li>
              {/* <li><a href="/status" className="hover:text-[#008ffb] transition-colors">System Status</a></li> */}
              {/* <li><a href="/feedback" className="hover:text-[#008ffb] transition-colors">Feedback</a></li> */}
            </ul>
          </div>
          <div className="flex-auto  px-4 mb-6">
          </div>
          <div className="flex-auto px-0 mb-6 ml-12  -mt-2 ">
            <Image 
              src="/images/logo-top-nav.png" 
              alt="Band Practice" 
              width={200} 
              height={45}
              className="object-contain mt-0 mr-10 mb-2 pt-0 pb-0 float-right"
            />
            <ul className="space-y-2 text-sm clear-both float-right mr-10 mt-2">
              <li className="flex space-x-4 mt-0 mr-1">
                <a href="mailto:info@bandpracticecrm.com" className="hover:text-[#008ffb] transition-colors">
                  <Mail className="h-5 w-5 -mt-1 ml-0" />
                </a>
                {/* <a href="https://twitter.com/bandpracticecrm" className="hover:text-[#008ffb] transition-colors">
                  <Xlogo  className="h-5 w-5 mt-0 ml-1" />
                </a> */}
                <a href="https://www.facebook.com/BandPracticeCRM/" className="hover:text-[#008ffb] transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                {/* <a href="https://linkedin.com/company/bandpracticecrm" className="hover:text-[#008ffb] transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a> */}
              </li>
            </ul>
            <div className="pt-2  text-right clear-both mr-10 mt-2">
              <p className="mt-2  text-sm text-gray-500">&copy; {new Date().getFullYear()}  All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 