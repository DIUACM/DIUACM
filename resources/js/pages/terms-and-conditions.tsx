import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { AlertTriangle, FileText, Gavel, Mail, Shield, Users } from 'lucide-react';

export default function TermsAndConditionsPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16">
                {/* Header section */}
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        Terms{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                            & Conditions
                        </span>
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                    <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                        Terms and conditions for using DIU ACM website and services
                    </p>
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                        Last updated:{' '}
                        {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>

                {/* Agreement to Terms */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Agreement to Terms</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                Welcome to DIU ACM! These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of our website and services
                                operated by DIU ACM, a wing under DIU CPC at Daffodil International University.
                            </p>
                            <p>
                                By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of these terms,
                                then you may not access the service.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Use License */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 dark:from-green-400 dark:to-green-600">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Use License</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                Permission is granted to temporarily download one copy of the materials on DIU ACM&apos;s website for personal,
                                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this
                                license you may not:
                            </p>
                            <ul className="ml-4 list-inside list-disc space-y-2">
                                <li>Modify or copy the materials</li>
                                <li>Use the materials for any commercial purpose or for any public display</li>
                                <li>Attempt to reverse engineer any software contained on the website</li>
                                <li>Remove any copyright or other proprietary notations from the materials</li>
                            </ul>
                            <p>
                                This license shall automatically terminate if you violate any of these restrictions and may be terminated by DIU ACM
                                at any time.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* User Accounts */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 dark:from-purple-400 dark:to-purple-600">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Accounts</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-200">Account Creation</h3>
                                <ul className="ml-4 list-inside list-disc space-y-1">
                                    <li>You must provide accurate and complete information when creating an account</li>
                                    <li>You are responsible for safeguarding your account credentials</li>
                                    <li>You must immediately notify us of any unauthorized use of your account</li>
                                    <li>You may not use another person&apos;s account without permission</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-200">Account Responsibilities</h3>
                                <ul className="ml-4 list-inside list-disc space-y-1">
                                    <li>You are responsible for all activities that occur under your account</li>
                                    <li>You must maintain the security of your account and password</li>
                                    <li>You must not share your account with others</li>
                                    <li>You must keep your profile information accurate and up-to-date</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Acceptable Use */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-700 dark:from-orange-400 dark:to-orange-600">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceptable Use Policy</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>You agree not to use the service to:</p>
                            <ul className="ml-4 list-inside list-disc space-y-2">
                                <li>Violate any applicable laws or regulations</li>
                                <li>Transmit any harmful, offensive, or inappropriate content</li>
                                <li>Impersonate any person or entity</li>
                                <li>Interfere with or disrupt the service or servers</li>
                                <li>Attempt to gain unauthorized access to any part of the service</li>
                                <li>Use automated scripts or bots to access the service</li>
                                <li>Submit false or misleading information</li>
                                <li>Engage in any form of harassment or bullying</li>
                                <li>Violate the intellectual property rights of others</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Contest Participation */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 dark:from-yellow-400 dark:to-yellow-600">
                                <Gavel className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Contest Participation</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-200">Fair Play</h3>
                                <ul className="ml-4 list-inside list-disc space-y-1">
                                    <li>All contest participants must follow fair play principles</li>
                                    <li>Cheating, plagiarism, or any form of academic dishonesty is strictly prohibited</li>
                                    <li>Collaboration during individual contests is not allowed unless explicitly permitted</li>
                                    <li>Use of unauthorized resources or assistance is prohibited</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-200">Consequences of Violations</h3>
                                <ul className="ml-4 list-inside list-disc space-y-1">
                                    <li>Disqualification from current and future contests</li>
                                    <li>Removal from leaderboards and rankings</li>
                                    <li>Suspension or termination of account</li>
                                    <li>Reporting to university authorities if applicable</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Intellectual Property */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 dark:from-red-400 dark:to-red-600">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Intellectual Property Rights</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                The service and its original content, features, and functionality are and will remain the exclusive property of DIU
                                ACM and its licensors. The service is protected by copyright, trademark, and other laws.
                            </p>
                            <p>
                                You retain rights to any content you submit, post, or display on or through the service. By submitting content, you
                                grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content in
                                connection with the service.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy and Data */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy and Data Protection</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when
                                you use our service. By using our service, you agree to the collection and use of information in accordance with our
                                Privacy Policy.
                            </p>
                            <p>
                                Please note that contest results, rankings, and programming achievements may be displayed publicly as part of our
                                competitive programming activities.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Termination */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-700 dark:from-pink-400 dark:to-pink-600">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Termination</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability,
                                under our sole discretion, for any reason whatsoever, including but not limited to a breach of the Terms.
                            </p>
                            <p>
                                If you wish to terminate your account, you may simply discontinue using the service or contact us to request account
                                deletion.
                            </p>
                            <p>
                                Upon termination, your right to use the service will cease immediately. All provisions of the Terms which by their
                                nature should survive termination shall survive termination.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Disclaimers and Limitations */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-500 to-gray-700 dark:from-gray-400 dark:to-gray-600">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Disclaimers and Limitation of Liability</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                The information on this website is provided on an &ldquo;as is&rdquo; basis. To the fullest extent permitted by law,
                                DIU ACM excludes all representations, warranties, conditions, and terms relating to our website and the use of this
                                website.
                            </p>
                            <p>
                                In no event shall DIU ACM or its suppliers be liable for any damages arising out of the use or inability to use the
                                materials on the website, even if DIU ACM or an authorized representative has been notified orally or in writing of
                                the possibility of such damage.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Changes to Terms */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 dark:from-teal-400 dark:to-teal-600">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Changes to Terms</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material,
                                we will try to provide at least 30 days notice prior to any new terms taking effect.
                            </p>
                            <p>
                                By continuing to access or use our service after those revisions become effective, you agree to be bound by the
                                revised terms.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="mb-8 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <CardContent className="p-8">
                        <div className="mb-4 flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600">
                                <Mail className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Information</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>If you have any questions about these Terms and Conditions, please contact us:</p>
                            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                                <p>
                                    <strong>DIU ACM</strong>
                                </p>
                                <p>Daffodil International University</p>
                                <p>
                                    Email:{' '}
                                    <a href="mailto:contact@diuacm.com" className="text-blue-600 hover:underline dark:text-blue-400">
                                        contact@diuacm.com
                                    </a>
                                </p>
                                <p>
                                    Website:{' '}
                                    <a href="/contact" className="text-blue-600 hover:underline dark:text-blue-400">
                                        Contact Form
                                    </a>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
