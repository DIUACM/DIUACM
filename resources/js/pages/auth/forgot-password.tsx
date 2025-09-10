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
                <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-input bg-card p-6 shadow-md">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-card-foreground">Forgot password</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Enter your email to receive a password reset link</p>
                    </div>

                    {status && <div className="mb-4 rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">{status}</div>}

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
                                        <Button className="w-full bg-primary" disabled={processing}>
                                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Email password reset link
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>

                        <div className="space-x-1 text-center text-sm text-muted-foreground">
                            <span>Or, return to</span>
                            <TextLink href={login()} className="text-primary hover:text-primary/80">log in</TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
