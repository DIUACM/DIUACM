import BlankLayout from '@/layouts/blank-layout';
import { Head, useForm } from '@inertiajs/react';
import { submitMfsManual } from '@/actions/App/Http/Controllers/PaymentController';
import { ArrowLeft, AlertCircle, Copy } from 'lucide-react';
import { useState } from 'react';

type MfsType = {
    value: string;
    label: string;
};

type Props = {
    payment: {
        id: number;
        transaction_id: string;
        amount: number;
        currency: string;
    };
    payable: {
        type: string;
        name: string;
        email: string;
        contest_title: string;
    };
    receiver_numbers: {
        bkash: string;
        nagad: string;
        rocket: string;
    };
    mfs_types: MfsType[];
};

export default function MfsManual({ payment, payable, receiver_numbers, mfs_types }: Props) {
    const [selectedMfs, setSelectedMfs] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const form = useForm({
        transaction_id: payment.transaction_id,
        mfs_type: '',
        sender_number: '',
        mfs_transaction_id: '',
    });

    const handleMfsChange = (mfsType: string) => {
        setSelectedMfs(mfsType);
        form.setData('mfs_type', mfsType);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(submitMfsManual.url());
    };

    const getReceiverNumber = () => {
        if (!selectedMfs) return '';
        return receiver_numbers[selectedMfs as keyof typeof receiver_numbers] || '';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <BlankLayout>
            <Head title="MFS Manual Payment" />
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
                            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-sm font-semibold text-transparent">MFS Payment</span>
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
                                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Payment Details</h2>
                                <div className="space-y-3 border-b border-slate-100 pb-4">
                                    <div>
                                        <div className="text-xs text-slate-500">Contest</div>
                                        <div className="mt-0.5 text-sm font-medium text-slate-900">{payable.contest_title}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Name</div>
                                        <div className="mt-0.5 text-sm font-medium text-slate-900">{payable.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Transaction ID</div>
                                        <div className="mt-0.5 font-mono text-sm font-medium text-slate-900">{payment.transaction_id}</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-baseline justify-between">
                                    <span className="text-sm font-medium text-slate-700">Amount</span>
                                    <div className="text-right">
                                        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent">৳{payment.amount}</div>
                                        <div className="text-xs text-slate-500">{payment.currency}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Notice */}
                            <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                    <div>
                                        <div className="text-xs font-semibold text-slate-900">Manual Verification</div>
                                        <div className="mt-1 text-xs leading-relaxed text-slate-600">
                                            Verified within 24-48 hours.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Form - Right Column */}
                        <div className="lg:col-span-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
                                <h2 className="mb-1 text-lg font-semibold text-slate-900">Complete Payment</h2>
                                <p className="mb-6 text-sm text-slate-600">Follow the steps below to complete your payment</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Step 1: Select Provider */}
                                    <div>
                                        <label className="mb-3 block text-sm font-semibold text-slate-700">
                                            Step 1: Select MFS Provider
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {mfs_types.map((mfs) => (
                                                <label key={mfs.value} className="cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="mfs_type"
                                                        value={mfs.value}
                                                        checked={selectedMfs === mfs.value}
                                                        onChange={(e) => handleMfsChange(e.target.value)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="flex flex-col items-center gap-2 rounded-lg border-2 p-4 shadow-sm transition-all peer-checked:border-blue-600 peer-checked:bg-gradient-to-br peer-checked:from-blue-50 peer-checked:to-cyan-50 hover:border-slate-300">
                                                        <img
                                                            src={`/images/mfs/${mfs.value}.svg`}
                                                            alt={mfs.label}
                                                            className="h-10 w-10 object-contain"
                                                        />
                                                        <span className="text-xs font-medium text-gray-900">{mfs.label}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Step 2: Send Money */}
                                    {selectedMfs && (
                                        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Step 2: Send Money to This Number
                                            </label>
                                            <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                                                <div>
                                                    <div className="text-xs text-slate-500">
                                                        {mfs_types.find((m) => m.value === selectedMfs)?.label} Number
                                                    </div>
                                                    <div className="mt-1 font-mono text-lg font-semibold text-slate-900">
                                                        {getReceiverNumber()}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(getReceiverNumber())}
                                                    className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-cyan-700"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                    {copied ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <div className="mt-2 text-sm font-medium text-blue-700">
                                                Amount to send: <span className="font-semibold">৳{payment.amount}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Enter Details */}
                                    {selectedMfs && (
                                        <div className="space-y-4">
                                            <label className="block text-sm font-semibold text-slate-700">
                                                Step 3: Enter Transaction Details
                                            </label>
                                            
                                            <div>
                                                <label htmlFor="sender_number" className="mb-1.5 block text-sm text-slate-700">
                                                    Your Mobile Number
                                                </label>
                                                <input
                                                    type="text"
                                                    id="sender_number"
                                                    placeholder="01XXXXXXXXX"
                                                    value={form.data.sender_number}
                                                    onChange={(e) => form.setData('sender_number', e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    required
                                                />
                                                {form.errors.sender_number && (
                                                    <p className="mt-1 text-xs text-red-600">{form.errors.sender_number}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="mfs_transaction_id" className="mb-1.5 block text-sm text-slate-700">
                                                    Transaction ID
                                                </label>
                                                <input
                                                    type="text"
                                                    id="mfs_transaction_id"
                                                    placeholder="Enter transaction ID from SMS"
                                                    value={form.data.mfs_transaction_id}
                                                    onChange={(e) => form.setData('mfs_transaction_id', e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    required
                                                />
                                                {form.errors.mfs_transaction_id && (
                                                    <p className="mt-1 text-xs text-red-600">{form.errors.mfs_transaction_id}</p>
                                                )}
                                                <p className="mt-1.5 text-xs text-slate-500">
                                                    Check your SMS or app for the transaction ID
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    {selectedMfs && (
                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {form.processing ? 'Submitting...' : 'Submit Payment'}
                                        </button>
                                    )}
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
