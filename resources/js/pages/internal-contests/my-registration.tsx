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

    const isPending = registration.status === 'pending';
    const isPaid = registration.status === 'paid';

    const form = useForm({
        gateway: 'sslcommerz',
    });

    const handlePayment = () => {
        form.post(initiateRegistrationPayment.url({ registration: registration.id }));
    };

    return (
        <MainLayout>
            <Head title={`My Registration - ${registration.internal_contest.title}`} />

            <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Registration Details</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{registration.internal_contest.title}</p>
                    </div>

                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Registration ID: #{registration.id}</CardTitle>
                                    <CardDescription>Registered on {new Date(registration.created_at).toLocaleDateString()}</CardDescription>
                                </div>
                                <Badge
                                    variant={isPaid ? 'default' : isPending ? 'secondary' : 'destructive'}
                                    className="px-3 py-1 text-sm capitalize"
                                >
                                    {registration.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                                        <User className="h-5 w-5 text-primary" />
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Name</span>
                                            <span className="font-medium">{registration.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Student ID</span>
                                            <span className="font-medium">{registration.student_id}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Email</span>
                                            <span className="font-medium">{registration.email}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Phone</span>
                                            <span className="font-medium">{registration.phone}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Gender</span>
                                            <span className="font-medium capitalize">{registration.gender}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Academic & Logistics
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Department</span>
                                            <span className="font-medium">{registration.department}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Section</span>
                                            <span className="font-medium">{registration.section}</span>
                                        </div>
                                        {registration.lab_teacher_name && (
                                            <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                                <span className="text-gray-500">Lab Teacher</span>
                                                <span className="font-medium">{registration.lab_teacher_name}</span>
                                            </div>
                                        )}
                                        {registration.tshirt_size && (
                                            <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                                <span className="text-gray-500">T-Shirt Size</span>
                                                <span className="flex items-center gap-1 font-medium">
                                                    <Shirt className="h-3 w-3" /> {registration.tshirt_size}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                            <span className="text-gray-500">Transport</span>
                                            <span className="font-medium">{registration.transport_service_required ? 'Yes' : 'No'}</span>
                                        </div>
                                        {registration.pickup_point && (
                                            <div className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                                                <span className="text-gray-500">Pickup Point</span>
                                                <span className="font-medium">{registration.pickup_point}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isPaid && (
                                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <h4 className="font-medium text-green-900 dark:text-green-100">Registration Confirmed</h4>
                                        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                            Your payment has been received and your registration is confirmed. Good luck with the contest!
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isPending && registration.internal_contest.registration_fee > 0 && (
                                <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                                    <Clock className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    <div>
                                        <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Payment Pending</h4>
                                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                            Please complete your payment to confirm your registration.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end border-t bg-gray-50 p-6 dark:bg-gray-900/50">
                            {isPending && registration.internal_contest.registration_fee > 0 && (
                                <Button onClick={handlePayment} size="lg" className="w-full sm:w-auto" disabled={form.processing}>
                                    <CreditCard className="mr-2 h-4 w-4" />
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
