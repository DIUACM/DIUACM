import NewPasswordController from '@/actions/App/Http/Controllers/Auth/NewPasswordController';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import MainLayout from '@/layouts/main-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <MainLayout title="Reset password">
            <Head title="Reset password" />

            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-input bg-card p-6 shadow-md">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-card-foreground">Reset password</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Please enter your new password below</p>
                    </div>

                    <Form
                        {...NewPasswordController.store.form()}
                        transform={(data) => ({ ...data, token, email })}
                        resetOnSuccess={['password', 'password_confirmation']}
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" name="email" autoComplete="email" value={email} className="mt-1 block w-full" readOnly />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        className="mt-1 block w-full"
                                        autoFocus
                                        placeholder="Password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirm password</Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        className="mt-1 block w-full"
                                        placeholder="Confirm password"
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>

                                <Button type="submit" className="mt-4 w-full bg-primary" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Reset password
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </MainLayout>
    );
}
