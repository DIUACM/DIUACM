import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/layouts/main-layout';
import profile from '@/routes/profile';
import programmers from '@/routes/programmers';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Loader2, Save, UserIcon } from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    username?: string;
}

interface PageProps extends Record<string, unknown> {
    auth: {
        user: User;
    };
}

export default function ChangePassword() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/profile/change-password', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat();
                errorMessages.forEach((error) => {
                    toast.error(error as string);
                });
            },
        });
    };

    return (
        <MainLayout>
            <Head title="Change Password" />

            <div className="container mx-auto max-w-7xl px-4 py-16">
                <PageHeader title="Change" gradientText="Password" description="Update your password to keep your account secure" />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Navigation Sidebar */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card className="overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center">
                                    <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600">
                                        <UserIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Account Settings</h3>
                                </div>
                                <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                                    Manage your account settings and profile information. Keep your details up to date for the best experience.
                                </p>
                                <div className="space-y-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                        asChild
                                        className="w-full justify-start border-slate-200 dark:border-slate-700"
                                    >
                                        <Link href={profile.edit.url()}>Edit Profile</Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="default"
                                        disabled={processing}
                                        asChild
                                        className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500"
                                    >
                                        <Link href={profile.editPassword.url()}>Change Password</Link>
                                    </Button>
                                    {user.username && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={processing}
                                            asChild
                                            className="w-full justify-start border-slate-200 dark:border-slate-700"
                                        >
                                            <Link href={programmers.show.url(user.username)}>View Public Profile</Link>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 lg:col-span-3">
                        <Card className="overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <CardContent className="p-6 md:p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Password Change Section */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Change Password</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Choose a new secure password for your account
                                            </p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-sm font-medium">
                                                    New Password <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    placeholder="Enter your new password"
                                                    disabled={processing}
                                                    className={errors.password ? 'border-red-500' : ''}
                                                    autoComplete="new-password"
                                                    required
                                                />
                                                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Password must be at least 8 characters long
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation" className="text-sm font-medium">
                                                    Confirm New Password <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="password_confirmation"
                                                    type="password"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    placeholder="Confirm your new password"
                                                    disabled={processing}
                                                    className={errors.password_confirmation ? 'border-red-500' : ''}
                                                    autoComplete="new-password"
                                                    required
                                                />
                                                {errors.password_confirmation && (
                                                    <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end dark:border-slate-700">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            size="lg"
                                            className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Changing...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Change Password
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
