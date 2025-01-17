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
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">6. Contact Us</h3>
              <p className="text-gray-300">If you have any questions about this Privacy Policy, please contact us at info@bandpracticecrm.com</p>
            </section>
          </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 