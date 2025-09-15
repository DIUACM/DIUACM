import NewPasswordController from '@/actions/App/Http/Controllers/Auth/NewPasswordController';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Lock } from 'lucide-react';

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

            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="mx-auto flex max-w-md flex-col gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white py-6 text-card-foreground shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="p-4 md:p-6">
                        <h1 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                            <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                <Lock className="h-3 w-3 text-white md:h-4 md:w-4" />
                            </span>
                            Reset password
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 md:text-base dark:text-slate-300">Please enter your new password below</p>
                    </div>

                    <div className="px-4 pb-4 md:px-6 md:pb-6">
                        <Form
                            {...NewPasswordController.store.form()}
                            transform={(data) => ({ ...data, token, email })}
                            resetOnSuccess={['password', 'password_confirmation']}
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-slate-900 dark:text-slate-200">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={email}
                                            className="mt-1 block w-full border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/40"
                                            readOnly
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-slate-900 dark:text-slate-200">
                                            Password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            className="mt-1 block w-full border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            autoFocus
                                            placeholder="Password"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation" className="text-slate-900 dark:text-slate-200">
                                            Confirm password
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            className="mt-1 block w-full border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            placeholder="Confirm password"
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-4 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                        disabled={processing}
                                    >
                                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                        Reset password
                                    </Button>
                                </div>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
