import { initiateRegistrationPayment } from '@/actions/App/Http/Controllers/PaymentController';
import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import { cn } from '@/lib/utils';
import { InternalContestMyRegistration } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Shirt,
    User,
    XCircle,
} from 'lucide-react';

type Props = {
    registration: InternalContestMyRegistration;
};

export default function MyRegistrationPage({ registration }: Props) {
    const { payment, status, is_confirmed, is_free, internal_contest } = registration;
    const showPayButton = !is_free && !is_confirmed && (!payment?.status || ['failed', 'canceled'].includes(payment.status));

    const form = useForm({ gateway: 'sslcommerz' });

    return (
        <MainLayout>
            <Head title={`My Registration - ${internal_contest.title}`} />

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-8 dark:from-slate-950 dark:to-slate-900">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <Link href={`/internal-contests/${internal_contest.slug}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => router.reload({ only: ['registration'] })}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Main Grid */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left Column */}
                        <div className="lg:col-span-2">
                            {/* Contest Header */}
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold">{internal_contest.title}</h1>
                                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Registered {formatDate(registration.registered_at)}
                                </p>
                            </div>

                            {/* Status Alert */}
                            <StatusAlert status={status} isConfirmed={is_confirmed} payment={payment} hasFee={!is_free} />

                            {/* Info Cards */}
                            <div className="mt-6 space-y-4">
                                {/* Personal Info */}
                                <InfoCard title="Personal Information">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field icon={User} label="Full Name" value={registration.name} />
                                        <Field icon={Mail} label="Email" value={registration.email} />
                                        <Field icon={Phone} label="Phone" value={registration.phone} />
                                        <Field icon={User} label="Student ID" value={registration.student_id} />
                                    </div>
                                </InfoCard>

                                {/* Academic Info */}
                                <InfoCard title="Academic Details">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field icon={GraduationCap} label="Department" value={registration.department} />
                                        <Field icon={BookOpen} label="Section" value={registration.section} />
                                        <Field label="Gender" value={<span className="capitalize">{registration.gender}</span>} />
                                        {registration.lab_teacher_name && <Field label="Lab Teacher" value={registration.lab_teacher_name} />}
                                    </div>
                                </InfoCard>

                                {/* Event Details */}
                                {(registration.tshirt_size || registration.pickup_point) && (
                                    <InfoCard title="Event Details">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {registration.tshirt_size && <Field icon={Shirt} label="T-Shirt Size" value={registration.tshirt_size} />}
                                            {registration.pickup_point && (
                                                <Field icon={MapPin} label="Pickup Point" value={registration.pickup_point} />
                                            )}
                                        </div>
                                    </InfoCard>
                                )}

                                {/* Payment History */}
                                {registration.payment_history.length > 0 && (
                                    <InfoCard title="Payment History">
                                        <div className="space-y-3">
                                            {registration.payment_history.map((p) => (
                                                <PaymentItem key={p.id} payment={p} />
                                            ))}
                                        </div>
                                    </InfoCard>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Banner */}
                            {internal_contest.banner_image && (
                                <div className="overflow-hidden rounded-xl shadow-lg">
                                    <img
                                        src={internal_contest.banner_image}
                                        alt={internal_contest.title}
                                        className="aspect-video w-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Payment Card */}
                            {!is_free && (
                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="mb-4 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">Payment</h3>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-muted-foreground">Registration Fee</p>
                                        <p className="text-3xl font-bold">৳{internal_contest.registration_fee}</p>
                                    </div>

                                    {payment && (
                                        <>
                                            <div className="mb-4 space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Status</span>
                                                    <Badge status={payment.status} />
                                                </div>
                                                {payment.paid_at && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Paid On</span>
                                                        <span className="font-medium">{formatShortDate(payment.paid_at)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mb-4 rounded-lg border border-dashed bg-muted/30 p-3">
                                                <p className="mb-1 text-xs text-muted-foreground">Transaction ID</p>
                                                <p className="font-mono text-xs break-all">{payment.transaction_id}</p>
                                            </div>
                                        </>
                                    )}

                                    {showPayButton && (
                                        <Button
                                            onClick={() => form.post(initiateRegistrationPayment.url({ registration: registration.id }))}
                                            className="w-full"
                                            size="lg"
                                            disabled={form.processing}
                                        >
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            {form.processing ? 'Processing...' : payment ? 'Retry Payment' : 'Pay Now'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Contest Info */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 font-semibold">Contest Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Semester</p>
                                        <p className="font-medium">{internal_contest.semester}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Deadline</p>
                                        <p className="font-medium">{formatDate(internal_contest.registration_deadline)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

function StatusAlert({
    status,
    isConfirmed,
    payment,
    hasFee,
}: {
    status: string;
    isConfirmed: boolean;
    payment: InternalContestMyRegistration['payment'];
    hasFee: boolean;
}) {
    const alerts = {
        confirmed: {
            icon: CheckCircle2,
            className: 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300',
            title: '🎉 Registration Confirmed',
            message: "You're all set! Good luck with the contest.",
        },
        review: {
            icon: AlertCircle,
            className: 'border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300',
            title: 'Under Review',
            message: 'Payment verification in progress. Usually takes 24-48 hours.',
        },
        processing: {
            icon: Clock,
            className: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300',
            title: 'Processing Payment',
            message: 'Please wait a few minutes and refresh the page.',
        },
        failed: {
            icon: XCircle,
            className: 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300',
            title: 'Payment Failed',
            message: 'Your payment could not be processed. Please retry.',
        },
        canceled: {
            icon: XCircle,
            className: 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300',
            title: 'Payment Canceled',
            message: 'You can retry to complete your registration.',
        },
        pending: {
            icon: AlertCircle,
            className: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            title: 'Payment Required',
            message: 'Complete payment to confirm your registration.',
        },
    };

    let alert = null;
    if (isConfirmed) alert = alerts.confirmed;
    else if (status === 'under_review' || payment?.status === 'under_manual_review') alert = alerts.review;
    else if (payment?.status === 'pending') alert = alerts.processing;
    else if (payment?.status === 'failed') alert = alerts.failed;
    else if (payment?.status === 'canceled') alert = alerts.canceled;
    else if (status === 'pending' && hasFee && !payment) alert = alerts.pending;

    if (!alert) return null;

    const Icon = alert.icon;

    return (
        <div className={cn('flex gap-3 rounded-xl border p-4 shadow-sm', alert.className)}>
            <Icon className="h-5 w-5 shrink-0" />
            <div>
                <p className="font-semibold">{alert.title}</p>
                <p className="mt-1 text-sm opacity-90">{alert.message}</p>
            </div>
        </div>
    );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            {children}
        </div>
    );
}

function Field({ icon: Icon, label, value }: { icon?: any; label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </div>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const styles: Record<string, { icon: any; className: string; label: string }> = {
        paid: {
            icon: CheckCircle2,
            className: 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-300',
            label: 'Paid',
        },
        under_manual_review: {
            icon: AlertCircle,
            className: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300',
            label: 'Review',
        },
        failed: {
            icon: XCircle,
            className: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300',
            label: 'Failed',
        },
        canceled: {
            icon: XCircle,
            className: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300',
            label: 'Canceled',
        },
        pending: {
            icon: Clock,
            className: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
            label: 'Pending',
        },
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', style.className)}>
            <Icon className="h-3 w-3" />
            {style.label}
        </span>
    );
}

function PaymentItem({ payment }: { payment: InternalContestMyRegistration['payment_history'][0] }) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                    <Badge status={payment.status} />
                    <span className="text-sm font-bold">৳{payment.amount}</span>
                </div>
                {payment.paid_at && <p className="mb-1 text-xs text-muted-foreground">{formatDate(payment.paid_at)}</p>}
                <p className="font-mono text-xs text-muted-foreground">{payment.transaction_id}</p>
            </div>
        </div>
    );
}

function formatDate(date: string) {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatShortDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
