import { initiateRegistrationPayment } from '@/actions/App/Http/Controllers/PaymentController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/main-layout';
import { InternalContestMyRegistration } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { 
    CheckCircle2, 
    Clock, 
    CreditCard, 
    MapPin, 
    Shirt, 
    User, 
    XCircle, 
    AlertCircle,
    Mail,
    Phone,
    GraduationCap,
    IdCard,
    Users,
    BookOpen,
    History,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    registration: InternalContestMyRegistration;
};

export default function MyRegistrationPage({ registration }: Props) {
    const hasFee = !registration.is_free;
    const payment = registration.payment;
    const registrationStatus = registration.status;

    // Status checks
    const isConfirmed = registration.is_confirmed;
    const isPending = registrationStatus === 'pending';
    const isCanceled = registrationStatus === 'canceled';
    const isUnderReview = registrationStatus === 'under_review';

    const paymentStatus = payment?.status;
    const isPaymentPending = paymentStatus === 'pending';
    const isPaymentPaid = paymentStatus === 'paid';
    const isPaymentFailed = paymentStatus === 'failed';
    const isPaymentCanceled = paymentStatus === 'canceled';
    const isPaymentUnderManualReview = paymentStatus === 'under_manual_review';

    // User can pay if: has fee, not confirmed, and (no payment OR payment failed/canceled)
    const canPayAgain = !isPaymentPaid && !isPaymentPending && !isPaymentUnderManualReview;
    const showPaymentButton = hasFee && !isConfirmed && canPayAgain;

    const form = useForm({
        gateway: 'sslcommerz',
    });

    const handlePayment = () => {
        form.post(initiateRegistrationPayment.url({ registration: registration.id }));
    };

    const handleRefresh = () => {
        router.reload({ only: ['registration'] });
    };

    return (
        <MainLayout>
            <Head title={`My Registration - ${registration.internal_contest.title}`} />

            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                                My Registration
                            </h1>
                            <p className="mt-1 text-base text-muted-foreground">
                                {registration.internal_contest.title}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>

                    {/* Status Banner */}
                    <StatusBanner
                        status={registrationStatus}
                        isConfirmed={isConfirmed}
                        payment={payment}
                        hasFee={hasFee}
                    />

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Registration Details Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Registration Details</CardTitle>
                                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                            #{registration.id}
                                        </span>
                                    </div>
                                    <CardDescription>
                                        Registered {formatDate(registration.registered_at)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Personal Information */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                            Personal Information
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <InfoItem icon={User} label="Name" value={registration.name} />
                                            <InfoItem icon={IdCard} label="Student ID" value={registration.student_id} />
                                            <InfoItem icon={Mail} label="Email" value={registration.email} />
                                            <InfoItem icon={Phone} label="Phone" value={registration.phone} />
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Academic Information */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                            Academic Information
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <InfoItem icon={GraduationCap} label="Department" value={registration.department} />
                                            <InfoItem icon={BookOpen} label="Section" value={registration.section} />
                                            <InfoItem 
                                                icon={Users} 
                                                label="Gender" 
                                                value={<span className="capitalize">{registration.gender}</span>}
                                            />
                                            {registration.lab_teacher_name && (
                                                <InfoItem 
                                                    icon={Users} 
                                                    label="Lab Teacher" 
                                                    value={registration.lab_teacher_name}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Event Logistics */}
                                    {(registration.tshirt_size || registration.pickup_point) && (
                                        <>
                                            <Separator />
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Event Logistics
                                                </h3>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {registration.tshirt_size && (
                                                        <InfoItem icon={Shirt} label="T-Shirt Size" value={registration.tshirt_size} />
                                                    )}
                                                    <InfoItem 
                                                        icon={MapPin} 
                                                        label="Transport" 
                                                        value={registration.transport_service_required ? 'Required' : 'Not Required'} 
                                                    />
                                                    {registration.pickup_point && (
                                                        <InfoItem 
                                                            icon={MapPin} 
                                                            label="Pickup Point" 
                                                            value={registration.pickup_point}
                                                            className="sm:col-span-2"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment History */}
                            {registration.payment_history.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <History className="h-5 w-5" />
                                            Payment History
                                        </CardTitle>
                                        <CardDescription>
                                            {registration.payment_history.length} payment {registration.payment_history.length === 1 ? 'attempt' : 'attempts'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {registration.payment_history.map((paymentItem, index) => (
                                                <PaymentHistoryItem 
                                                    key={paymentItem.id} 
                                                    payment={paymentItem}
                                                    isLatest={index === 0}
                                                />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Status Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <StatusBadge
                                        label="Registration"
                                        status={registrationStatus}
                                        type="registration"
                                    />
                                    {hasFee && payment && (
                                        <StatusBadge
                                            label="Payment"
                                            status={payment.status}
                                            type="payment"
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Card */}
                            {hasFee && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Payment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Registration Fee</p>
                                            <p className="text-2xl font-bold">
                                                ৳{registration.internal_contest.registration_fee}
                                            </p>
                                        </div>

                                        {payment && (
                                            <>
                                                <Separator />
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Gateway</span>
                                                        <span className="font-medium capitalize">{payment.gateway}</span>
                                                    </div>
                                                    {payment.paid_at && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Paid At</span>
                                                            <span className="font-medium">{formatDate(payment.paid_at)}</span>
                                                        </div>
                                                    )}
                                                    <div className="pt-1">
                                                        <p className="text-xs text-muted-foreground">Transaction ID</p>
                                                        <p className="font-mono text-xs break-all">{payment.transaction_id}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {showPaymentButton && (
                                            <>
                                                <Separator />
                                                <Button 
                                                    onClick={handlePayment} 
                                                    className="w-full"
                                                    disabled={form.processing}
                                                >
                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                    {form.processing ? 'Processing...' : isPaymentFailed || isPaymentCanceled ? 'Retry Payment' : 'Pay Now'}
                                                </Button>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Contest Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Contest Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Semester</p>
                                        <p className="font-medium">{registration.internal_contest.semester}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Registration Deadline</p>
                                        <p className="font-medium">{formatDate(registration.internal_contest.registration_deadline)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

// Status Banner Component
function StatusBanner({ 
    status, 
    isConfirmed, 
    payment, 
    hasFee 
}: { 
    status: string; 
    isConfirmed: boolean; 
    payment: InternalContestMyRegistration['payment']; 
    hasFee: boolean;
}) {
    if (isConfirmed) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                        🎉 Registration Confirmed!
                    </h3>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                        Your registration is confirmed and you're all set for the contest. Good luck!
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'under_review' || payment?.status === 'under_manual_review') {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-900/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                        Under Manual Review
                    </h3>
                    <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                        Your payment is being verified by our team. This may take 24-48 hours. You'll be notified via email once complete.
                    </p>
                    {payment?.transaction_id && (
                        <p className="mt-2 font-mono text-xs text-purple-600 dark:text-purple-400">
                            Reference: {payment.transaction_id}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (payment?.status === 'pending') {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <Clock className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Payment Processing
                    </h3>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        Your payment is being processed. This usually takes a few minutes. Please refresh to check the status.
                    </p>
                </div>
            </div>
        );
    }

    if (payment?.status === 'failed' || payment?.status === 'canceled') {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                <XCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-100">
                        Payment {payment.status === 'failed' ? 'Failed' : 'Canceled'}
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {payment.status === 'failed' 
                            ? 'Your payment could not be processed. Please try again or contact support.'
                            : 'Your payment was canceled. You can retry to complete your registration.'}
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'pending' && hasFee && !payment) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Payment Required
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                        Please complete your payment to confirm your registration and secure your spot.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

// Info Item Component
function InfoItem({ 
    icon: Icon, 
    label, 
    value, 
    className = '' 
}: { 
    icon: any; 
    label: string; 
    value: React.ReactNode; 
    className?: string;
}) {
    return (
        <div className={cn("space-y-1", className)}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ 
    label, 
    status, 
    type 
}: { 
    label: string; 
    status: string; 
    type: 'registration' | 'payment';
}) {
    const getStatusConfig = () => {
        if (type === 'registration') {
            switch (status) {
                case 'paid':
                    return { 
                        icon: CheckCircle2, 
                        color: 'text-green-600 dark:text-green-400',
                        bg: 'bg-green-100 dark:bg-green-900/30',
                        label: 'Confirmed'
                    };
                case 'under_review':
                    return { 
                        icon: AlertCircle, 
                        color: 'text-purple-600 dark:text-purple-400',
                        bg: 'bg-purple-100 dark:bg-purple-900/30',
                        label: 'Under Review'
                    };
                case 'canceled':
                    return { 
                        icon: XCircle, 
                        color: 'text-red-600 dark:text-red-400',
                        bg: 'bg-red-100 dark:bg-red-900/30',
                        label: 'Canceled'
                    };
                default:
                    return { 
                        icon: Clock, 
                        color: 'text-yellow-600 dark:text-yellow-400',
                        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                        label: 'Pending'
                    };
            }
        } else {
            switch (status) {
                case 'paid':
                    return { 
                        icon: CheckCircle2, 
                        color: 'text-green-600 dark:text-green-400',
                        bg: 'bg-green-100 dark:bg-green-900/30',
                        label: 'Paid'
                    };
                case 'under_manual_review':
                    return { 
                        icon: AlertCircle, 
                        color: 'text-purple-600 dark:text-purple-400',
                        bg: 'bg-purple-100 dark:bg-purple-900/30',
                        label: 'Under Review'
                    };
                case 'failed':
                    return { 
                        icon: XCircle, 
                        color: 'text-red-600 dark:text-red-400',
                        bg: 'bg-red-100 dark:bg-red-900/30',
                        label: 'Failed'
                    };
                case 'canceled':
                    return { 
                        icon: XCircle, 
                        color: 'text-red-600 dark:text-red-400',
                        bg: 'bg-red-100 dark:bg-red-900/30',
                        label: 'Canceled'
                    };
                default:
                    return { 
                        icon: Clock, 
                        color: 'text-blue-600 dark:text-blue-400',
                        bg: 'bg-blue-100 dark:bg-blue-900/30',
                        label: 'Pending'
                    };
            }
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.bg, config.color)}>
                <Icon className="h-3 w-3" />
                {config.label}
            </div>
        </div>
    );
}

// Payment History Item Component
function PaymentHistoryItem({ 
    payment, 
    isLatest 
}: { 
    payment: InternalContestMyRegistration['payment_history'][0]; 
    isLatest: boolean;
}) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'text-green-600 dark:text-green-400';
            case 'failed':
            case 'canceled':
                return 'text-red-600 dark:text-red-400';
            case 'pending':
                return 'text-blue-600 dark:text-blue-400';
            case 'under_manual_review':
                return 'text-purple-600 dark:text-purple-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return <CheckCircle2 className="h-4 w-4" />;
            case 'failed':
            case 'canceled':
                return <XCircle className="h-4 w-4" />;
            case 'pending':
                return <Clock className="h-4 w-4" />;
            case 'under_manual_review':
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className={cn(
            "flex items-start gap-3 rounded-lg border p-3",
            isLatest ? "border-primary/50 bg-primary/5" : "border-border"
        )}>
            <div className={cn("mt-0.5", getStatusColor(payment.status))}>
                {getStatusIcon(payment.status)}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm font-medium", getStatusColor(payment.status))}>
                        {formatStatus(payment.status)}
                    </span>
                    {isLatest && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                            Latest
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    ৳{payment.amount} · {payment.gateway}
                </p>
                {payment.paid_at && (
                    <p className="text-xs text-muted-foreground">
                        Paid {formatDate(payment.paid_at)}
                    </p>
                )}
                <p className="font-mono text-xs text-muted-foreground">
                    {payment.transaction_id}
                </p>
            </div>
        </div>
    );
}

// Helper function to format dates
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
