import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/layouts/main-layout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, KeyIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/profile/change-password', {
            onSuccess: () => {
                toast.success('Password updated successfully');
                reset();
            },
            onError: () => {
                toast.error('Failed to update password');
            },
        });
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-2xl">
                    <Card className="overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="flex items-center gap-3 text-xl text-slate-900 dark:text-white">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 dark:from-red-400 dark:to-red-600">
                                    <KeyIcon className="h-5 w-5 text-white" />
                                </div>
                                Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="mb-6">
                                <Button variant="outline" asChild>
                                    <Link href="/profile">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Profile
                                    </Link>
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            disabled={processing}
                                            className={errors.password ? 'border-red-500' : ''}
                                            placeholder="Enter new password"
                                        />
                                        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                        <p className="text-sm text-muted-foreground">
                                            Password must be at least 8 characters long and contain uppercase letters, lowercase letters, numbers, and
                                            symbols.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            disabled={processing}
                                            className={errors.password_confirmation ? 'border-red-500' : ''}
                                            placeholder="Confirm new password"
                                        />
                                        {errors.password_confirmation && <p className="text-sm text-red-500">{errors.password_confirmation}</p>}
                                    </div>
                                </div>

                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                                            <span className="text-xs font-bold text-white">i</span>
                                        </div>
                                        <div className="text-sm text-blue-800 dark:text-blue-200">
                                            <p className="mb-1 font-medium">Security Note</p>
                                            <p>
                                                Your current password is not required to set a new password. Make sure to use a strong, unique
                                                password to keep your account secure.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row dark:border-slate-700">
                                    <Button type="button" variant="outline" asChild disabled={processing} className="sm:order-1">
                                        <Link href="/profile">Cancel</Link>
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={processing || !data.password || !data.password_confirmation}
                                        size="lg"
                                        className="min-w-[140px] rounded-full bg-gradient-to-r from-red-600 to-red-700 px-8 font-medium text-white shadow-md transition-all hover:from-red-700 hover:to-red-800 hover:shadow-xl sm:order-2 dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
