// Components
import EmailVerificationNotificationController from '@/actions/App/Http/Controllers/Auth/EmailVerificationNotificationController';
import { logout } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, MailCheck } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <MainLayout title="Email verification">
            <Head title="Email verification" />

            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="mx-auto flex max-w-md flex-col gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white py-6 text-card-foreground shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="p-4 md:p-6">
                        <h1 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                            <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                <MailCheck className="h-3 w-3 text-white md:h-4 md:w-4" />
                            </span>
                            Verify email
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 md:text-base dark:text-slate-300">
                            Please verify your email address by clicking the link we sent you.
                        </p>
                    </div>

                    <div className="px-4 pb-4 md:px-6 md:pb-6">
                        {status === 'verification-link-sent' && (
                            <div className="mb-4 rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">
                                A new verification link has been sent to the email address you provided during registration.
                            </div>
                        )}

                        <Form {...EmailVerificationNotificationController.store.form()} className="space-y-6 text-center">
                            {({ processing }) => (
                                <>
                                    <Button
                                        disabled={processing}
                                        variant="secondary"
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                    >
                                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                        Resend verification email
                                    </Button>

                                    <TextLink
                                        href={logout()}
                                        className="mx-auto block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Log out
                                    </TextLink>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
