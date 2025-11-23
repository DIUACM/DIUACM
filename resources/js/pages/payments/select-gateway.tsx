import { initiatePayment } from '@/actions/App/Http/Controllers/InternalContestRegistrationPaymentController';
import BlankLayout from '@/layouts/blank-layout';
import { Head, useForm } from '@inertiajs/react';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';

type Props = {
    registration: {
        id: number;
        name: string;
        email: string;
        amount: number;
        contest_title: string;
    };
    payment_config: {
        sslcommerz_enabled: boolean;
    };
};

export default function SelectGateway({ registration, payment_config }: Props) {
    const form = useForm({ gateway: 'sslcommerz' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(initiatePayment.url({ registration: registration.id }));
    };

    return (
        <BlankLayout>
            <Head title="Checkout" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Header Section */}
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Checkout</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Registration for <span className="font-medium text-gray-900">{registration.contest_title}</span>
                        </p>
                    </div>

                    {/* Amount Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <p className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">Total Payable</p>
                        <div className="flex items-center justify-center text-4xl font-extrabold text-gray-900">
                            <span className="mr-1 text-2xl font-medium text-gray-400">৳</span>
                            {registration.amount}
                        </div>
                        <div className="mx-auto mt-4 flex w-fit items-center justify-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
                            <Lock className="h-3 w-3" />
                            Secured by 256-bit encryption
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-3">
                            <p className="px-1 text-sm font-medium text-gray-700">Select Payment Method</p>

                            {/* SSLCommerz */}
                            {payment_config.sslcommerz_enabled && (
                                <label
                                    className={`group relative flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all duration-200 ${form.data.gateway === 'sslcommerz' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <div className="absolute top-1/2 right-4 flex h-5 -translate-y-1/2 items-center">
                                        <input
                                            type="radio"
                                            name="gateway"
                                            value="sslcommerz"
                                            checked={form.data.gateway === 'sslcommerz'}
                                            onChange={(e) => form.setData('gateway', e.target.value)}
                                            className="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4 flex-1 pr-8">
                                        <span className="block text-sm font-bold text-gray-900">Pay Online</span>
                                        <span className="mt-0.5 block text-xs text-gray-500">Instant activation via Card, bKash, Nagad</span>
                                    </div>
                                </label>
                            )}

                            {!payment_config.sslcommerz_enabled && (
                                <div className="py-8 text-center text-gray-500">
                                    <p className="text-sm">No payment methods are currently available</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex w-full transform justify-center rounded-xl border border-transparent bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {form.processing ? 'Processing...' : `Pay ৳${registration.amount}`}
                        </button>

                        <p className="text-center text-xs text-gray-400">By continuing, you agree to our Terms of Service</p>
                    </form>
                </div>
            </div>
        </BlankLayout>
    );
}
