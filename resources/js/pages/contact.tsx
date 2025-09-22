import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Mail, MessageSquare, Clock, MessageCircle } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';

export default function Contact() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 md:py-16">
                {/* Header section */}
                <div className="mb-8 md:mb-12 text-center">
                    <h1 className="text-2xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                        Contact{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                            Us
                        </span>
                    </h1>
                    <div className="mx-auto w-16 md:w-20 h-1 md:h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-4 md:mb-6"></div>
                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto px-4">
                        Have questions or feedback? We&apos;d love to hear from you and help with anything you need.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Contact Form */}
                    <Card className="lg:col-span-2 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                        <CardContent className="p-4 md:p-8">
                            <div className="flex items-center mb-4 md:mb-6">
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                                    <MessageSquare className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">
                                    Send us a message
                                </h2>
                            </div>
                            <ContactForm />
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <div className="space-y-4 md:space-y-6">
                        <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                            <CardContent className="p-4 md:p-6">
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4 flex items-center">
                                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                                        <Mail className="h-3 w-3 md:h-4 md:w-4 text-white" />
                                    </span>
                                    Contact Information
                                </h2>
                                <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                                    <div className="flex items-start space-x-3 p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
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

                                    <div className="flex items-start space-x-3 p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
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
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                            <CardContent className="p-4 md:p-6">
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4 flex items-center">
                                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                                        <Clock className="h-3 w-3 md:h-4 md:w-4 text-white" />
                                    </span>
                                    Response Time
                                </h2>
                                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 md:mt-3">
                                    We typically respond to inquiries within 24-48 hours during weekdays.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}