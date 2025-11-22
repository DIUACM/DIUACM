import { initiateRegistrationPayment } from '@/actions/App/Http/Controllers/PaymentController';
import BlankLayout from '@/layouts/blank-layout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, CreditCard, Lock, Shield, Smartphone } from 'lucide-react';

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
        <BlankLayout>
            <Head title="Select Payment Method" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header */}
                <header className="border-b bg-white shadow-sm">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/images/diuacm-logo-rounded.webp" alt="DIU ACM" className="h-10 w-10" />
                                <div className="h-8 w-px bg-gray-300" />
                                <span className="text-sm font-medium text-gray-700">Secure Payment Gateway</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-700">
                                <Shield className="h-4 w-4" />
                                <span className="hidden sm:inline">256-bit Encryption</span>
                                <span className="sm:hidden">Secure</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        className="group mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Registration
                    </button>

                    {/* Payment Summary Card */}
                    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                            <h1 className="text-lg font-semibold text-white">Payment Details</h1>
                        </div>
                        <div className="px-6 py-6">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Contest</span>
                                    <span className="text-sm font-semibold text-gray-900">{registration.contest_title}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Name</span>
                                    <span className="text-sm font-semibold text-gray-900">{registration.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Email</span>
                                    <span className="text-sm font-semibold text-gray-900">{registration.email}</span>
                                </div>
                                <div className="mt-6 flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-4">
                                    <span className="text-base font-semibold text-gray-900">Total Amount</span>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-emerald-600">৳{registration.amount}</div>
                                        <div className="text-xs text-gray-500">BDT</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                                <h2 className="text-lg font-semibold text-white">Select Payment Method</h2>
                                <p className="mt-1 text-sm text-gray-200">Choose your preferred payment gateway</p>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    {/* SSL Commerz Option */}
                                    <label className="group relative block cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gateway"
                                            value="sslcommerz"
                                            checked={form.data.gateway === 'sslcommerz'}
                                            onChange={(e) => form.setData('gateway', e.target.value)}
                                            className="peer sr-only"
                                        />
                                        <div className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all peer-checked:border-emerald-500 peer-checked:bg-gradient-to-r peer-checked:from-emerald-50 peer-checked:to-green-50 peer-checked:shadow-md hover:border-gray-300 hover:shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg transition-transform group-hover:scale-105">
                                                    <CreditCard className="h-7 w-7 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-base font-bold text-gray-900">SSLCommerz</div>
                                                    <div className="mt-1 text-sm text-gray-600">Visa, Mastercard, bKash, Nagad & more</div>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                            Cards
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700">
                                                            bKash
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                                            Nagad
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                            Rocket
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {form.data.gateway === 'sslcommerz' ? (
                                                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                                                ) : (
                                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 transition-all group-hover:border-emerald-400" />
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* MFS Manual Option */}
                                    <label className="group relative block cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gateway"
                                            value="mfs_manual"
                                            checked={form.data.gateway === 'mfs_manual'}
                                            onChange={(e) => form.setData('gateway', e.target.value)}
                                            className="peer sr-only"
                                        />
                                        <div className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all peer-checked:border-blue-500 peer-checked:bg-gradient-to-r peer-checked:from-blue-50 peer-checked:to-indigo-50 peer-checked:shadow-md hover:border-gray-300 hover:shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transition-transform group-hover:scale-105">
                                                    <Smartphone className="h-7 w-7 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-base font-bold text-gray-900">MFS Manual</div>
                                                    <div className="mt-1 text-sm text-gray-600">Pay via bKash, Nagad, or Rocket (Manual)</div>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        <span className="inline-flex items-center rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700">
                                                            bKash
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                                            Nagad
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                            Rocket
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                            Manual Review
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {form.data.gateway === 'mfs_manual' ? (
                                                    <CheckCircle className="h-7 w-7 text-blue-600" />
                                                ) : (
                                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 transition-all group-hover:border-blue-400" />
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Placeholder for future gateways */}
                                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                                        <p className="text-sm text-gray-500">More payment options coming soon</p>
                                    </div>
                                </div>

                                {form.errors.gateway && (
                                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.errors.gateway}</div>
                                )}
                            </div>
                        </div>

                        {/* Proceed Button */}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:from-emerald-600 disabled:hover:to-emerald-700"
                        >
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                            <Lock className="h-5 w-5" />
                            <span>{form.processing ? 'Processing...' : 'Proceed to Secure Payment'}</span>
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm">
                        <div className="flex gap-4 p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                <Shield className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">Secure & Protected Payment</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
                                    Your payment information is encrypted with industry-standard 256-bit SSL encryption. We never store your card
                                    details. All transactions are processed through PCI-DSS compliant payment gateways.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                                        <Lock className="h-3 w-3" />
                                        SSL Secured
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                                        <CheckCircle className="h-3 w-3" />
                                        PCI-DSS Compliant
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-gray-500">© {new Date().getFullYear()} DIU ACM. All rights reserved.</p>
                        <p className="mt-2 text-sm text-gray-600">
                            Need help?{' '}
                            <a href="/contact" className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 hover:underline">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </BlankLayout>
    );
}
