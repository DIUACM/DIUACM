import { initiateRegistrationPayment } from '@/actions/App/Http/Controllers/PaymentController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { InternalContestMyRegistration, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock, CreditCard, Info, MapPin, Shirt, User, XCircle, AlertCircle } from 'lucide-react';

type Props = {
    registration: InternalContestMyRegistration;
};

export default function MyRegistrationPage({ registration }: Props) {
    const { auth } = usePage<SharedData>().props;

    const registrationStatus = registration.status;
    const paymentStatus = registration.payment_status;
    const hasFee = registration.internal_contest.registration_fee > 0;

    const isRegistrationPending = registrationStatus === 'pending';
    const isRegistrationPaid = registrationStatus === 'paid';
    const isRegistrationCanceled = registrationStatus === 'canceled';
    const isRegistrationUnderReview = registrationStatus === 'under_review';

    const isPaymentPending = paymentStatus === 'pending';
    const isPaymentPaid = paymentStatus === 'paid';
    const isPaymentFailed = paymentStatus === 'failed';
    const isPaymentCanceled = paymentStatus === 'canceled';
    const isPaymentUnderManualReview = paymentStatus === 'under_manual_review';

    const form = useForm({
        gateway: 'sslcommerz',
    });

    const handlePayment = () => {
        form.post(initiateRegistrationPayment.url({ registration: registration.id }));
    };

    const getRegistrationStatusColor = () => {
        if (isRegistrationPaid) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900';
        if (isRegistrationCanceled) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900';
        if (isRegistrationUnderReview) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900';
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900';
    };

    const getPaymentStatusColor = () => {
        if (isPaymentPaid) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900';
        if (isPaymentFailed || isPaymentCanceled) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900';
        if (isPaymentPending) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900';
        if (isPaymentUnderManualReview) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900';
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-900';
    };

    const getRegistrationStatusIcon = () => {
        if (isRegistrationPaid) return <CheckCircle2 className="h-5 w-5" />;
        if (isRegistrationCanceled) return <XCircle className="h-5 w-5" />;
        if (isRegistrationUnderReview) return <AlertCircle className="h-5 w-5" />;
        return <Clock className="h-5 w-5" />;
    };

    const getPaymentStatusIcon = () => {
        if (isPaymentPaid) return <CheckCircle2 className="h-5 w-5" />;
        if (isPaymentFailed || isPaymentCanceled) return <XCircle className="h-5 w-5" />;
        if (isPaymentPending) return <Clock className="h-5 w-5" />;
        if (isPaymentUnderManualReview) return <AlertCircle className="h-5 w-5" />;
        return <Info className="h-5 w-5" />;
    };

    return (
        <MainLayout>
            <Head title={`My Registration - ${registration.internal_contest.title}`} />

            <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Registration Details</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{registration.internal_contest.title}</p>
                    </div>

                    {/* Status Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Registration Status Card */}
                        <Card className="border-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Registration Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${getRegistrationStatusColor()}`}>
                                    {getRegistrationStatusIcon()}
                                    <div className="flex-1">
                                        <p className="font-semibold capitalize">{registrationStatus === 'under_review' ? 'Under Review' : registrationStatus}</p>
                                        <p className="text-sm opacity-90">
                                            {isRegistrationPaid && 'Your registration is confirmed'}
                                            {isRegistrationPending && 'Awaiting payment confirmation'}
                                            {isRegistrationCanceled && 'Registration has been canceled'}
                                            {isRegistrationUnderReview && 'Payment verification in progress'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Status Card */}
                        {hasFee && (
                            <Card className="border-2">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Payment Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${getPaymentStatusColor()}`}>
                                        {getPaymentStatusIcon()}
                                        <div className="flex-1">
                                            <p className="font-semibold capitalize">{paymentStatus === 'under_manual_review' ? 'Under Manual Review' : paymentStatus || 'Not Initiated'}</p>
                                            <p className="text-sm opacity-90">
                                                {isPaymentPaid && `Paid ৳${registration.payment_amount}`}
                                                {isPaymentPending && 'Payment is being processed'}
                                                {isPaymentFailed && 'Payment failed, please retry'}
                                                {isPaymentCanceled && 'Payment was canceled'}
                                                {isPaymentUnderManualReview && 'Admin verification pending'}
                                                {!paymentStatus && 'No payment initiated yet'}
                                            </p>
                                        </div>
                                    </div>
                                    {registration.payment_transaction_id && (
                                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                                            Transaction ID: {registration.payment_transaction_id}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Main Information Card */}
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-xl">Registration #{registration.id}</CardTitle>
                                    <CardDescription className="mt-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Registered on {new Date(registration.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Personal Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Full Name" value={registration.name} />
                                        <InfoRow label="Student ID" value={registration.student_id} />
                                        <InfoRow label="Email Address" value={registration.email} />
                                        <InfoRow label="Phone Number" value={registration.phone} />
                                        <InfoRow label="Gender" value={<span className="capitalize">{registration.gender}</span>} />
                                    </div>
                                </div>

                                {/* Academic Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Academic Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Department" value={registration.department} />
                                        <InfoRow label="Section" value={registration.section} />
                                        {registration.lab_teacher_name && (
                                            <InfoRow label="Lab Teacher" value={registration.lab_teacher_name} />
                                        )}
                                    </div>
                                </div>

                                {/* Logistics Information */}
                                {(registration.tshirt_size || registration.transport_service_required) && (
                                    <div className="space-y-4 lg:col-span-2">
                                        <div className="flex items-center gap-2 border-b pb-2">
                                            <Shirt className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold">Event Logistics</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {registration.tshirt_size && (
                                                <InfoRow label="T-Shirt Size" value={registration.tshirt_size} />
                                            )}
                                            <InfoRow 
                                                label="Transport Service" 
                                                value={registration.transport_service_required ? 'Required' : 'Not Required'} 
                                            />
                                            {registration.pickup_point && (
                                                <InfoRow label="Pickup Point" value={registration.pickup_point} className="md:col-span-2" />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Alert Messages */}
                            <div className="mt-8 space-y-4">
                                {isRegistrationPaid && (
                                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 dark:text-green-100">
                                                🎉 Registration Confirmed!
                                            </h4>
                                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                                Your payment has been received and your registration is confirmed. 
                                                Get ready for an amazing contest experience. Good luck!
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isRegistrationPending && hasFee && !paymentStatus && (
                                    <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                                        <div>
                                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                                Payment Required
                                            </h4>
                                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                                Please complete your payment of <strong>৳{registration.internal_contest.registration_fee}</strong> to 
                                                confirm your registration and secure your spot in the contest.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isPaymentPending && (
                                    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                                        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                                Payment Processing
                                            </h4>
                                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                                Your payment is being processed. This usually takes a few minutes. 
                                                Please refresh the page to check the status.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {(isPaymentFailed || isPaymentCanceled) && (
                                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                                        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                        <div>
                                            <h4 className="font-semibold text-red-900 dark:text-red-100">
                                                Payment {isPaymentFailed ? 'Failed' : 'Canceled'}
                                            </h4>
                                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                                {isPaymentFailed && 'Your payment could not be processed. Please try again or contact support if the issue persists.'}
                                                {isPaymentCanceled && 'Your payment was canceled. You can retry the payment to complete your registration.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isPaymentUnderManualReview && (
                                    <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-900/20">
                                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                                                Payment Under Manual Review
                                            </h4>
                                            <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                                                Your payment is currently being verified by our team. This process may take up to 24-48 hours. 
                                                You will be notified via email once the review is complete. Please do not attempt another payment.
                                            </p>
                                            {registration.payment_transaction_id && (
                                                <p className="mt-2 text-xs font-mono text-purple-600 dark:text-purple-400">
                                                    Reference: {registration.payment_transaction_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        {/* Action Footer */}
                        {isRegistrationPending && hasFee && !isPaymentPaid && !isPaymentPending && !isPaymentUnderManualReview && (
                            <CardFooter className="border-t bg-gray-50 p-6 dark:bg-gray-900/50">
                                <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <p className="font-medium">Amount to Pay</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            ৳{registration.internal_contest.registration_fee}
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handlePayment} 
                                        size="lg" 
                                        className="w-full sm:w-auto"
                                        disabled={form.processing}
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {form.processing ? 'Processing...' : 'Proceed to Payment'}
                                    </Button>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}

// Helper Component for Info Rows
function InfoRow({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-base font-medium text-gray-900 dark:text-gray-100">{value}</span>
        </div>
    );
}
