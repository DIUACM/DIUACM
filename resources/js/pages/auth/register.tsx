import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, UserPlus } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import MainLayout from '@/layouts/main-layout';

export default function Register() {
    return (
        <MainLayout title="Register">
            <Head title="Register" />
            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="mx-auto flex max-w-md flex-col gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white py-6 text-card-foreground shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="p-4 md:p-6">
                        <h1 className="mb-3 flex items-center text-lg font-bold text-slate-900 md:mb-4 md:text-xl dark:text-white">
                            <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 md:h-8 md:w-8 dark:from-blue-400 dark:to-blue-600">
                                <UserPlus className="h-3 w-3 text-white md:h-4 md:w-4" />
                            </span>
                            Create an account
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 md:text-base dark:text-slate-300">
                            Enter your details below to create your account
                        </p>
                    </div>

                    <div className="px-4 pb-4 md:px-6 md:pb-6">
                        <Form
                            {...RegisteredUserController.store.form()}
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            className="flex flex-col gap-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="text-slate-900 dark:text-slate-200">
                                                Name
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="name"
                                                name="name"
                                                placeholder="Full name"
                                                className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="username" className="text-slate-900 dark:text-slate-200">
                                                Username
                                            </Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                required
                                                tabIndex={2}
                                                autoComplete="username"
                                                name="username"
                                                placeholder="your_username"
                                                className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.username} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-slate-900 dark:text-slate-200">
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={3}
                                                autoComplete="email"
                                                name="email"
                                                placeholder="email@example.com"
                                                className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password" className="text-slate-900 dark:text-slate-200">
                                                Password
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                name="password"
                                                placeholder="Password"
                                                className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation" className="text-slate-900 dark:text-slate-200">
                                                Confirm password
                                            </Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                required
                                                tabIndex={5}
                                                autoComplete="new-password"
                                                name="password_confirmation"
                                                placeholder="Confirm password"
                                                className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-2 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                            tabIndex={6}
                                        >
                                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                            Create account
                                        </Button>
                                    </div>

                                    <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                                        Already have an account?{' '}
                                        <TextLink
                                            href={login()}
                                            tabIndex={7}
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Log in
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
