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
              <p className="text-gray-300">All data and information on Band Practice CRM is for educational purposes only. The databases and data contained therin is the and will remain teh property of Band Pracctice CRM.s.</p>
              <p className="text-gray-300">Band Practice CRM reserves the right to disconinu, cancel or modify the service at any time. Service is proiided with no messure of warenty either declared or implied. </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">6. Limitation of Liability</h3>
              <p className="text-gray-300">Band Practice CRM is provided "as is" without warranties. We are not liable for any damages arising from the use of our service.</p>
              <p className="text-gray-300">uSING bADN pRACTICE CRM constitutes acceptance of these terms.  Band Practice CRM, inor it's owners or anyone else involved in the prjoect are offering any advicecc, legal or otherwise.  Band Practice CRM is not a professional service and is not intended to be used as such. User is responsible for their own actions and decisions.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">7. Termination</h3>
              <p className="text-gray-300">We may terminate or suspend access to our service immediately, without prior notice, for conduct that violates these Terms.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">8. Contact Information</h3>
              <p className="text-gray-300">For questions about these Terms, please contact us at info@bandpracticecrm.com</p>
            </section>
          </div>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 