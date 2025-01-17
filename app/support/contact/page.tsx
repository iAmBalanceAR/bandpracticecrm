"use client"

import { useState, useRef } from 'react';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    // Verify reCAPTCHA
    const recaptchaValue = recaptchaRef.current?.getValue();
    if (!recaptchaValue) {
      setSubmitStatus({
        type: 'error',
        message: 'Please complete the CAPTCHA verification'
      });
      setIsSubmitting(false);
      return;
    }

    // Verify CAPTCHA server-side
    try {
      const verifyResponse = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaValue }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setSubmitStatus({
          type: 'error',
          message: 'CAPTCHA verification failed. Please try again.'
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          to: 'info@bandpracticecrm.com'
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setSubmitStatus({
        type: 'success',
        message: 'Your message has been sent successfully!'
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
      recaptchaRef.current?.reset();
    }
  };

  return (
    <CustomSectionHeader title="Contact Us" underlineColor="#D83B34">
      <Card className="bg-[#111C44] border-none">
        <CardHeader>
          <div className="grid grid-cols-3">
        <div className="col-span-1 ">
            <Image
              src="/images/contact-hero.jpg"
              alt="Concert crowd"
              width={340}
              height={200}
              className=" rounded-lg border border-blue-600"
            />
            </div>
            <div className="col-span-2">
            <p className="text-gray-300 mr-10 ml-0">
              Need help managing your tours, gigs, or have questions about our platform? Our team of music industry professionals is here to help you streamline your band's operations. From coordinating multiple venue bookings and optimizing tour routes, to managing contracts and tracking payments - we understand the unique challenges that bands and musicians face. 
              </p>
              <p className="text-gray-300 mr-10 mt-6">
              Whether you're a solo artist planning your first tour or an established band managing multiple shows, our dedicated support team brings years of industry experience to help you make the most of Band Practice CRM. We'll get back to you within 24 hours with the guidance you need to keep your music business running smoothly.
            </p>
            </div>
</div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
        <div className="mt-0 sm:mx-auto sm:w-full sm:max-w-[75%]">
        <div className="bg-[#030817] pt-4 mt-0 shadow sm:rounded-lg sm:px-4 border-blue-600 border">   

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Full Name"
                 className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:text-md sm:leading-6 py-6"
                />
              </div>

              <div>
                <Label htmlFor="email" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="Email Address"
                  className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:text-md sm:leading-6 py-6"
                />
              </div>

              <div>
                <Label htmlFor="message" />
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                  placeholder="How can we help you?"
                  className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:text-md sm:leading-6 min-h-[150px]"
                   />
              </div>

              {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
                <div className="w-full flex justify-center items-center py-4">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                    theme="dark"
                  />
                </div>
              ) : (
                <Alert variant="destructive" className="bg-red-900 border-red-600 text-white">
                  <AlertDescription>ReCAPTCHA configuration is missing. Please contact support.</AlertDescription>
                </Alert>
              )}

              {submitStatus.type && (
                <div className={`p-4 rounded ${
                  submitStatus.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                }`}>
                  {submitStatus.message}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className=" bg-green-700 font-semibold text-white shadow-sm hover:bg-green-800 focus-visible:outline outline-black w-full p-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
            <div className="clear-both mb-4"></div>
        </div></div>
            </CardContent>
        </Card>
    </CustomSectionHeader>
      );
} 