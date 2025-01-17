"use client"

import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function CookiePolicy() {
  return (
    <CustomSectionHeader title="Cookie Policy" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
        <CardContent className="p-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-white">Cookie Policy for Band Practice CRM</h2>
            <p className="text-gray-300 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">1. What Are Cookies</h3>
              <p className="text-gray-300">Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience and enable certain features to function properly.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">2. Types of Cookies We Use</h3>
              <div className="text-gray-300">
                <h4 className="text-lg font-medium mb-2 text-white">Essential Cookies:</h4>
                <p className="mb-4">Required for the website to function properly. These cannot be disabled.</p>

                <h4 className="text-lg font-medium mb-2 text-white">Functional Cookies:</h4>
                <p className="mb-4">Help us remember your preferences and customize your experience.</p>

                <h4 className="text-lg font-medium mb-2 text-white">Analytics Cookies:</h4>
                <p className="mb-4">Help us understand how visitors interact with our website.</p>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">3. How We Use Cookies</h3>
              <ul className="list-disc pl-6 text-gray-300">
                <li>To keep you signed in</li>
                <li>To remember your preferences</li>
                <li>To understand how you use our service</li>
                <li>To improve our website and services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">4. Managing Cookies</h3>
              <p className="text-gray-300 mb-4">You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.</p>
              <p className="text-gray-300">However, if you do this, you may have to manually adjust some preferences every time you visit our website and some services and functionalities may not work.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">5. Third-Party Cookies</h3>
              <p className="text-gray-300">We may use third-party services that also set cookies. These are used for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Analytics (e.g., Google Analytics)</li>
                <li>Authentication (e.g., Supabase)</li>
                <li>Payment processing (e.g., Stripe)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">6. Updates to This Policy</h3>
              <p className="text-gray-300">We may update this Cookie Policy from time to time. We encourage you to periodically review this page for the latest information about our cookie practices.</p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white">7. Contact Us</h3>
              <p className="text-gray-300">If you have any questions about our Cookie Policy, please contact us at info@bandpracticecrm.com</p>
            </section>
          </div>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 