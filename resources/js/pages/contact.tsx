import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/main-layout';
import { Form } from '@inertiajs/react';
import { Clock, LoaderCircle, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Contact Page Component
 *
 * Features:
 * - Contact form with validation
 * - Email sending to submissions@diuacm.com
 * - Success/error feedback with Sonner toasts (no duplicate messages)
 * - Responsive design with dark mode support
 * - Loading states during form submission
 * - Individual field error highlighting
 *
 * UX Improvements:
 * - Single source of truth for feedback (Sonner toasts)
 * - Smart error handling (server errors vs validation errors)
 * - Clean, focused form interface
 * - Auto-dismissing success messages
 */

export default function Contact() {
    return (
        <MainLayout title="Contact Us">
            <div className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        Contact{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                            Us
                        </span>
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                    <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                        Have questions or feedback? We'd love to hear from you and help with anything you need.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="flex flex-col gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white py-6 text-card-foreground shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <div className="p-4 md:p-6">
                                <h2 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                                    <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                        <MessageCircle className="h-3 w-3 text-white md:h-4 md:w-4" />
                                    </span>
                                    Send us a message
                                </h2>
                                <p className="mt-1 text-sm text-slate-600 md:text-base dark:text-slate-300">
                                    We'll get back to you as soon as possible
                                </p>
                            </div>

                            <div className="px-4 pb-4 md:px-6 md:pb-6">
                                <Form
                                    action="/contact"
                                    method="post"
                                    key="contact-form"
                                    className="flex flex-col gap-6"
                                    onSuccess={() => {
                                        toast.success('Message sent successfully!', {
                                            description: "We'll get back to you within 24-48 hours.",
                                            duration: 5000,
                                        });
                                    }}
                                    resetOnSuccess={true}
                                    onError={(errors) => {
                                        // Show specific error if it's a server error (like email sending failure)
                                        if (errors.email && errors.email.includes('error sending')) {
                                            toast.error('Failed to send message', {
                                                description: errors.email,
                                                duration: 8000,
                                            });
                                        } else if (errors.form) {
                                            // Rate limiting or general form errors
                                            toast.error('Form submission failed', {
                                                description: errors.form,
                                                duration: 8000,
                                            });
                                        } else if (Object.keys(errors).length > 0) {
                                            // General validation errors
                                            toast.error('Please check your form', {
                                                description: 'Fix the highlighted errors and try again.',
                                                duration: 5000,
                                            });
                                        }
                                    }}
                                >
                                    {({ processing, errors, isDirty }) => (
                                        <>
                                            <div className="grid gap-6">
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name" className="text-slate-900 dark:text-slate-200">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            placeholder="Your name"
                                                            required
                                                            autoFocus
                                                            aria-describedby={errors.name ? 'name-error' : undefined}
                                                            aria-invalid={errors.name ? 'true' : 'false'}
                                                            className={`border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400 ${errors.name ? 'border-red-500 dark:border-red-400' : ''}`}
                                                        />
                                                        <div className="min-h-[20px]">
                                                            <InputError message={errors.name} id="name-error" />
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="email" className="text-slate-900 dark:text-slate-200">
                                                            Email
                                                        </Label>
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            placeholder="Your email address"
                                                            required
                                                            aria-describedby={errors.email ? 'email-error' : undefined}
                                                            aria-invalid={errors.email ? 'true' : 'false'}
                                                            className={`border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400 ${errors.email ? 'border-red-500 dark:border-red-400' : ''}`}
                                                        />
                                                        <div className="min-h-[20px]">
                                                            <InputError message={errors.email} id="email-error" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Honeypot field - hidden from users */}
                                                <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                                                <div className="grid gap-2">
                                                    <Label htmlFor="message" className="text-slate-900 dark:text-slate-200">
                                                        Message
                                                    </Label>
                                                    <Textarea
                                                        id="message"
                                                        name="message"
                                                        placeholder="How can we help you?"
                                                        aria-describedby={errors.message ? 'message-error' : undefined}
                                                        aria-invalid={errors.message ? 'true' : 'false'}
                                                        className={`min-h-[120px] resize-none border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400 ${errors.message ? 'border-red-500 dark:border-red-400' : ''}`}
                                                        required
                                                    />
                                                    <InputError message={errors.message} id="message-error" />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={processing || !isDirty}
                                                    className="mt-2 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                                >
                                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                                    {processing ? 'Sending...' : 'Send Message'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Sidebar */}
                    <div className="space-y-4 md:space-y-6">
                        {/* Contact Information Card */}
                        <div className="flex flex-col gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white py-6 text-card-foreground shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <div className="p-4 md:p-6">
                                <h2 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                                    <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                        <Mail className="h-3 w-3 text-white md:h-4 md:w-4" />
                                    </span>
                                    Contact Information
                                </h2>
                                <div className="mt-4 space-y-3 md:mt-6 md:space-y-4">
                                    <div className="flex items-start space-x-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors duration-200 hover:border-blue-200 md:p-4 dark:border-slate-700 dark:bg-slate-700/40 dark:hover:border-blue-800">
                                        <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 md:h-5 md:w-5" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 md:text-base dark:text-slate-200">Contact Email</p>
                                            <a
                                                href="mailto:info@diuacm.com"
                                                className="text-sm break-all text-slate-600 transition-colors hover:text-blue-500 md:text-base dark:text-slate-300 dark:hover:text-blue-400"
                                            >
                                                info@diuacm.com
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors duration-200 hover:border-blue-200 md:p-4 dark:border-slate-700 dark:bg-slate-700/40 dark:hover:border-blue-800">
                                        <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 md:h-5 md:w-5" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 md:text-base dark:text-slate-200">Telegram Channel</p>
                                            <a
                                                href="https://t.me/+AH0gg2-V5xIxYjA9"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm break-all text-slate-600 transition-colors hover:text-blue-500 md:text-base dark:text-slate-300 dark:hover:text-blue-400"
                                            >
                                                https://t.me/+AH0gg2-V5xIxYjA9
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Response Time Card */}
                        <div className="flex flex-col gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white py-6 text-card-foreground shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <div className="p-4 md:p-6">
                                <h2 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                                    <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                        <Clock className="h-3 w-3 text-white md:h-4 md:w-4" />
                                    </span>
                                    Response Time
                                </h2>
                                <p className="mt-2 text-sm text-slate-600 md:mt-3 md:text-base dark:text-slate-300">
                                    We typically respond to inquiries within 24-48 hours during weekdays.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
