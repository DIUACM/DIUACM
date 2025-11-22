import { initiateRegistrationPayment } from '@/actions/App/Http/Controllers/PaymentController';
import BlankLayout from '@/layouts/blank-layout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, CreditCard, Lock, Smartphone } from 'lucide-react';

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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
                {/* Background decorations */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
                    <div className="absolute top-10 right-20 h-32 w-32 rounded-full bg-cyan-200/50 blur-2xl" />
                </div>

                {/* Header */}
                <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
                    <div className="mx-auto max-w-5xl px-4 py-4">
                        <div className="flex items-center gap-3">
                            <img src="/images/diuacm-logo-rounded.webp" alt="DIU ACM" className="h-9 w-9" />
                            <div className="h-6 w-px bg-slate-300" />
                            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-sm font-semibold text-transparent">Payment Gateway</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="mx-auto max-w-5xl px-4 py-8">
                    {/* Back Link */}
                    <button
                        onClick={() => window.history.back()}
                        className="mb-6 flex items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Order Summary - Left Column */}
                        <div className="lg:col-span-1">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
                                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Order Summary</h2>
                                <div className="space-y-3 border-b border-slate-100 pb-4">
                                    <div>
                                        <div className="text-xs text-gray-500">Contest</div>
                                        <div className="mt-0.5 text-sm font-medium text-gray-900">{registration.contest_title}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Name</div>
                                        <div className="mt-0.5 text-sm font-medium text-gray-900">{registration.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Email</div>
                                        <div className="mt-0.5 text-sm font-medium text-gray-900">{registration.email}</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-baseline justify-between">
                                    <span className="text-sm font-medium text-gray-700">Total</span>
                                    <div className="text-right">
                                        <div className="text-2xl font-semibold text-gray-900">৳{registration.amount}</div>
                                        <div className="text-xs text-gray-500">BDT</div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Info */}
                            <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                                <div className="flex items-start gap-3">
                                    <Lock className="mt-0.5 h-4 w-4 text-blue-600" />
                                    <div>
                                        <div className="text-xs font-semibold text-slate-900">Secure Payment</div>
                                        <div className="mt-1 text-xs leading-relaxed text-slate-600">
                                            Protected by 256-bit SSL encryption.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method - Right Column */}
                        <div className="lg:col-span-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
                                <h2 className="mb-1 text-lg font-semibold text-slate-900">Payment Method</h2>
                                <p className="mb-6 text-sm text-slate-600">Select your preferred payment option</p>

                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-3">
                                        {/* SSLCommerz Option */}
                                        <label className="block cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gateway"
                                                value="sslcommerz"
                                                checked={form.data.gateway === 'sslcommerz'}
                                                onChange={(e) => form.setData('gateway', e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="flex items-center justify-between rounded-lg border-2 p-4 transition-all peer-checked:border-blue-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-50 peer-checked:to-cyan-50 hover:border-slate-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
                                                        <CreditCard className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">SSLCommerz</div>
                                                        <div className="text-sm text-slate-600">Cards, bKash, Nagad, Rocket</div>
                                                    </div>
                                                </div>
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 peer-checked:border-blue-600 peer-checked:bg-blue-600">
                                                    {form.data.gateway === 'sslcommerz' && <CheckCircle className="h-5 w-5 text-white" />}
                                                </div>
                                            </div>
                                        </label>

                                        {/* MFS Manual Option */}
                                        <label className="block cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gateway"
                                                value="mfs_manual"
                                                checked={form.data.gateway === 'mfs_manual'}
                                                onChange={(e) => form.setData('gateway', e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="flex items-center justify-between rounded-lg border-2 p-4 transition-all peer-checked:border-blue-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-50 peer-checked:to-cyan-50 hover:border-slate-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 shadow-sm">
                                                        <Smartphone className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">MFS Manual Payment</div>
                                                        <div className="text-sm text-slate-600">bKash, Nagad, Rocket (Manual verification)</div>
                                                    </div>
                                                </div>
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 peer-checked:border-blue-600 peer-checked:bg-blue-600">
                                                    {form.data.gateway === 'mfs_manual' && <CheckCircle className="h-5 w-5 text-white" />}
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {form.errors.gateway && (
                                        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{form.errors.gateway}</div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Lock className="h-4 w-4" />
                                        {form.processing ? 'Processing...' : 'Continue to Payment'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-slate-500">
                        <p>© {new Date().getFullYear()} DIU ACM. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </BlankLayout>
    );
}
