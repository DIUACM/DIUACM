import ConfirmablePasswordController from '@/actions/App/Http/Controllers/Auth/ConfirmablePasswordController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import MainLayout from '@/layouts/main-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Shield } from 'lucide-react';

export default function ConfirmPassword() {
    return (
        <MainLayout title="Confirm password">
            <Head title="Confirm password" />

            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="mx-auto flex max-w-md flex-col gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white py-6 text-card-foreground shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="p-4 md:p-6">
                        <h1 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                            <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                <Shield className="h-3 w-3 text-white md:h-4 md:w-4" />
                            </span>
                            Confirm your password
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 md:text-base dark:text-slate-300">
                            This is a secure area of the application. Please confirm your password before continuing.
                        </p>
                    </div>

                    <div className="px-4 pb-4 md:px-6 md:pb-6">
                        <Form {...ConfirmablePasswordController.store.form()} resetOnSuccess={['password']}>
                            {({ processing, errors }) => (
                                <div className="space-y-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-slate-900 dark:text-slate-200">
                                            Password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            placeholder="Password"
                                            autoComplete="current-password"
                                            autoFocus
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center">
                                        <Button
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                            disabled={processing}
                                        >
                                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm password
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
