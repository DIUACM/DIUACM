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
        // @ts-ignore
        post(storeRegistrationRoute.url(contest.slug));
    };

    // Helper to safely get name from repeater items
    const getItemName = (item: any) => {
        if (typeof item === 'string') return item;
        return item.name || item.full_name || '';
    };

    // Helper to safely get value from repeater items
    const getItemValue = (item: any) => {
        if (typeof item === 'string') return item;
        return item.name || item.full_name || ''; // Use name/full_name as value if no specific code/id
    };

    return (
        <MainLayout>
            <Head title={`Register - ${contest.title}`} />

            <section className="container mx-auto max-w-3xl px-4 py-16">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contest Registration</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">{contest.title}</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8 flex items-center justify-center gap-4">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                            step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-500'
                        }`}
                    >
                        1
                    </div>
                    <div className={`h-1 w-16 transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                            step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-500'
                        }`}
                    >
                        2
                    </div>
                </div>

                <Card className="border-slate-200 shadow-lg dark:border-slate-800">
                    <form onSubmit={submit}>
                        <CardHeader>
                            <CardTitle>{step === 1 ? 'Student Information' : 'Additional Details'}</CardTitle>
                            <CardDescription>
                                {step === 1
                                    ? 'Please enter your student ID to proceed.'
                                    : 'Please fill in the remaining details to complete registration.'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="student_id">Student ID</Label>
                                        <div className="relative">
                                            <Input
                                                id="student_id"
                                                value={data.student_id}
                                                onChange={(e) => {
                                                    setData('student_id', e.target.value);
                                                    setIdValidationResult(null);
                                                    clearErrors('student_id');
                                                }}
                                                placeholder="Enter your Student ID"
                                                className={
                                                    idValidationResult?.valid === false
                                                        ? 'border-red-500 focus-visible:ring-red-500'
                                                        : idValidationResult?.valid === true
                                                          ? 'border-green-500 focus-visible:ring-green-500'
                                                          : ''
                                                }
                                                required
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {isValidatingId && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                                                {!isValidatingId && idValidationResult?.valid === true && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                )}
                                                {!isValidatingId && idValidationResult?.valid === false && (
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                        {errors.student_id && <p className="text-sm text-red-500">{errors.student_id}</p>}
                                        {idValidationResult?.valid && <p className="text-sm text-green-600">{idValidationResult.message}</p>}
                                        {contest.form_settings.student_id_rules_guide && (
                                            <p className="text-sm text-slate-500">{contest.form_settings.student_id_rules_guide}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} required />
                                        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select value={data.gender} onValueChange={(val) => setData('gender', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                                    </div>

                                    {contest.form_settings.departments && contest.form_settings.departments.length > 0 ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                            <Select value={data.department} onValueChange={(val) => setData('department', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {contest.form_settings.departments.map((dept: any, index: number) => {
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
                                            <Label htmlFor="department">Department</Label>
                                            <Alert variant="destructive" className="mb-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Warning</AlertTitle>
                                                <AlertDescription>
                                                    Department options are not configured for this contest. Please type your department manually.
                                                </AlertDescription>
                                            </Alert>
                                            <Input
                                                id="department"
                                                value={data.department}
                                                onChange={(e) => setData('department', e.target.value)}
                                                required
                                            />
                                            {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                                        </div>
                                    )}

                                    {contest.form_settings.sections && contest.form_settings.sections.length > 0 ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="section">Section</Label>
                                            <Select value={data.section} onValueChange={(val) => setData('section', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Section" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {contest.form_settings.sections.map((sec: any, index: number) => {
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
                                            <Label htmlFor="section">Section</Label>
                                            <Alert variant="destructive" className="mb-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Warning</AlertTitle>
                                                <AlertDescription>
                                                    Section options are not configured for this contest. Please type your section manually.
                                                </AlertDescription>
                                            </Alert>
                                            <Input id="section" value={data.section} onChange={(e) => setData('section', e.target.value)} required />
                                            {errors.section && <p className="text-sm text-red-500">{errors.section}</p>}
                                        </div>
                                    )}

                                    {contest.form_settings.lab_teacher_names && contest.form_settings.lab_teacher_names.length > 0 ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="lab_teacher_name">Lab Teacher</Label>
                                            <Select value={data.lab_teacher_name} onValueChange={(val) => setData('lab_teacher_name', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Lab Teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {contest.form_settings.lab_teacher_names.map((teacher: any, index: number) => {
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
                                            <Label htmlFor="lab_teacher_name">Lab Teacher</Label>
                                            <Alert variant="destructive" className="mb-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Warning</AlertTitle>
                                                <AlertDescription>
                                                    Lab Teacher options are not configured for this contest. Please type the name manually.
                                                </AlertDescription>
                                            </Alert>
                                            <Input
                                                id="lab_teacher_name"
                                                value={data.lab_teacher_name}
                                                onChange={(e) => setData('lab_teacher_name', e.target.value)}
                                            />
                                            {errors.lab_teacher_name && <p className="text-sm text-red-500">{errors.lab_teacher_name}</p>}
                                        </div>
                                    )}

                                    {contest.form_settings.tshirt_sizes && contest.form_settings.tshirt_sizes.length > 0 ? (
                                        <div className="col-span-full space-y-4">
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="tshirt_size">T-Shirt Size</Label>
                                                    <Select value={data.tshirt_size} onValueChange={(val) => setData('tshirt_size', val)}>
                                                        <SelectTrigger>
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
                                        <div className="col-span-full space-y-4">
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Warning</AlertTitle>
                                                <AlertDescription>
                                                    T-Shirt size options are not configured for this contest. You cannot select a size.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}

                                    <div className="col-span-full space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="transport">Transport Service</Label>
                                                <p className="text-sm text-slate-500">Do you require transport service?</p>
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
                                                <div className="space-y-2 pt-2">
                                                    <Label htmlFor="pickup_point">Pickup Point</Label>
                                                    <Select value={data.pickup_point} onValueChange={(val) => setData('pickup_point', val)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Pickup Point" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {contest.form_settings.pickup_points.map((point: any, index: number) => {
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
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            {step > 1 ? (
                                <Button type="button" variant="outline" onClick={prevStep}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Previous
                                </Button>
                            ) : (
                                <div></div>
                            )}

                            {step < 2 ? (
                                <Button type="button" onClick={nextStep} disabled={isValidatingId}>
                                    {isValidatingId ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Registering...
                                        </>
                                    ) : (
                                        'Complete Registration'
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>
            </section>
        </MainLayout>
    );
}
