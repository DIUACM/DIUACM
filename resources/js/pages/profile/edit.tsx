import { ImageCropper } from '@/components/image-cropper';
import PageHeader from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/layouts/main-layout';
import profile from '@/routes/profile';
import programmers from '@/routes/programmers';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Camera, Loader2, Save, UserIcon } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    gender?: 'male' | 'female' | 'other';
    phone?: string;
    codeforces_handle?: string;
    atcoder_handle?: string;
    vjudge_handle?: string;
    department?: string;
    student_id?: string;
    avatar?: string;
}

interface Props {
    user: User;
}

export default function EditProfile({ user }: Props) {
    const [showImageCropper, setShowImageCropper] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState<string>(user.avatar || '');
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
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

    const handleImageComplete = async (croppedImageFile: File) => {
        setShowImageCropper(false);
        setIsUploadingImage(true);

        // Create FormData to send the file
        const formData = new FormData();
        formData.append('avatar', croppedImageFile);

        router.post('/profile/avatar', formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: (page) => {
                // Update preview with the new avatar URL from the response
                const pageProps = page.props as { user?: User };
                const newAvatar = pageProps.user?.avatar;
                if (newAvatar) {
                    setPreviewAvatar(newAvatar);
                }
                setIsUploadingImage(false);
            },
            onError: (errors) => {
                setIsUploadingImage(false);
                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    errorMessages.forEach((error) => {
                        toast.error(error as string);
                    });
                } else {
                    toast.error('Failed to update profile picture');
                }
            },
            onFinish: () => {
                setIsUploadingImage(false);
            },
        });
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        put('/profile', {
            preserveScroll: true,
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat();
                errorMessages.forEach((error) => {
                    toast.error(error as string);
                });
            },
        });
    };

    const getInitials = (name?: string) => {
        return (
            name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'U'
        );
    };

    return (
        <MainLayout>
            <Head title="Edit Profile" />

            <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <PageHeader title="Edit" gradientText="Profile" description="Update your personal information and profile picture" />

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
                                        variant="default"
                                        disabled={processing}
                                        asChild
                                        className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500"
                                    >
                                        <Link href={profile.edit.url()}>Edit Profile</Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                        asChild
                                        className="w-full justify-start border-slate-200 dark:border-slate-700"
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
                                    {/* Profile Picture Section */}
                                    <div className="border-b border-slate-200 pb-8 dark:border-slate-700">
                                        <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Profile Picture</h3>
                                        <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6">
                                            <div className="relative">
                                                <Avatar className="h-32 w-32 border-4 border-slate-200 dark:border-slate-700">
                                                    <AvatarImage src={previewAvatar} alt={data.name} />
                                                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-cyan-500 text-3xl text-white">
                                                        {getInitials(data.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    className="absolute right-0 bottom-0 h-10 w-10 rounded-full p-0 shadow-lg"
                                                    onClick={() => setShowImageCropper(true)}
                                                    disabled={isUploadingImage}
                                                >
                                                    {isUploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                            <div className="flex-1 text-center sm:text-left">
                                                <p className="mb-2 font-medium text-slate-900 dark:text-white">Profile Photo</p>
                                                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                                    Click the camera icon to update your profile picture. Recommended size: 400x400px
                                                </p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setShowImageCropper(true)}
                                                    disabled={isUploadingImage}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {isUploadingImage ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="mr-2 h-4 w-4" />
                                                            Change Photo
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Basic Information Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h3>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Name Field */}
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-medium">
                                                    Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Enter your full name"
                                                    className={errors.name ? 'border-red-500' : ''}
                                                    required
                                                />
                                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                            </div>

                                            {/* Username Field */}
                                            <div className="space-y-2">
                                                <Label htmlFor="username" className="text-sm font-medium">
                                                    Username <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="username"
                                                    type="text"
                                                    value={data.username}
                                                    onChange={(e) => setData('username', e.target.value)}
                                                    placeholder="Enter your username"
                                                    className={errors.username ? 'border-red-500' : ''}
                                                    required
                                                />
                                                {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Only letters, numbers, dashes, and underscores
                                                </p>
                                            </div>

                                            {/* Email Field - Read Only */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-medium">
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={user.email}
                                                    readOnly
                                                    className="cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
                                                />
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Email cannot be changed</p>
                                            </div>

                                            {/* Gender Field */}
                                            <div className="space-y-2">
                                                <Label htmlFor="gender" className="text-sm font-medium">
                                                    Gender
                                                </Label>
                                                <Select value={data.gender} onValueChange={(value) => setData('gender', value)} disabled={processing}>
                                                    <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                                            </div>

                                            {/* Phone Field */}
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-sm font-medium">
                                                    Phone Number
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    type="text"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    placeholder="Enter your phone number"
                                                    className={errors.phone ? 'border-red-500' : ''}
                                                />
                                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Information Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Academic Information</h3>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Student ID Field */}
                                            <div className="space-y-2">
                                                <Label htmlFor="student_id" className="text-sm font-medium">
                                                    Student ID
                                                </Label>
                                                <Input
                                                    id="student_id"
                                                    type="text"
                                                    value={data.student_id}
                                                    onChange={(e) => setData('student_id', e.target.value)}
                                                    placeholder="e.g., DIU-12345678"
                                                    className={errors.student_id ? 'border-red-500' : ''}
                                                />
                                                {errors.student_id && <p className="text-sm text-red-500">{errors.student_id}</p>}
                                            </div>

                                            {/* Department Field */}
                                            <div className="space-y-2">
                                                <Label htmlFor="department" className="text-sm font-medium">
                                                    Department
                                                </Label>
                                                <Input
                                                    id="department"
                                                    type="text"
                                                    value={data.department}
                                                    onChange={(e) => setData('department', e.target.value)}
                                                    placeholder="e.g., CSE, SWE, EEE"
                                                    className={errors.department ? 'border-red-500' : ''}
                                                />
                                                {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Competitive Programming Handles Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Competitive Programming Handles</h3>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Codeforces Handle */}
                                            <div className="space-y-2">
                                                <Label htmlFor="codeforces_handle" className="text-sm font-medium">
                                                    Codeforces Handle
                                                </Label>
                                                <Input
                                                    id="codeforces_handle"
                                                    type="text"
                                                    value={data.codeforces_handle}
                                                    onChange={(e) => setData('codeforces_handle', e.target.value)}
                                                    placeholder="Your Codeforces username"
                                                    className={errors.codeforces_handle ? 'border-red-500' : ''}
                                                />
                                                {errors.codeforces_handle && <p className="text-sm text-red-500">{errors.codeforces_handle}</p>}
                                            </div>

                                            {/* AtCoder Handle */}
                                            <div className="space-y-2">
                                                <Label htmlFor="atcoder_handle" className="text-sm font-medium">
                                                    AtCoder Handle
                                                </Label>
                                                <Input
                                                    id="atcoder_handle"
                                                    type="text"
                                                    value={data.atcoder_handle}
                                                    onChange={(e) => setData('atcoder_handle', e.target.value)}
                                                    placeholder="Your AtCoder username"
                                                    className={errors.atcoder_handle ? 'border-red-500' : ''}
                                                />
                                                {errors.atcoder_handle && <p className="text-sm text-red-500">{errors.atcoder_handle}</p>}
                                            </div>

                                            {/* VJudge Handle */}
                                            <div className="space-y-2">
                                                <Label htmlFor="vjudge_handle" className="text-sm font-medium">
                                                    VJudge Handle
                                                </Label>
                                                <Input
                                                    id="vjudge_handle"
                                                    type="text"
                                                    value={data.vjudge_handle}
                                                    onChange={(e) => setData('vjudge_handle', e.target.value)}
                                                    placeholder="Your VJudge username"
                                                    className={errors.vjudge_handle ? 'border-red-500' : ''}
                                                />
                                                {errors.vjudge_handle && <p className="text-sm text-red-500">{errors.vjudge_handle}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
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
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Changes
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

            {/* Image Cropper Modal */}
            {showImageCropper && <ImageCropper onComplete={handleImageComplete} onCancel={() => setShowImageCropper(false)} />}
        </MainLayout>
    );
}
