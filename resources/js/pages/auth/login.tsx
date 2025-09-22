import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/layouts/main-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false as boolean,
    });

    // Capture errors provided via Inertia page props (e.g., after OAuth redirect)
    const page = usePage<{ errors?: Record<string, string> }>();
    const pageErrors = (page.props?.errors as Record<string, string>) ?? {};
    const allErrors = { ...pageErrors, ...errors };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <MainLayout>
            <Head title="Login" />

            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Sign in to your DIU ACM account</p>
                    </div>

                    {/* Login Form */}
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
                        {/* Google OAuth Button */}
                        <div className="mb-6">
                            <a
                                href="/auth/google"
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-4 text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span className="text-base font-medium">Continue with Google</span>
                            </a>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Or continue with</span>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <Label htmlFor="login" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Username or Email
                                </Label>
                                <div className="mt-1">
                                    <Input
                                        id="login"
                                        name="login"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        value={data.login}
                                        onChange={(e) => setData('login', e.target.value)}
                                        placeholder="Enter your username or email"
                                        className={allErrors.login ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                    />
                                    {allErrors.login && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{allErrors.login}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Password
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        className={`pr-10 ${allErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
                                        )}
                                    </button>
                                </div>
                                {allErrors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{allErrors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        name="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                                    />
                                    <Label htmlFor="remember" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                                        Remember me
                                    </Label>
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 dark:focus:ring-offset-slate-800"
                                >
                                    {processing ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Sign in
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Don't have an account?{' '}
                                <Link
                                    href="/register"
                                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            By signing in, you agree to our{' '}
                            <Link href="/terms-and-conditions" className="underline hover:text-slate-700 dark:hover:text-slate-300">
                                Terms and Conditions
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy-policy" className="underline hover:text-slate-700 dark:hover:text-slate-300">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
