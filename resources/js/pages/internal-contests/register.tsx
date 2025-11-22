import {
    storeRegistration as storeRegistrationRoute,
    validateStudentId as validateStudentIdRoute,
} from '@/actions/App/Http/Controllers/InternalContestController';
import { ContestFormSelect } from '@/components/internal-contests/contest-form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import MainLayout from '@/layouts/main-layout';
import type { InternalContestRegistrationView, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Loader2, Users, XCircle } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useState } from 'react';

type Props = {
    contest: InternalContestRegistrationView;
};

type RegistrationFormData = {
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
};

type ValidationResult = {
    valid: boolean;
    message: string;
};

type ProgressStepsProps = {
    currentStep: number;
};

function ProgressSteps({ currentStep }: ProgressStepsProps) {
    const steps = [
        { number: 1, label: 'Student ID' },
        { number: 2, label: 'Complete Profile' },
    ];

    return (
        <div className="mb-8">
            <div className="flex items-center justify-center gap-3">
                {steps.map((step, index) => (
                    <>
                        <div key={step.number} className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                                    currentStep >= step.number
                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'border-slate-300 bg-white text-slate-500 dark:bg-slate-900'
                                }`}
                            >
                                {step.number}
                            </div>
                            <span
                                className={`hidden text-sm font-medium sm:inline ${
                                    currentStep >= step.number ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                key={`divider-${step.number}`}
                                className={`h-0.5 w-16 transition-colors sm:w-24 ${
                                    currentStep >= step.number + 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            />
                        )}
                    </>
                ))}
            </div>
        </div>
    );
}

type StudentIdStepProps = {
    data: RegistrationFormData;
    setData: <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => void;
    errors: Partial<Record<keyof RegistrationFormData, string>>;
    clearErrors: (...fields: (keyof RegistrationFormData)[]) => void;
    isValidating: boolean;
    validationResult: ValidationResult | null;
    setValidationResult: (result: ValidationResult | null) => void;
    studentIdGuide?: string;
};

function StudentIdStep({
    data,
    setData,
    errors,
    clearErrors,
    isValidating,
    validationResult,
    setValidationResult,
    studentIdGuide,
}: StudentIdStepProps) {
    return (
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
                            setValidationResult(null);
                            clearErrors('student_id');
                        }}
                        placeholder="e.g., 123-45-6789"
                        className={`h-12 text-base ${
                            validationResult?.valid === false
                                ? 'border-red-500 focus-visible:ring-red-500'
                                : validationResult?.valid === true
                                  ? 'border-green-500 focus-visible:ring-green-500'
                                  : ''
                        }`}
                        required
                    />
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                        {isValidating && <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
                        {!isValidating && validationResult?.valid === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {!isValidating && validationResult?.valid === false && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                </div>
                {errors.student_id && (
                    <p className="flex items-center gap-1.5 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {errors.student_id}
                    </p>
                )}
                {validationResult?.valid && (
                    <p className="flex items-center gap-1.5 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        {validationResult.message}
                    </p>
                )}
                {studentIdGuide && <p className="text-sm text-slate-500 dark:text-slate-400">{studentIdGuide}</p>}
            </div>
        </div>
    );
}

type PersonalInfoFieldsProps = {
    data: RegistrationFormData;
    setData: <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => void;
    errors: Partial<Record<keyof RegistrationFormData, string>>;
};

function PersonalInfoFields({ data, setData, errors }: PersonalInfoFieldsProps) {
    return (
        <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">Personal Information</h3>
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
                        className="h-11 bg-slate-100 dark:bg-slate-800"
                        required
                        readOnly
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
    );
}

type AcademicInfoFieldsProps = {
    data: RegistrationFormData;
    setData: <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => void;
    errors: Partial<Record<keyof RegistrationFormData, string>>;
    formSettings: InternalContestRegistrationView['form_settings'];
};

function AcademicInfoFields({ data, setData, errors, formSettings }: AcademicInfoFieldsProps) {
    return (
        <div className="pt-2">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">Academic Information</h3>
            <div className="grid gap-6 md:grid-cols-2">
                <ContestFormSelect
                    id="department"
                    label="Department"
                    value={data.department}
                    onChange={(val) => setData('department', val)}
                    placeholder="Select Department"
                    required
                    options={formSettings.departments}
                    error={errors.department}
                    missingTitle="Department Options Missing"
                    missingDescription="Department choices are not configured for this contest. Please contact the organizers."
                />

                <ContestFormSelect
                    id="section"
                    label="Section"
                    value={data.section}
                    onChange={(val) => setData('section', val)}
                    placeholder="Select Section"
                    required
                    options={formSettings.sections}
                    error={errors.section}
                    missingTitle="Section Options Missing"
                    missingDescription="Section choices are not configured for this contest. Please contact the organizers."
                />

                <ContestFormSelect
                    id="lab_teacher_name"
                    label="Lab Teacher"
                    value={data.lab_teacher_name}
                    onChange={(val) => setData('lab_teacher_name', val)}
                    placeholder="Select Lab Teacher"
                    required
                    options={formSettings.lab_teacher_names}
                    error={errors.lab_teacher_name}
                    missingTitle="Lab Teacher Options Missing"
                    missingDescription="Lab teacher choices are not configured for this contest. Please contact the organizers."
                />
            </div>
        </div>
    );
}

type AdditionalDetailsFieldsProps = {
    data: RegistrationFormData;
    setData: <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => void;
    errors: Partial<Record<keyof RegistrationFormData, string>>;
    formSettings: InternalContestRegistrationView['form_settings'];
    tshirtSizeGuidelineUrl?: string;
};

function AdditionalDetailsFields({ data, setData, errors, formSettings, tshirtSizeGuidelineUrl }: AdditionalDetailsFieldsProps) {
    const hasTshirtSizeOptions = Boolean(formSettings.tshirt_sizes?.length);

    return (
        <div className="pt-2">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">Additional Details</h3>
            <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
                    <div className="grid gap-6 md:grid-cols-2">
                        <ContestFormSelect
                            id="tshirt_size"
                            label="T-Shirt Size"
                            value={data.tshirt_size}
                            onChange={(val) => setData('tshirt_size', val)}
                            placeholder="Select Size"
                            required
                            options={formSettings.tshirt_sizes}
                            error={errors.tshirt_size}
                            missingTitle="Error"
                            missingDescription="T-Shirt size options are not configured for this contest. Please contact the organizers."
                        />
                        {tshirtSizeGuidelineUrl && hasTshirtSizeOptions && (
                            <div className="flex flex-col justify-center">
                                <Label className="mb-2">Size Guide</Label>
                                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                    <img src={tshirtSizeGuidelineUrl} alt="T-shirt Size Guide" className="h-auto w-full max-w-xs object-contain" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="transport" className="text-base font-medium">
                                Transport Service
                            </Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Do you require transport service?</p>
                        </div>
                        <Switch
                            id="transport"
                            checked={data.transport_service_required}
                            onCheckedChange={(checked) => setData('transport_service_required', checked)}
                        />
                    </div>

                    {data.transport_service_required && (
                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                            <ContestFormSelect
                                id="pickup_point"
                                label="Pickup Point"
                                value={data.pickup_point}
                                onChange={(val) => setData('pickup_point', val)}
                                placeholder="Select Pickup Point"
                                required
                                options={formSettings.pickup_points}
                                error={errors.pickup_point}
                                missingTitle="Pickup Points Missing"
                                missingDescription="Pickup point choices are not configured for this contest. Please contact the organizers."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InternalContestRegisterPage({ contest }: Props) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [step, setStep] = useState(1);
    const [isValidatingId, setIsValidatingId] = useState(false);
    const [idValidationResult, setIdValidationResult] = useState<ValidationResult | null>(null);

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm<RegistrationFormData>({
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

    const validateStudentId = async (): Promise<boolean> => {
        if (!data.student_id) {
            setError('student_id', 'Student ID is required');
            return false;
        }

        setIsValidatingId(true);
        setIdValidationResult(null);
        clearErrors('student_id');

        try {
            const response = await axios.post<ValidationResult>(validateStudentIdRoute.url(contest.slug), {
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

    const handleNextStep = async (): Promise<void> => {
        if (step === 1) {
            const isValid = await validateStudentId();
            if (isValid) {
                setStep(2);
            }
        }
    };

    const handlePrevStep = (): void => {
        setStep((prev) => prev - 1);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeRegistrationRoute.url(contest.slug));
    };

    return (
        <MainLayout>
            <Head title={`Register - ${contest.title}`} />

            <div className="flex min-h-screen items-center justify-center px-4 py-12">
                <div className="w-full max-w-4xl space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contest Registration</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{contest.title}</p>
                    </div>

                    {/* Progress Steps */}
                    <ProgressSteps currentStep={step} />

                    {/* Contest Info Banner */}
                    {contest.banner_image && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
                            <img src={contest.banner_image} alt={contest.title} className="h-48 w-full object-cover" />
                        </div>
                    )}

                    {/* Contest Details */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Deadline</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {contest.registration_deadline
                                            ? new Intl.DateTimeFormat('en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric',
                                              }).format(new Date(contest.registration_deadline))
                                            : 'TBA'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
                            <div className="flex items-center gap-3">
                                <span className="flex h-5 w-5 items-center justify-center text-lg font-bold text-blue-500">৳</span>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fee</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {contest.registration_fee > 0 ? `৳${contest.registration_fee}` : 'Free'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {contest.registration_limit && (
                            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Limit</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{contest.registration_limit} Participants</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Registration Form */}
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 && (
                                <StudentIdStep
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                    clearErrors={clearErrors}
                                    isValidating={isValidatingId}
                                    validationResult={idValidationResult}
                                    setValidationResult={setIdValidationResult}
                                    studentIdGuide={contest.form_settings.student_id_rules_guide}
                                />
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <PersonalInfoFields data={data} setData={setData} errors={errors} />
                                    <AcademicInfoFields data={data} setData={setData} errors={errors} formSettings={contest.form_settings} />
                                    <AdditionalDetailsFields
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        formSettings={contest.form_settings}
                                        tshirtSizeGuidelineUrl={contest.tshirt_size_guideline_url}
                                    />
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-700">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" onClick={handlePrevStep} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                ) : (
                                    <div />
                                )}

                                {step < 2 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={isValidatingId}
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
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
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
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
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
