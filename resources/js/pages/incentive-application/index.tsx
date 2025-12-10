import { store as storeRoute } from '@/actions/App/Http/Controllers/IncentiveApplicationController';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/layouts/main-layout';
import type { CourseInfo, IncentiveApplication, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, BookOpen, Check, Loader2, Plus, Save, Trash2, User } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { toast } from 'sonner';

interface Props {
    existingApplication: IncentiveApplication | null;
}

type FormData = {
    full_name: string;
    student_id: string;
    batch: string;
    current_semester: string;
    phone_number: string;
    courses: CourseInfo[];
};

export default function IncentiveApplicationIndex() {
    const { existingApplication } = usePage<SharedData & Props>().props;
    const { auth } = usePage<SharedData>().props;

    const { data, setData, post, processing, errors } = useForm<FormData>({
        full_name: existingApplication?.full_name || '',
        student_id: existingApplication?.student_id || '',
        batch: existingApplication?.batch || '',
        current_semester: existingApplication?.current_semester || '',
        phone_number: existingApplication?.phone_number || '',
        courses: existingApplication?.courses || [
            {
                teacher_name: '',
                teacher_initial: '',
                section: '',
                teacher_email: '',
                teacher_phone: '',
                course_name: '',
                course_code: '',
            },
        ],
    });

    const addCourse = () => {
        setData('courses', [
            ...data.courses,
            {
                teacher_name: '',
                teacher_initial: '',
                section: '',
                teacher_email: '',
                teacher_phone: '',
                course_name: '',
                course_code: '',
            },
        ]);
    };

    const removeCourse = (index: number) => {
        if (data.courses.length > 1) {
            setData(
                'courses',
                data.courses.filter((_, i) => i !== index)
            );
        }
    };

    const updateCourse = (index: number, field: keyof CourseInfo, value: string) => {
        const updatedCourses = [...data.courses];
        updatedCourses[index] = { ...updatedCourses[index], [field]: value };
        setData('courses', updatedCourses);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeRoute.url(), {
            preserveScroll: true,
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat();
                errorMessages.forEach((error) => {
                    toast.error(error as string);
                });
            },
        });
    };

    // If viewing existing application
    if (existingApplication && !processing) {
        return (
            <MainLayout>
                <Head title="My Incentive Application" />
                <div className="container mx-auto max-w-7xl px-4 py-16">
                    <PageHeader
                        title="Application"
                        gradientText="Submitted"
                        description="Your incentive application has been submitted successfully"
                    />

                    {/* Success Banner */}
                    <Card className="mb-6 border-green-200 bg-green-50 shadow-md dark:border-green-900 dark:bg-green-950/30">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
                                <Check className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-900 dark:text-green-100">Successfully Submitted</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card className="mb-6 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <CardContent className="p-6 md:p-8">
                            <div className="mb-6 border-b border-slate-200 pb-6 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h3>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{existingApplication.full_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Student ID</p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{existingApplication.student_id}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Batch</p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{existingApplication.batch}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{existingApplication.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Semester</p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{existingApplication.current_semester}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone Number</p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{existingApplication.phone_number}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Courses */}
                    <Card className="mb-6 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <CardContent className="p-6 md:p-8">
                            <div className="mb-6 border-b border-slate-200 pb-6 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Courses ({existingApplication.courses.length})
                                </h3>
                            </div>
                            <div className="space-y-6">
                                {existingApplication.courses.map((course, index) => (
                                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
                                        <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Course {index + 1}</h4>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Course Name</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{course.course_name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Course Code</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{course.course_code}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Teacher Name</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{course.teacher_name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Teacher Initial</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{course.teacher_initial}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Section</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{course.section}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Teacher Email</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{course.teacher_email}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Teacher Phone</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{course.teacher_phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Head title="Incentive Application" />
            <div className="container mx-auto max-w-7xl px-4 py-16">
                <PageHeader
                    title="Incentive"
                    gradientText="Application"
                    description="Complete this form to submit your course incentive application"
                />

                {/* Important Information */}
                <Card className="mb-6 border-blue-200 bg-blue-50 shadow-md dark:border-blue-900 dark:bg-blue-950/30">
                    <CardContent className="p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500">
                                <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Important Information</h3>
                        </div>
                        <ul className="ml-10 list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                            <li>Make sure to provide accurate teacher information</li>
                            <li>All fields are required to process your application</li>
                            <li>Your performance and participation info will be collected from diuacm.com</li>
                        </ul>
                    </CardContent>
                </Card>

                <form onSubmit={submit}>
                    {/* Personal Information */}
                    <Card className="mb-6 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <CardContent className="p-6 md:p-8">
                            <div className="mb-6 border-b border-slate-200 pb-6 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name" className="text-sm font-medium">
                                        Full Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="full_name"
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        placeholder="Enter your full name"
                                        className={errors.full_name ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.full_name && (
                                        <p className="text-sm text-red-500">{errors.full_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="student_id" className="text-sm font-medium">
                                        Student ID <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="student_id"
                                        value={data.student_id}
                                        onChange={(e) => setData('student_id', e.target.value)}
                                        placeholder="Enter your student ID"
                                        className={errors.student_id ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.student_id && (
                                        <p className="text-sm text-red-500">{errors.student_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="batch" className="text-sm font-medium">
                                        Batch <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="batch"
                                        value={data.batch}
                                        onChange={(e) => setData('batch', e.target.value)}
                                        placeholder="CSE 65"
                                        className={errors.batch ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.batch && (
                                        <p className="text-sm text-red-500">{errors.batch}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={auth.user.email}
                                        readOnly
                                        className="cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Email cannot be changed</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="current_semester" className="text-sm font-medium">
                                        Current Semester <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="current_semester"
                                        value={data.current_semester}
                                        onChange={(e) => setData('current_semester', e.target.value)}
                                        placeholder="e.g. Fall 2025"
                                        className={errors.current_semester ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.current_semester && (
                                        <p className="text-sm text-red-500">{errors.current_semester}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_number" className="text-sm font-medium">
                                        Phone Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="phone_number"
                                        type="tel"
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                        placeholder="Enter your contact number"
                                        className={errors.phone_number ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.phone_number && (
                                        <p className="text-sm text-red-500">{errors.phone_number}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Course Information */}
                    <Card className="mb-6 overflow-hidden border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <CardContent className="p-6 md:p-8">
                            <div className="mb-6 space-y-1 border-b border-slate-200 pb-6 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Course Information</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Add the courses you want to apply for</p>
                            </div>
                            <div className="space-y-6">
                                {data.courses.map((course, index) => (
                                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">Course {index + 1}</h4>
                                            {data.courses.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeCourse(index)}
                                                    className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor={`teacher_name_${index}`} className="text-sm font-medium">
                                                    Teacher Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`teacher_name_${index}`}
                                                    value={course.teacher_name}
                                                    onChange={(e) => updateCourse(index, 'teacher_name', e.target.value)}
                                                    placeholder="Full name of the teacher"
                                                    className={errors[`courses.${index}.teacher_name` as keyof typeof errors] ? 'border-red-500' : ''}
                                                />
                                                {errors[`courses.${index}.teacher_name` as keyof typeof errors] && (
                                                    <p className="text-sm text-red-500">{errors[`courses.${index}.teacher_name` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`teacher_initial_${index}`} className="text-sm font-medium">
                                                    Teacher Initial <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`teacher_initial_${index}`}
                                                    value={course.teacher_initial}
                                                    onChange={(e) => updateCourse(index, 'teacher_initial', e.target.value)}
                                                    placeholder="e.g. ABC"
                                                    className={errors[`courses.${index}.teacher_initial` as keyof typeof errors] ? 'border-red-500' : ''}
                                                />
                                                {errors[`courses.${index}.teacher_initial` as keyof typeof errors] && (
                                                    <p className="text-sm text-red-500">{errors[`courses.${index}.teacher_initial` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`section_${index}`} className="text-sm font-medium">
                                                    Section <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`section_${index}`}
                                                    value={course.section}
                                                    onChange={(e) => updateCourse(index, 'section', e.target.value)}
                                                    placeholder="e.g. A"
                                                    className={errors[`courses.${index}.section` as keyof typeof errors] ? 'border-red-500' : ''}
                                                />
                                                {errors[`courses.${index}.section` as keyof typeof errors] && (
                                                    <p className="text-sm text-red-500">{errors[`courses.${index}.section` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`teacher_email_${index}`} className="text-sm font-medium">
                                                    Teacher Email <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`teacher_email_${index}`}
                                                    type="email"
                                                    value={course.teacher_email}
                                                    onChange={(e) => updateCourse(index, 'teacher_email', e.target.value)}
                                                    placeholder="e.g. abc@diu.edu.bd"
                                                    className={errors[`courses.${index}.teacher_email` as keyof typeof errors] ? 'border-red-500' : ''}
                                                />
                                                {errors[`courses.${index}.teacher_email` as keyof typeof errors] && (
                                                    <p className="text-sm text-red-500">{errors[`courses.${index}.teacher_email` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`teacher_phone_${index}`} className="text-sm font-medium">
                                                    Teacher Phone <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`teacher_phone_${index}`}
                                                    type="tel"
                                                    value={course.teacher_phone}
                                                    onChange={(e) => updateCourse(index, 'teacher_phone', e.target.value)}
                                                    placeholder="e.g. 017XXXXXXXX"
                                                    className={errors[`courses.${index}.teacher_phone` as keyof typeof errors] ? 'border-red-500' : ''}
                                                />
                                                {errors[`courses.${index}.teacher_phone` as keyof typeof errors] && (
                                                    <p className="text-sm text-red-500">{errors[`courses.${index}.teacher_phone` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`course_name_${index}`} className="text-sm font-medium">
                                                    Course Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`course_name_${index}`}
                                                    value={course.course_name}
                                                    onChange={(e) => updateCourse(index, 'course_name', e.target.value)}
                                                    placeholder="Full name of the course"
                                                    className={errors[`courses.${index}.course_name` as keyof typeof errors] ? 'border-red-500' : ''}
                                                />
                                                {errors[`courses.${index}.course_name` as keyof typeof errors] && (
                                                    <p className="text-sm text-red-500">{errors[`courses.${index}.course_name` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`course_code_${index}`} className="text-sm font-medium">
                                                    Course Code <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`course_code_${index}`}
                                                    value={course.course_code}
                                                    onChange={(e) => updateCourse(index, 'course_code', e.target.value)}
                                                    placeholder="e.g. CSE101"
                                                    className={errors[`courses.${index}.course_code` as keyof typeof errors] ? 'border-red-500' : ''}
                                                />
                                                {errors[`courses.${index}.course_code` as keyof typeof errors] && (
                                                    <p className="text-sm text-red-500">{errors[`courses.${index}.course_code` as keyof typeof errors]}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addCourse}
                                    className="w-full"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Another Course
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="min-w-[200px] bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
