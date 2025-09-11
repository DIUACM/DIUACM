// Components
import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';

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

            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="mx-auto max-w-md text-card-foreground flex flex-col gap-6 rounded-xl py-6 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                    <div className="p-4 md:p-6">
                        <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4 flex items-center">
                            <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                                <Mail className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            </span>
                            Forgot password
                        </h1>
                        <p className="mt-1 text-sm md:text-base text-slate-600 dark:text-slate-300">Enter your email to receive a password reset link</p>
                    </div>

                    <div className="px-4 md:px-6 pb-4 md:pb-6">
                        {status && <div className="mb-4 rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">{status}</div>}

                        <div className="space-y-6">
                            <Form {...PasswordResetLinkController.store.form()}>
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-slate-900 dark:text-slate-200">Email address</Label>
                                            <Input 
                                                id="email" 
                                                type="email" 
                                                name="email" 
                                                autoComplete="off" 
                                                autoFocus 
                                                placeholder="email@example.com" 
                                                className="bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="my-6 flex items-center justify-start">
                                            <Button 
                                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600" 
                                                disabled={processing}
                                            >
                                                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                                Email password reset link
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>

                            <div className="space-x-1 text-center text-sm text-slate-600 dark:text-slate-300">
                                <span>Or, return to</span>
                                <TextLink href={login()} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">log in</TextLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
