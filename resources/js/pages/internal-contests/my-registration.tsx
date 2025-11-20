import { initiateRegistrationPayment } from '@/actions/App/Http/Controllers/PaymentController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { InternalContestMyRegistration, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, CreditCard, MapPin, Shirt, User } from 'lucide-react';

type Props = {
    registration: InternalContestMyRegistration;
};

export default function MyRegistrationPage({ registration }: Props) {
    const { auth } = usePage<SharedData>().props;

    const isPending = registration.payment_status === 'pending';
    const isPaid = registration.payment_status === 'paid';

    const form = useForm({
        gateway: 'sslcommerz',
    });

    const handlePayment = () => {
        form.post(initiateRegistrationPayment.url({ registration: registration.id }));
    };

    return (
        <MainLayout>
            <Head title={`My Registration - ${registration.internal_contest.title}`} />

            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Registration Details
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                            {registration.internal_contest.title}
                        </p>
                    </div>

                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Registration ID: #{registration.id}</CardTitle>
                                    <CardDescription>
                                        Registered on {new Date(registration.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant={isPaid ? 'default' : isPending ? 'secondary' : 'destructive'}
                                    className="text-sm px-3 py-1 capitalize"
                                >
                                    {registration.payment_status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary" />
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Name</span>
                                            <span className="font-medium">{registration.name}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Student ID</span>
                                            <span className="font-medium">{registration.student_id}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Email</span>
                                            <span className="font-medium">{registration.email}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Phone</span>
                                            <span className="font-medium">{registration.phone}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Gender</span>
                                            <span className="font-medium capitalize">{registration.gender}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        Academic & Logistics
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Department</span>
                                            <span className="font-medium">{registration.department}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Section</span>
                                            <span className="font-medium">{registration.section}</span>
                                        </div>
                                        {registration.lab_teacher_name && (
                                            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                                <span className="text-gray-500">Lab Teacher</span>
                                                <span className="font-medium">{registration.lab_teacher_name}</span>
                                            </div>
                                        )}
                                        {registration.tshirt_size && (
                                            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                                <span className="text-gray-500">T-Shirt Size</span>
                                                <span className="font-medium flex items-center gap-1">
                                                    <Shirt className="w-3 h-3" /> {registration.tshirt_size}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-gray-500">Transport</span>
                                            <span className="font-medium">
                                                {registration.transport_service_required ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                        {registration.pickup_point && (
                                            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                                <span className="text-gray-500">Pickup Point</span>
                                                <span className="font-medium">{registration.pickup_point}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isPaid && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-green-900 dark:text-green-100">Registration Confirmed</h4>
                                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                            Your payment has been received and your registration is confirmed. Good luck with the contest!
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isPending && registration.internal_contest.registration_fee > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Payment Pending</h4>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                            Please complete your payment to confirm your registration.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-gray-50 dark:bg-gray-900/50 border-t p-6 flex justify-end">
                            {isPending && registration.internal_contest.registration_fee > 0 && (
                                <Button onClick={handlePayment} size="lg" className="w-full sm:w-auto" disabled={form.processing}>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {form.processing ? 'Processing...' : `Pay Now (৳${registration.internal_contest.registration_fee})`}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
