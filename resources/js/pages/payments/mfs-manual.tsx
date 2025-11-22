import BlankLayout from '@/layouts/blank-layout';
import { Head, useForm } from '@inertiajs/react';
import { submitMfsManual } from '@/actions/App/Http/Controllers/PaymentController';
import { ArrowLeft, Building2, Info, Loader2, Send, Shield, Smartphone } from 'lucide-react';
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
    const [selectedMfs, setSelectedMfs] = useState<string>('bkash');
    const form = useForm({
        transaction_id: payment.transaction_id,
        mfs_type: 'bkash',
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
        return receiver_numbers[selectedMfs as keyof typeof receiver_numbers] || 'N/A';
    };

    const getMfsColor = (mfsType: string) => {
        switch (mfsType) {
            case 'bkash':
                return 'from-pink-500 to-pink-600';
            case 'nagad':
                return 'from-orange-500 to-orange-600';
            case 'rocket':
                return 'from-purple-500 to-purple-600';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <BlankLayout>
            <Head title="MFS Manual Payment" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header */}
                <header className="border-b bg-white shadow-sm">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/images/diuacm-logo-rounded.webp" alt="DIU ACM" className="h-10 w-10" />
                                <div className="h-8 w-px bg-gray-300" />
                                <span className="text-sm font-medium text-gray-700">MFS Manual Payment</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
                                <Info className="h-4 w-4" />
                                <span className="hidden sm:inline">Manual Review Required</span>
                                <span className="sm:hidden">Review</span>
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
                        Back to Gateway Selection
                    </button>

                    {/* Payment Summary */}
                    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                            <h1 className="text-lg font-semibold text-white">Payment Summary</h1>
                        </div>
                        <div className="px-6 py-6">
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Contest</span>
                                    <span className="text-sm font-semibold text-gray-900">{payable.contest_title}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Name</span>
                                    <span className="text-sm font-semibold text-gray-900">{payable.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Transaction ID</span>
                                    <span className="font-mono text-sm font-semibold text-gray-900">{payment.transaction_id}</span>
                                </div>
                                <div className="mt-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4">
                                    <span className="text-base font-semibold text-gray-900">Amount to Pay</span>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-blue-600">
                                            ৳{payment.amount}
                                        </div>
                                        <div className="text-xs text-gray-500">{payment.currency}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm">
                        <div className="flex gap-4 p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                <Info className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">Payment Instructions</h3>
                                <ol className="mt-2 space-y-1 text-sm text-gray-700">
                                    <li>1. Select your MFS provider (bKash, Nagad, or Rocket)</li>
                                    <li>2. Send money to the receiver number shown below</li>
                                    <li>3. Enter your sender number and transaction ID</li>
                                    <li>4. Submit for manual verification</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* MFS Selection and Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                                <h2 className="text-lg font-semibold text-white">Select MFS Provider</h2>
                            </div>

                            <div className="p-6">
                                {/* MFS Provider Selection */}
                                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                                    {mfs_types.map((mfs) => (
                                        <label key={mfs.value} className="group relative block cursor-pointer">
                                            <input
                                                type="radio"
                                                name="mfs_type"
                                                value={mfs.value}
                                                checked={selectedMfs === mfs.value}
                                                onChange={(e) => handleMfsChange(e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div
                                                className={`flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm transition-all peer-checked:border-transparent peer-checked:shadow-md hover:border-gray-300 hover:shadow-md ${selectedMfs === mfs.value ? `bg-gradient-to-br ${getMfsColor(mfs.value)} text-white` : ''}`}
                                            >
                                                <div className="text-center">
                                                    <Smartphone className="mx-auto mb-2 h-8 w-8" />
                                                    <div className="font-bold">{mfs.label}</div>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Receiver Number Display */}
                                <div className="mb-6 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-5">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                        <div className="flex-1">
                                            <div className="mb-1 text-sm font-medium text-blue-900">Send Money To:</div>
                                            <div className="font-mono text-2xl font-bold text-blue-700">{getReceiverNumber()}</div>
                                            <div className="mt-1 text-sm text-blue-600">
                                                Amount: ৳{payment.amount} via {mfs_types.find((m) => m.value === selectedMfs)?.label}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="sender_number" className="mb-2 block text-sm font-semibold text-gray-700">
                                            Your Sender Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="sender_number"
                                            placeholder="01XXXXXXXXX"
                                            value={form.data.sender_number}
                                            onChange={(e) => form.setData('sender_number', e.target.value)}
                                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono transition-colors focus:border-blue-500 focus:outline-none"
                                            required
                                        />
                                        {form.errors.sender_number && (
                                            <p className="mt-1 text-sm text-red-600">{form.errors.sender_number}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="mfs_transaction_id" className="mb-2 block text-sm font-semibold text-gray-700">
                                            MFS Transaction ID <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="mfs_transaction_id"
                                            placeholder="Enter the transaction ID from your MFS app"
                                            value={form.data.mfs_transaction_id}
                                            onChange={(e) => form.setData('mfs_transaction_id', e.target.value)}
                                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono transition-colors focus:border-blue-500 focus:outline-none"
                                            required
                                        />
                                        {form.errors.mfs_transaction_id && (
                                            <p className="mt-1 text-sm text-red-600">{form.errors.mfs_transaction_id}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            You can find this in your MFS transaction history or confirmation SMS
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    <span>Submit for Manual Review</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 overflow-hidden rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
                        <div className="flex gap-4 p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                                <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">Manual Verification Process</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
                                    After submission, our team will manually verify your payment within 24-48 hours. You will receive a notification
                                    once your payment is verified and approved.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-gray-500">© {new Date().getFullYear()} DIU ACM. All rights reserved.</p>
                        <p className="mt-2 text-sm text-gray-600">
                            Need help?{' '}
                            <a href="/contact" className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </BlankLayout>
    );
}
