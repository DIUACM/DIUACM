// Components
import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/layouts/main-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <MainLayout title="Forgot password">
            <Head title="Forgot password" />

            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Forgot password</h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Enter your email to receive a password reset link</p>
                    </div>

                    {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

                    <div className="space-y-6">
                        <Form {...PasswordResetLinkController.store.form()}>
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input id="email" type="email" name="email" autoComplete="off" autoFocus placeholder="email@example.com" />

                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="my-6 flex items-center justify-start">
                                        <Button className="w-full" disabled={processing}>
                                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Email password reset link
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>

                        <div className="space-x-1 text-center text-sm text-slate-600 dark:text-slate-300">
                            <span>Or, return to</span>
                            <TextLink href={login()}>log in</TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
