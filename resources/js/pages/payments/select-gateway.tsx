import { initiateRegistrationPayment } from '@/actions/App/Http/Controllers/PaymentController';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, CreditCard, Lock, Shield } from 'lucide-react';

type Props = {
    registration: {
        id: number;
        name: string;
        email: string;
        amount: number;
        contest_title: string;
    };
};

export default function SelectGateway({ registration }: Props) {
    const form = useForm({ gateway: 'sslcommerz' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(initiateRegistrationPayment.url({ registration: registration.id }));
    };

    return (
        <>
            <Head title="Select Payment Method" />
            <div className="min-h-screen bg-white">
                {/* Header */}
                <header className="border-b bg-white">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/images/logo.png" alt="DIU ACM" className="h-10" />
                                <div className="h-8 w-px bg-gray-300" />
                                <span className="text-sm font-medium text-gray-700">Secure Payment Gateway</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Shield className="h-4 w-4 text-green-600" />
                                <span>256-bit Encryption</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="container mx-auto max-w-2xl px-4 py-8">
                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Registration
                    </button>

                    {/* Payment Summary Card */}
                    <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h1 className="text-lg font-semibold text-gray-900">Payment Details</h1>
                        </div>
                        <div className="px-6 py-5">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Contest</span>
                                    <span className="text-sm font-medium text-gray-900">{registration.contest_title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Name</span>
                                    <span className="text-sm font-medium text-gray-900">{registration.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Email</span>
                                    <span className="text-sm font-medium text-gray-900">{registration.email}</span>
                                </div>
                                <div className="my-4 border-t border-gray-200" />
                                <div className="flex justify-between">
                                    <span className="text-base font-medium text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-bold text-gray-900">৳{registration.amount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">Select Payment Method</h2>
                                <p className="mt-1 text-sm text-gray-500">Choose your preferred payment gateway</p>
                            </div>

                            <div className="p-6">
                                <div className="space-y-3">
                                    {/* SSL Commerz Option */}
                                    <label className="relative block cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gateway"
                                            value="sslcommerz"
                                            checked={form.data.gateway === 'sslcommerz'}
                                            onChange={(e) => form.setData('gateway', e.target.value)}
                                            className="peer sr-only"
                                        />
                                        <div className="flex items-center justify-between rounded-lg border-2 border-gray-200 p-4 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:border-gray-300">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                                                    <CreditCard className="h-6 w-6 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">SSLCommerz</div>
                                                    <div className="mt-0.5 text-sm text-gray-500">
                                                        Visa, Mastercard, bKash, Nagad, Rocket & more
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden peer-checked:block">
                                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 peer-checked:hidden" />
                                        </div>
                                    </label>

                                    {/* More gateways can be added here */}
                                </div>

                                {form.errors.gateway && (
                                    <p className="mt-2 text-sm text-red-600">{form.errors.gateway}</p>
                                )}
                            </div>
                        </div>

                        {/* Proceed Button */}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-4 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Lock className="h-5 w-5" />
                            {form.processing ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex gap-3">
                            <Shield className="h-5 w-5 shrink-0 text-gray-600" />
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Secure Payment</h3>
                                <p className="mt-1 text-xs text-gray-600">
                                    Your payment information is encrypted and secure. We never store your card details. All
                                    transactions are processed through PCI-DSS compliant payment gateways.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            © {new Date().getFullYear()} DIU ACM. All rights reserved.
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Need help?{' '}
                            <a href="/contact" className="text-emerald-600 hover:underline">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
