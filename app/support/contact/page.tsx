"use client"

import { useState, useRef } from 'react';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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

  const verifyRecaptcha = async (token: string | null) => {
    if (!token) return false;
    
    try {
      const response = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      console.log('reCAPTCHA verification response:', data);
      
      if (!data.success) {
        setSubmitStatus({
          type: 'error',
          message: `CAPTCHA verification failed: ${data.message || 'Please try again.'} ${data.error_codes ? `(${data.error_codes.join(', ')})` : ''}`
        });
        return false;
      }
      return data.success;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Verification failed. Please try again.'
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    // Verify reCAPTCHA
    const token = recaptchaRef.current?.getValue();
    if (!token) {
      setSubmitStatus({
        type: 'error',
        message: 'Please complete the CAPTCHA verification'
      });
      setIsSubmitting(false);
      return;
    }

    // Verify CAPTCHA server-side
    const isVerified = await verifyRecaptcha(token);
    if (!isVerified) {
      setSubmitStatus({
        type: 'error',
        message: 'CAPTCHA verification failed. Please try again.'
      });
      setIsSubmitting(false);
      recaptchaRef.current?.reset();
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          to: 'jason@bandpracticecrm.com'
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
                Whether you're a solo artist planning your first tour or an established band managing multiple shows, our dedicated support team brings years of industry experience to help you make the most of Band Practice CRM. We'll get back to you within 48 hours with the guidance you need to keep your music business running smoothly.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="mt-0 sm:mx-auto sm:w-full sm:max-w-[75%]">
            <AnimatePresence mode="wait">
              {submitStatus.type === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center py-12 px-4 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-white mb-4"
                  >
                    Message Sent Successfully!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-300 mb-8"
                  >
                    Thank you for reaching out. We'll get back to you within 48 hours.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {/* <Button
                      onClick={() => setSubmitStatus({ type: null, message: '' })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                      Send Another Message
                      <ArrowRight className="w-4 h-4" />
                    </Button> */}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#030817] pt-4 mt-0 shadow sm:rounded-lg sm:px-4 border-blue-600 border"
                >   
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

                    <div className="w-full flex justify-center items-center py-4">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                        theme="dark"
                        hl="en"
                        badge="inline"
                        type="image"
                      />
                    </div>

                    {submitStatus.type === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded bg-red-900/50 text-red-300"
                      >
                        {submitStatus.message}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-700 font-semibold text-white shadow-sm hover:bg-green-800 focus-visible:outline outline-black w-full p-6"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 