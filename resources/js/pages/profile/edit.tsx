import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropper } from '@/components/image-cropper';
import MainLayout from '@/layouts/main-layout';
import { Camera, Loader2, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@inertiajs/react';

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
    profile_picture_url?: string;
}

interface Props {
    user: User;
}

export default function EditProfile({ user }: Props) {
    const [showImageCropper, setShowImageCropper] = useState(false);
    const [profileImage, setProfileImage] = useState(user.profile_picture_url || '');

    const { data, setData, post, processing, errors } = useForm({
        name: user.name || '',
        username: user.username || '',
        gender: user.gender || '',
        phone: user.phone || '',
        codeforces_handle: user.codeforces_handle || '',
        atcoder_handle: user.atcoder_handle || '',
        vjudge_handle: user.vjudge_handle || '',
        department: user.department || '',
        student_id: user.student_id || '',
        profile_picture: null as File | null,
    });

    const handleImageComplete = async (croppedImage: string) => {
        try {
            // Convert base64 to blob
            const response = await fetch(croppedImage);
            const blob = await response.blob();
            
            // Create file from blob
            const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });
            
            // Update form data
            setData('profile_picture', file);
            setProfileImage(croppedImage);
            setShowImageCropper(false);
            
            toast.success('Profile picture updated successfully');
        } catch (error) {
            console.error('Error processing image:', error);
            toast.error('Failed to process image');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/profile', {
            onSuccess: () => {
                toast.success('Profile updated successfully');
            },
            onError: () => {
                toast.error('Failed to update profile');
            },
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="flex items-center gap-3 text-xl text-slate-900 dark:text-white">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-white" />
                                </div>
                                Edit Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Profile Picture Section */}
                                <div className="flex flex-col items-center space-y-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                                    <div className="relative">
                                        <Avatar className="h-32 w-32 ring-4 ring-slate-100 dark:ring-slate-800">
                                            <AvatarImage
                                                src={profileImage || undefined}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="text-2xl font-semibold">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="absolute -bottom-2 -right-2 rounded-full p-3 shadow-lg"
                                            onClick={() => setShowImageCropper(true)}
                                            disabled={processing}
                                        >
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Click the camera icon to update your profile picture
                                        </p>
                                    </div>
                                </div>

                                {/* Basic Information Section */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            Basic Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name *</Label>
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.name ? 'border-red-500' : ''}
                                                />
                                                {errors.name && (
                                                    <p className="text-sm text-red-500">{errors.name}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="username">Username *</Label>
                                                <Input
                                                    id="username"
                                                    value={data.username}
                                                    onChange={(e) => setData('username', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.username ? 'border-red-500' : ''}
                                                />
                                                {errors.username && (
                                                    <p className="text-sm text-red-500">{errors.username}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    value={user.email}
                                                    disabled
                                                    className="bg-muted"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    Email cannot be changed
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Gender</Label>
                                                <Select
                                                    value={data.gender}
                                                    onValueChange={(value) => setData('gender', value)}
                                                    disabled={processing}
                                                >
                                                    <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.gender && (
                                                    <p className="text-sm text-red-500">{errors.gender}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.phone ? 'border-red-500' : ''}
                                                />
                                                {errors.phone && (
                                                    <p className="text-sm text-red-500">{errors.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Information Section */}
                                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            Academic Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="student_id">Student ID</Label>
                                                <Input
                                                    id="student_id"
                                                    value={data.student_id}
                                                    onChange={(e) => setData('student_id', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.student_id ? 'border-red-500' : ''}
                                                />
                                                {errors.student_id && (
                                                    <p className="text-sm text-red-500">{errors.student_id}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="department">Department</Label>
                                                <Input
                                                    id="department"
                                                    value={data.department}
                                                    onChange={(e) => setData('department', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.department ? 'border-red-500' : ''}
                                                />
                                                {errors.department && (
                                                    <p className="text-sm text-red-500">{errors.department}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Competitive Programming Profiles Section */}
                                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            Competitive Programming Profiles
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="codeforces_handle">Codeforces Handle</Label>
                                                <Input
                                                    id="codeforces_handle"
                                                    value={data.codeforces_handle}
                                                    onChange={(e) => setData('codeforces_handle', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.codeforces_handle ? 'border-red-500' : ''}
                                                />
                                                {errors.codeforces_handle && (
                                                    <p className="text-sm text-red-500">{errors.codeforces_handle}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="atcoder_handle">AtCoder Handle</Label>
                                                <Input
                                                    id="atcoder_handle"
                                                    value={data.atcoder_handle}
                                                    onChange={(e) => setData('atcoder_handle', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.atcoder_handle ? 'border-red-500' : ''}
                                                />
                                                {errors.atcoder_handle && (
                                                    <p className="text-sm text-red-500">{errors.atcoder_handle}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="vjudge_handle">VJudge Handle</Label>
                                                <Input
                                                    id="vjudge_handle"
                                                    value={data.vjudge_handle}
                                                    onChange={(e) => setData('vjudge_handle', e.target.value)}
                                                    disabled={processing}
                                                    className={errors.vjudge_handle ? 'border-red-500' : ''}
                                                />
                                                {errors.vjudge_handle && (
                                                    <p className="text-sm text-red-500">{errors.vjudge_handle}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex flex-col sm:flex-row gap-4 order-2 sm:order-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            asChild
                                            disabled={processing || !user.username}
                                        >
                                            <Link href={`/programmers/${user.username || ''}`}>
                                                View Profile
                                            </Link>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            asChild
                                            disabled={processing}
                                        >
                                            <Link href="/profile/change-password">Change Password</Link>
                                        </Button>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        size="lg"
                                        className="min-w-[140px] order-1 sm:order-2 rounded-full px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 font-medium"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {showImageCropper && (
                        <ImageCropper
                            onComplete={handleImageComplete}
                            onCancel={() => setShowImageCropper(false)}
                        />
                    )}
                </div>
            </div>
        </MainLayout>
    );
}