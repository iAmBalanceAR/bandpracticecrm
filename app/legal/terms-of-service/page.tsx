"use client"

import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <CustomSectionHeader title="Terms of Service" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
        <CardContent className="p-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-white">Terms of Service for Band Practice CRM</h2>
            <p className="text-gray-300 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">1. Acceptance of Terms</h3>
              <p className="text-gray-300">By accessing and using Band Practice CRM, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">2. Service Description</h3>
              <p className="text-gray-300">Band Practice CRM provides tour and gig management tools for musicians and bands. We reserve the right to modify or discontinue the service at any time.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">3. User Accounts</h3>
              <p className="text-gray-300 mb-2">Users are responsible for:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Maintaining account security</li>
                <li>Providing accurate information</li>
                <li>All activities under their account</li>
                <li>Notifying us of unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">4. Payment Terms</h3>
              <p className="text-gray-300 mb-2">For paid services:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Payments are processed securely</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>Refunds are subject to our refund policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">5. Intellectual Property</h3>
              <p className="text-gray-300">All content and functionality on Band Practice CRM is protected by intellectual property rights. Users may not copy, modify, or distribute our content without permission.</p>
              <p className="text-gray-300">All data and information on Band Practice CRM is for educational purposes only. The databases and data contained therein is and will remain the property of Band Practice CRM.</p>
              <p className="text-gray-300">Band Practice CRM reserves the right to discontinue, cancel or modify the service at any time. Service is provided with no measure of warranty either declared or implied.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">6. Limitation of Liability</h3>
              <p className="text-gray-300">Band Practice CRM is provided "as is" without warranties. We are not liable for any damages arising from the use of our service.</p>
              <p className="text-gray-300">Using Band Practice CRM constitutes acceptance of these terms. Band Practice CRM, nor its owners or anyone else involved in the project are offering any advice, legal or otherwise. Band Practice CRM is not a professional service and is not intended to be used as such. User is responsible for their own actions and decisions.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">7. Termination</h3>
              <p className="text-gray-300">We may terminate or suspend access to our service immediately, without prior notice, for conduct that violates these Terms.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">8. Dispute Resolution</h3>
              <p className="text-gray-300 mb-2">In the event of any dispute, claim, or controversy arising out of or relating to these Terms:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Parties will attempt to resolve any dispute informally first</li>
                <li>If informal resolution fails, disputes will be resolved through binding arbitration</li>
                <li>Arbitration will be conducted in accordance with the American Arbitration Association rules</li>
                <li>The arbitration will take place in Texas, United States</li>
                <li>The language of arbitration shall be English</li>
              </ul>
              <p className="text-gray-300 mt-2">You agree to resolve disputes individually and waive any right to participate in a class action lawsuit.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">9. Version History</h3>
              <p className="text-gray-300 mb-2">Recent changes to these Terms:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>January 2024: Added dispute resolution section and GDPR compliance information</li>
                <li>December 2023: Updated payment terms and subscription policies</li>
                <li>November 2023: Initial release</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">10. Contact Information</h3>
              <p className="text-gray-300">For questions about these Terms, please contact us at <a href="mailto:info@bandpracticecrm.com" className="text-blue-400 hover:text-blue-300">info@bandpracticecrm.com</a></p>
            </section>
          </div>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 