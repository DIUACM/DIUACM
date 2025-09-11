import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import MainLayout from '@/layouts/main-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, LogIn } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <MainLayout title="Log in">
            <Head title="Log in" />
            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="mx-auto max-w-md text-card-foreground flex flex-col gap-6 rounded-xl py-6 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                    <div className="p-4 md:p-6">
                        <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4 flex items-center">
                            <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                                <LogIn className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            </span>
                            Log in to your account
                        </h1>
                        <p className="mt-1 text-sm md:text-base text-slate-600 dark:text-slate-300">Use your email or username and password</p>
                    </div>

                    <div className="px-4 md:px-6 pb-4 md:pb-6">
                        {status && <div className="mb-4 rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">{status}</div>}

                        <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="login" className="text-slate-900 dark:text-slate-200">Email or username</Label>
                                            <Input
                                                id="login"
                                                type="text"
                                                name="login"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="username"
                                                placeholder="email@example.com or your_username"
                                                className="bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.login} />
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="password" className="text-slate-900 dark:text-slate-200">Password</Label>
                                                {canResetPassword && (
                                                    <TextLink href={request()} className="ml-auto text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" tabIndex={5}>
                                                        Forgot password?
                                                    </TextLink>
                                                )}
                                            </div>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Password"
                                                className="bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox id="remember" name="remember" tabIndex={3} />
                                            <Label htmlFor="remember" className="text-slate-900 dark:text-slate-200">Remember me</Label>
                                        </div>

                                        <Button 
                                            type="submit" 
                                            className="mt-2 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600" 
                                            tabIndex={4} 
                                            disabled={processing}
                                        >
                                            {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                            Log in
                                        </Button>
                                    </div>

                                    <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                                        Don't have an account?{' '}
                                        <TextLink href={register()} tabIndex={5} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                            Sign up
                                        </TextLink>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
