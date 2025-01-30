"use client"

import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <CustomSectionHeader title="Privacy Policy" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
        <CardContent className="p-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-white">Privacy Policy for Band Practice CRM</h2>
            <p className="text-gray-300 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <div className="flex">
            <div className="flex flex-col gap-4">
            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">1. Information We Collect</h3>
              <p className="text-gray-300 mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Name and contact information</li>
                <li>Account credentials</li>
                <li>Tour and gig management data</li>
                <li>Communication preferences</li>
              </ul>
            </section>
            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">2. How We Use Your Information</h3>
              <p className="text-gray-300 mb-2">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Provide and maintain our services</li>
                <li>Process your transactions</li>
                <li>Send you service-related communications</li>
                <li>Improve our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">3. Information Sharing</h3>
              <p className="text-gray-300">We do not sell or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
              </ul>
            </section>
            </div>
            <div className="flex flex-col gap-4">
            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">4. Data Security</h3>
              <p className="text-gray-300 mr=14">We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or destruction.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">5. Your Rights</h3>
              <p className="text-gray-300">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">6. GDPR Compliance</h3>
              <p className="text-gray-300 mb-2">For users in the European Union, we comply with GDPR requirements:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Legal basis for processing data</li>
                <li>Data minimization principles</li>
                <li>72-hour breach notification</li>
                <li>Right to be forgotten</li>
                <li>Data portability</li>
              </ul>
              <p className="text-gray-300 mt-2">Our Data Protection Officer can be contacted at <a href="mailto:dpo@bandpracticecrm.com" className="text-blue-400 hover:text-blue-300">dpo@bandpracticecrm.com</a></p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">7. Data Retention</h3>
              <p className="text-gray-300 mb-2">We retain your data for as long as necessary to:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p className="text-gray-300 mt-2">After account deletion, we may retain certain data for up to 30 days for backup purposes.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">8. Data Export</h3>
              <p className="text-gray-300">You can export your data at any time through your account settings. Exported data includes:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Tour and gig information</li>
                <li>Venue contacts</li>
                <li>Stage plot designs</li>
                <li>Account settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">9. California Privacy Rights (CCPA)</h3>
              <p className="text-gray-300 mb-2">California residents have the following additional rights:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Right to know what personal information is collected</li>
                <li>Right to know whether personal information is sold or disclosed</li>
                <li>Right to say no to the sale of personal information</li>
                <li>Right to access personal information</li>
                <li>Right to equal service and price</li>
              </ul>
              <p className="text-gray-300 mt-2">To exercise these rights, please contact us at <a href="mailto:privacy@bandpracticecrm.com" className="text-blue-400 hover:text-blue-300">privacy@bandpracticecrm.com</a></p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">10. Changes to This Policy</h3>
              <p className="text-gray-300">We will notify you of any material changes to this Privacy Policy via email and/or a prominent notice on our website. Changes become effective immediately upon posting.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">11. Contact Us</h3>
              <p className="text-gray-300">If you have any questions about this Privacy Policy, please contact us at <a href="mailto:info@bandpracticecrm.com" className="text-blue-400 hover:text-blue-300">info@bandpracticecrm.com</a></p>
            </section>
          </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 