import { ContactForm } from '@/components/contact-form';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Clock, Mail, MessageCircle, MessageSquare } from 'lucide-react';

export default function Contact() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 md:py-16">
                {/* Header section */}
                <div className="mb-8 text-center md:mb-12">
                    <h1 className="mb-4 text-2xl font-bold text-slate-900 md:text-4xl dark:text-white">
                        Contact{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                            Us
                        </span>
                    </h1>
                    <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 md:mb-6 md:h-1.5 md:w-20"></div>
                    <p className="mx-auto max-w-xl px-4 text-base text-slate-600 md:text-lg dark:text-slate-300">
                        Have questions or feedback? We&apos;d love to hear from you and help with anything you need.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
                    {/* Contact Form */}
                    <Card className="overflow-hidden border border-slate-200 bg-white shadow-md lg:col-span-2 dark:border-slate-700 dark:bg-slate-800">
                        <CardContent className="p-4 md:p-8">
                            <div className="mb-4 flex items-center md:mb-6">
                                <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:mr-4 md:h-12 md:w-12 dark:from-blue-400 dark:to-blue-600">
                                    <MessageSquare className="h-4 w-4 text-white md:h-6 md:w-6" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 md:text-2xl dark:text-white">Send us a message</h2>
                            </div>
                            <ContactForm />
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <div className="space-y-4 md:space-y-6">
                        <Card className="overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <CardContent className="p-4 md:p-6">
                                <h2 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                                    <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                        <Mail className="h-3 w-3 text-white md:h-4 md:w-4" />
                                    </span>
                                    Contact Information
                                </h2>
                                <div className="mt-4 space-y-3 md:mt-6 md:space-y-4">
                                    <div className="flex items-start space-x-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:p-4 dark:border-slate-700 dark:bg-slate-700/40">
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

                                    <div className="flex items-start space-x-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:p-4 dark:border-slate-700 dark:bg-slate-700/40">
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
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <CardContent className="p-4 md:p-6">
                                <h2 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                                    <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                        <Clock className="h-3 w-3 text-white md:h-4 md:w-4" />
                                    </span>
                                    Response Time
                                </h2>
                                <p className="mt-2 text-sm text-slate-600 md:mt-3 md:text-base dark:text-slate-300">
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
