import {
    storeRegistration as storeRegistrationRoute,
    validateStudentId as validateStudentIdRoute,
} from '@/actions/App/Http/Controllers/InternalContestController';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import MainLayout from '@/layouts/main-layout';
import type { InternalContestRegistrationView, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Props = {
    contest: InternalContestRegistrationView;
};

export default function InternalContestRegisterPage({ contest }: Props) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [step, setStep] = useState(1);
    const [isValidatingId, setIsValidatingId] = useState(false);
    const [idValidationResult, setIdValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm<{
        student_id: string;
        name: string;
        email: string;
        phone: string;
        department: string;
        section: string;
        lab_teacher_name: string;
        tshirt_size: string;
        gender: string;
        transport_service_required: boolean;
        pickup_point: string;
    }>({
        student_id: (user.student_id as string) || '',
        name: user.name || '',
        email: user.email || '',
        phone: (user.phone as string) || '',
        department: (user.department as string) || '',
        section: '',
        lab_teacher_name: '',
        tshirt_size: '',
        gender: '',
        transport_service_required: false,
        pickup_point: '',
    });

    const validateStudentId = async () => {
        if (!data.student_id) {
            setError('student_id', 'Student ID is required');
            return false;
        }

        setIsValidatingId(true);
        setIdValidationResult(null);
        clearErrors('student_id');

        try {
            const response = await axios.post(validateStudentIdRoute.url(contest.slug), {
                student_id: data.student_id,
            });

            const result = response.data;
            setIdValidationResult(result);

            if (!result.valid) {
                setError('student_id', result.message);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Validation error:', error);
            setError('student_id', 'Failed to validate Student ID. Please try again.');
            return false;
        } finally {
            setIsValidatingId(false);
        }
    };

    const nextStep = async () => {
        if (step === 1) {
            const isValid = await validateStudentId();
            if (isValid) {
                setStep(2);
            }
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeRegistrationRoute.url(contest.slug));
    };

    // Helper to safely get name from repeater items
    const getItemName = (item: string | { name?: string; full_name?: string }) => {
        if (typeof item === 'string') return item;
        return item.name || item.full_name || '';
    };

    // Helper to safely get value from repeater items
    const getItemValue = (item: string | { name?: string; full_name?: string }) => {
        if (typeof item === 'string') return item;
        return item.name || item.full_name || ''; // Use name/full_name as value if no specific code/id
    };

    return (
        <MainLayout>
            <Head title={`Register - ${contest.title}`} />

            <section className="container mx-auto max-w-4xl px-4 py-12">
                <div className="mb-8">
                    <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">Contest Registration</h1>
                    <p className="text-slate-600 dark:text-slate-400">{contest.title}</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                                    step >= 1
                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'border-slate-300 bg-white text-slate-500 dark:bg-slate-900'
                                }`}
                            >
                                1
                            </div>
                            <span
                                className={`hidden text-sm font-medium sm:inline ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                            >
                                Student ID
                            </span>
                        </div>
                        <div className={`h-0.5 w-16 transition-colors sm:w-24 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                                    step >= 2
                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'border-slate-300 bg-white text-slate-500 dark:bg-slate-900'
                                }`}
                            >
                                2
                            </div>
                            <span
                                className={`hidden text-sm font-medium sm:inline ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                            >
                                Complete Profile
                            </span>
                        </div>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-sm dark:border-slate-700">
                    <form onSubmit={submit}>
                        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="text-xl">{step === 1 ? 'Verify Student ID' : 'Complete Your Registration'}</CardTitle>
                            <CardDescription>
                                {step === 1
                                    ? 'Enter your student ID to verify your eligibility.'
                                    : 'Fill in all required fields to complete your registration.'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6 p-6">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="student_id" className="text-base font-medium">
                                            Student ID <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="student_id"
                                                value={data.student_id}
                                                onChange={(e) => {
                                                    setData('student_id', e.target.value);
                                                    setIdValidationResult(null);
                                                    clearErrors('student_id');
                                                }}
                                                placeholder="e.g., 123-45-6789"
                                                className={`h-12 text-base ${
                                                    idValidationResult?.valid === false
                                                        ? 'border-red-500 focus-visible:ring-red-500'
                                                        : idValidationResult?.valid === true
                                                          ? 'border-green-500 focus-visible:ring-green-500'
                                                          : ''
                                                }`}
                                                required
                                            />
                                            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                {isValidatingId && <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
                                                {!isValidatingId && idValidationResult?.valid === true && (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                )}
                                                {!isValidatingId && idValidationResult?.valid === false && (
                                                    <XCircle className="h-5 w-5 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                        {errors.student_id && (
                                            <p className="flex items-center gap-1.5 text-sm text-red-500">
                                                <AlertCircle className="h-4 w-4" />
                                                {errors.student_id}
                                            </p>
                                        )}
                                        {idValidationResult?.valid && (
                                            <p className="flex items-center gap-1.5 text-sm text-green-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {idValidationResult.message}
                                            </p>
                                        )}
                                        {contest.form_settings.student_id_rules_guide && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {contest.form_settings.student_id_rules_guide}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    {/* Personal Information Section */}
                                    <div>
                                        <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">
                                            Personal Information
                                        </h3>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">
                                                    Full Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Enter your full name"
                                                    className="h-11"
                                                    required
                                                />
                                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="gender">
                                                    Gender <span className="text-red-500">*</span>
                                                </Label>
                                                <Select value={data.gender} onValueChange={(val) => setData('gender', val)} required>
                                                    <SelectTrigger className={`h-11 ${errors.gender ? 'border-red-500' : ''}`}>
                                                        <SelectValue placeholder="Select Gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email Address <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder="your.email@example.com"
                                                    className="h-11"
                                                    required
                                                />
                                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone">
                                                    Phone Number <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    placeholder="01XXXXXXXXX"
                                                    className="h-11"
                                                    required
                                                />
                                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Information Section */}
                                    <div className="pt-2">
                                        <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">
                                            Academic Information
                                        </h3>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {contest.form_settings.departments && contest.form_settings.departments.length > 0 ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor="department">
                                                        Department <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select value={data.department} onValueChange={(val) => setData('department', val)} required>
                                                        <SelectTrigger className={`h-11 ${errors.department ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select Department" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {contest.form_settings.departments.map((dept, index: number) => {
                                                                const value = getItemValue(dept);
                                                                const label = getItemName(dept);
                                                                return (
                                                                    <SelectItem key={`${value}-${index}`} value={value}>
                                                                        {label}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Label htmlFor="department">
                                                        Department <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="department"
                                                        value={data.department}
                                                        onChange={(e) => setData('department', e.target.value)}
                                                        placeholder="Enter your department"
                                                        className={`h-11 ${errors.department ? 'border-red-500' : ''}`}
                                                        required
                                                    />
                                                    {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                                                </div>
                                            )}

                                            {contest.form_settings.sections && contest.form_settings.sections.length > 0 ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor="section">
                                                        Section <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select value={data.section} onValueChange={(val) => setData('section', val)} required>
                                                        <SelectTrigger className={`h-11 ${errors.section ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select Section" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {contest.form_settings.sections.map((sec, index: number) => {
                                                                const value = getItemValue(sec);
                                                                const label = getItemName(sec);
                                                                return (
                                                                    <SelectItem key={`${value}-${index}`} value={value}>
                                                                        {label}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.section && <p className="text-sm text-red-500">{errors.section}</p>}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Label htmlFor="section">
                                                        Section <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="section"
                                                        value={data.section}
                                                        onChange={(e) => setData('section', e.target.value)}
                                                        placeholder="Enter your section"
                                                        className={`h-11 ${errors.section ? 'border-red-500' : ''}`}
                                                        required
                                                    />
                                                    {errors.section && <p className="text-sm text-red-500">{errors.section}</p>}
                                                </div>
                                            )}

                                            {contest.form_settings.lab_teacher_names && contest.form_settings.lab_teacher_names.length > 0 ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor="lab_teacher_name">
                                                        Lab Teacher <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select
                                                        value={data.lab_teacher_name}
                                                        onValueChange={(val) => setData('lab_teacher_name', val)}
                                                        required
                                                    >
                                                        <SelectTrigger className={`h-11 ${errors.lab_teacher_name ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select Lab Teacher" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {contest.form_settings.lab_teacher_names.map((teacher, index: number) => {
                                                                const value = getItemValue(teacher);
                                                                const label = getItemName(teacher);
                                                                return (
                                                                    <SelectItem key={`${value}-${index}`} value={value}>
                                                                        {label}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.lab_teacher_name && <p className="text-sm text-red-500">{errors.lab_teacher_name}</p>}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Label htmlFor="lab_teacher_name">
                                                        Lab Teacher <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="lab_teacher_name"
                                                        value={data.lab_teacher_name}
                                                        onChange={(e) => setData('lab_teacher_name', e.target.value)}
                                                        placeholder="Enter lab teacher name"
                                                        className={`h-11 ${errors.lab_teacher_name ? 'border-red-500' : ''}`}
                                                        required
                                                    />
                                                    {errors.lab_teacher_name && <p className="text-sm text-red-500">{errors.lab_teacher_name}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* T-Shirt & Transport Section */}
                                    <div className="pt-2">
                                        <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">
                                            Additional Details
                                        </h3>
                                        <div className="space-y-6">
                                            {contest.form_settings.tshirt_sizes && contest.form_settings.tshirt_sizes.length > 0 ? (
                                                <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
                                                    <div className="grid gap-6 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="tshirt_size">
                                                                T-Shirt Size <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Select
                                                                value={data.tshirt_size}
                                                                onValueChange={(val) => setData('tshirt_size', val)}
                                                                required
                                                            >
                                                                <SelectTrigger className={`h-11 ${errors.tshirt_size ? 'border-red-500' : ''}`}>
                                                                    <SelectValue placeholder="Select Size" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {contest.form_settings.tshirt_sizes.map((size) => (
                                                                        <SelectItem key={size} value={size}>
                                                                            {size}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {errors.tshirt_size && <p className="text-sm text-red-500">{errors.tshirt_size}</p>}
                                                        </div>
                                                        {contest.tshirt_size_guideline_url && (
                                                            <div className="flex flex-col justify-center">
                                                                <Label className="mb-2">Size Guide</Label>
                                                                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                                                    <img
                                                                        src={contest.tshirt_size_guideline_url}
                                                                        alt="T-shirt Size Guide"
                                                                        className="h-auto w-full max-w-xs object-contain"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Error</AlertTitle>
                                                    <AlertDescription>
                                                        T-Shirt size options are not configured for this contest. Please contact the organizers.
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="transport" className="text-base font-medium">
                                                            Transport Service
                                                        </Label>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            Do you require transport service?
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        id="transport"
                                                        checked={data.transport_service_required}
                                                        onCheckedChange={(checked) => setData('transport_service_required', checked)}
                                                    />
                                                </div>

                                                {data.transport_service_required &&
                                                    contest.form_settings.pickup_points &&
                                                    contest.form_settings.pickup_points.length > 0 && (
                                                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                                                            <Label htmlFor="pickup_point">
                                                                Pickup Point <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Select value={data.pickup_point} onValueChange={(val) => setData('pickup_point', val)}>
                                                                <SelectTrigger className="h-11">
                                                                    <SelectValue placeholder="Select Pickup Point" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {contest.form_settings.pickup_points.map((point, index: number) => {
                                                                        const value = getItemValue(point);
                                                                        const label = getItemName(point);
                                                                        return (
                                                                            <SelectItem key={`${value}-${index}`} value={value}>
                                                                                {label}
                                                                            </SelectItem>
                                                                        );
                                                                    })}
                                                                </SelectContent>
                                                            </Select>
                                                            {errors.pickup_point && <p className="text-sm text-red-500">{errors.pickup_point}</p>}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="border-t border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30">
                            <div className="flex w-full items-center justify-between">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                ) : (
                                    <div></div>
                                )}

                                {step < 2 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={isValidatingId}
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                    >
                                        {isValidatingId ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            <>
                                                Next
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Complete Registration
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </section>
        </MainLayout>
    );
}
