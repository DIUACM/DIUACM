import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import MainLayout from '@/layouts/main-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
    const { data, setData, patch, processing, errors, reset, isDirty } = useForm('change-password', {
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        patch('/profile/change-password', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Password changed successfully!');
                reset();
            },
            onError: () => {
                toast.error('Please check the form for errors.');
            },
        });
    };

    return (
        <MainLayout title="Change Password">
            <Head title="Change Password" />

            <div className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        Change{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                            Password
                        </span>
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                    <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">Update your password to keep your account secure.</p>
                </div>

                <div className="mx-auto max-w-md">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 p-2 dark:from-blue-400 dark:to-blue-600">
                                    <Lock className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password Security</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">Update your password</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password *</Label>
                                <PasswordInput
                                    id="current_password"
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                    placeholder="Enter your current password"
                                    required
                                />
                                <InputError message={errors.current_password} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password *</Label>
                                <PasswordInput
                                    id="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                    placeholder="Enter your new password"
                                    required
                                />
                                <InputError message={errors.password} />
                                <p className="text-xs text-slate-500 dark:text-slate-400">Password must be at least 8 characters long</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password *</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                    placeholder="Confirm your new password"
                                    required
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                                <Button
                                    type="submit"
                                    disabled={processing || !isDirty}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl disabled:opacity-50"
                                >
                                    {processing ? 'Changing Password...' : 'Change Password'}
                                </Button>
                            </div>

                            <div className="text-center">
                                <Link
                                    href="/profile/edit"
                                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                    prefetch="hover"
                                >
                                    ← Back to Edit Profile
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
