import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import InputError from '@/components/input-error';

export default function ChangePassword() {
    const { data, setData, patch, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        patch('/profile/change-password', {
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
                    <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                        Change{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                            Password
                        </span>
                    </h1>
                    <div className="mx-auto w-20 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-6"></div>
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                        Update your password to keep your account secure.
                    </p>
                </div>

                <div className="max-w-md mx-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 rounded-lg">
                                    <Lock className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Password Security
                                    </h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Update your password
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password *</Label>
                                <PasswordInput
                                    id="current_password"
                                    value={data.current_password}
                                    onChange={e => setData('current_password', e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                                    onChange={e => setData('password', e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                    placeholder="Enter your new password"
                                    required
                                />
                                <InputError message={errors.password} />
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Password must be at least 8 characters long
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password *</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                    placeholder="Confirm your new password"
                                    required
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all"
                                >
                                    {processing ? 'Changing Password...' : 'Change Password'}
                                </Button>
                            </div>

                            <div className="text-center">
                                <a
                                    href="/profile/edit"
                                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    ← Back to Edit Profile
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}