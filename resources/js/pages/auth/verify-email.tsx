// Components
import EmailVerificationNotificationController from '@/actions/App/Http/Controllers/Auth/EmailVerificationNotificationController';
import { logout } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <MainLayout title="Email verification">
            <Head title="Email verification" />

            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-input bg-card p-6 shadow-md">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-card-foreground">Verify email</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Please verify your email address by clicking the link we sent you.</p>
                    </div>

                    {status === 'verification-link-sent' && (
                        <div className="mb-4 rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">
                            A new verification link has been sent to the email address you provided during registration.
                        </div>
                    )}

                    <Form {...EmailVerificationNotificationController.store.form()} className="space-y-6 text-center">
                        {({ processing }) => (
                            <>
                                <Button disabled={processing} variant="secondary">
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Resend verification email
                                </Button>

                                <TextLink href={logout()} className="mx-auto block text-sm text-primary hover:text-primary/80">
                                    Log out
                                </TextLink>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </MainLayout>
    );
}
