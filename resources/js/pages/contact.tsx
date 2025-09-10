import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/main-layout';
import { Form } from '@inertiajs/react';
import {
    Clock,
    LoaderCircle,
    Mail,
    MessageCircle,
} from 'lucide-react';
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
            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="mb-8 md:mb-12 text-center">
                    <h1 className="text-2xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                        Contact{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                            Us
                        </span>
                    </h1>
                    <div className="mx-auto w-16 md:w-20 h-1 md:h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-4 md:mb-6"></div>
                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto px-4">
                        Have questions or feedback? We'd love to hear from you and help with anything you need.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-input bg-card p-6 shadow-md">
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-semibold text-card-foreground">Send us a message</h2>
                                <p className="mt-1 text-sm text-muted-foreground">We'll get back to you as soon as possible</p>
                            </div>

                            <Form 
                                action="/contact" 
                                method="post" 
                                className="flex flex-col gap-6"
                                onSuccess={() => {
                                    toast.success("Message sent successfully!", {
                                        description: "We'll get back to you within 24-48 hours.",
                                        duration: 5000,
                                    });
                                }}
                                resetOnSuccess={true}
                                onError={(errors) => {
                                    // Show specific error if it's a server error (like email sending failure)
                                    if (errors.email && errors.email.includes('error sending')) {
                                        toast.error("Failed to send message", {
                                            description: errors.email,
                                            duration: 8000,
                                        });
                                    } else if (errors.form) {
                                        // Rate limiting or general form errors
                                        toast.error("Form submission failed", {
                                            description: errors.form,
                                            duration: 8000,
                                        });
                                    } else if (Object.keys(errors).length > 0) {
                                        // General validation errors
                                        toast.error("Please check your form", {
                                            description: "Fix the highlighted errors and try again.",
                                            duration: 5000,
                                        });
                                    }
                                }}
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">Name</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        placeholder="Your name"
                                                        required
                                                        autoFocus
                                                    />
                                                    <div className="min-h-[20px]">
                                                        <InputError message={errors.name} />
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder="Your email address"
                                                        required
                                                    />
                                                    <div className="min-h-[20px]">
                                                        <InputError message={errors.email} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Honeypot field - hidden from users */}
                                            <input
                                                type="text"
                                                name="website"
                                                style={{ display: 'none' }}
                                                tabIndex={-1}
                                                autoComplete="off"
                                            />

                                            <div className="grid gap-2">
                                                <Label htmlFor="message">Message</Label>
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    placeholder="How can we help you?"
                                                    className="min-h-[120px] resize-none"
                                                    required
                                                />
                                                <InputError message={errors.message} />
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="mt-2 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                            >
                                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                Send Message
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>

                    {/* Contact Information Sidebar */}
                    <div className="space-y-4 md:space-y-6">
                        {/* Contact Information Card */}
                        <div className="text-card-foreground flex flex-col gap-6 rounded-xl py-6 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="p-4 md:p-6">
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4 flex items-center">
                                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                                        <Mail className="h-3 w-3 md:h-4 md:w-4 text-white" />
                                    </span>
                                    Contact Information
                                </h2>
                                <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                                    <div className="flex items-start space-x-3 p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors duration-200">
                                        <Mail className="h-4 w-4 md:h-5 md:w-5 mt-0.5 text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-200 text-sm md:text-base">
                                                Contact Email
                                            </p>
                                            <a
                                                href="mailto:info@diuacm.com"
                                                className="text-sm md:text-base text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors break-all"
                                            >
                                                info@diuacm.com
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors duration-200">
                                        <MessageCircle className="h-4 w-4 md:h-5 md:w-5 mt-0.5 text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-200 text-sm md:text-base">
                                                Telegram Channel
                                            </p>
                                            <a
                                                href="https://t.me/+AH0gg2-V5xIxYjA9"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm md:text-base text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors break-all"
                                            >
                                                https://t.me/+AH0gg2-V5xIxYjA9
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Response Time Card */}
                        <div className="text-card-foreground flex flex-col gap-6 rounded-xl py-6 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="p-4 md:p-6">
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4 flex items-center">
                                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                                        <Clock className="h-3 w-3 md:h-4 md:w-4 text-white" />
                                    </span>
                                    Response Time
                                </h2>
                                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 md:mt-3">
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
