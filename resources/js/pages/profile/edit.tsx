import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/layouts/main-layout';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, useForm, usePage } from '@inertiajs/react';
import { User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
    name: string;
    username: string;
    email: string;
    gender?: 'male' | 'female' | 'other' | null;
    phone?: string;
    codeforces_handle?: string;
    atcoder_handle?: string;
    vjudge_handle?: string;
    department?: string;
    student_id?: string;
}

interface PageProps extends InertiaPageProps {
    user: ProfileData;
}

export default function EditProfile() {
    const { user } = usePage<PageProps>().props;

    const { data, setData, patch, processing, errors, isDirty } = useForm('profile-edit', {
        name: user.name || '',
        username: user.username || '',
        gender: user.gender || '',
        phone: user.phone || '',
        codeforces_handle: user.codeforces_handle || '',
        atcoder_handle: user.atcoder_handle || '',
        vjudge_handle: user.vjudge_handle || '',
        department: user.department || '',
        student_id: user.student_id || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        patch('/profile', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile updated successfully!');
            },
            onError: () => {
                toast.error('Please check the form for errors.');
            },
        });
    };

    return (
        <MainLayout title="Edit Profile">
            <Head title="Edit Profile" />

            <div className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        Edit{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                            Profile
                        </span>
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                    <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                        Update your profile information and competitive programming details.
                    </p>
                </div>

                <div className="mx-auto max-w-4xl">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 p-2 dark:from-blue-400 dark:to-blue-600">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Information</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">Manage your account details</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 p-6 md:space-y-8">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    Basic Information
                                </h2>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username *</Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            required
                                        />
                                        <InputError message={errors.username} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Email cannot be changed from this form</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                            <SelectTrigger className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.gender} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                        />
                                        <InputError message={errors.phone} />
                                    </div>
                                </div>
                            </div>

                            {/* Competitive Programming Profiles */}
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    Competitive Programming Profiles
                                </h2>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="codeforces_handle">Codeforces Handle</Label>
                                        <Input
                                            id="codeforces_handle"
                                            type="text"
                                            value={data.codeforces_handle}
                                            onChange={(e) => setData('codeforces_handle', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            placeholder="@handle"
                                        />
                                        <InputError message={errors.codeforces_handle} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="atcoder_handle">AtCoder Handle</Label>
                                        <Input
                                            id="atcoder_handle"
                                            type="text"
                                            value={data.atcoder_handle}
                                            onChange={(e) => setData('atcoder_handle', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            placeholder="@handle"
                                        />
                                        <InputError message={errors.atcoder_handle} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="vjudge_handle">VJudge Handle</Label>
                                        <Input
                                            id="vjudge_handle"
                                            type="text"
                                            value={data.vjudge_handle}
                                            onChange={(e) => setData('vjudge_handle', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                            placeholder="@handle"
                                        />
                                        <InputError message={errors.vjudge_handle} />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Information */}
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    Academic Information
                                </h2>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Input
                                            id="department"
                                            type="text"
                                            value={data.department}
                                            onChange={(e) => setData('department', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                        />
                                        <InputError message={errors.department} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="student_id">Student ID</Label>
                                        <Input
                                            id="student_id"
                                            type="text"
                                            value={data.student_id}
                                            onChange={(e) => setData('student_id', e.target.value)}
                                            className="border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700/40 dark:focus:border-blue-400"
                                        />
                                        <InputError message={errors.student_id} />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-4 sm:flex-row dark:border-slate-700">
                                <a
                                    href="/profile/change-password"
                                    className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                                >
                                    Change Password
                                </a>
                                <Button
                                    type="submit"
                                    disabled={processing || !isDirty}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Update Profile'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
