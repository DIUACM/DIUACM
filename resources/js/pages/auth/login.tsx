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
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <MainLayout title="Log in">
            <Head title="Log in" />
            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-input bg-card p-6 shadow-md">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-card-foreground">Log in to your account</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Use your email or username and password</p>
                    </div>

                    {status && <div className="mb-4 rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">{status}</div>}

                    <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="login">Email or username</Label>
                                        <Input
                                            id="login"
                                            type="text"
                                            name="login"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="username"
                                            placeholder="email@example.com or your_username"
                                        />
                                        <InputError message={errors.login} />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
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
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Checkbox id="remember" name="remember" tabIndex={3} />
                                        <Label htmlFor="remember">Remember me</Label>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="mt-2 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600" 
                                        tabIndex={4} 
                                        disabled={processing}
                                    >
                                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        Log in
                                    </Button>
                                </div>

                                <div className="text-center text-sm text-muted-foreground">
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
        </MainLayout>
    );
}
