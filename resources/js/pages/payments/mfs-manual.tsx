import BlankLayout from '@/layouts/blank-layout';
import { Head, useForm } from '@inertiajs/react';
import { submitMfsManual } from '@/actions/App/Http/Controllers/PaymentController';
import { ArrowLeft, Copy, Check, Smartphone } from 'lucide-react';
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
    receiver_numbers: Record<string, string>;
    instructions: Record<string, string | null>;
    mfs_types: MfsType[];
};

export default function MfsManual({ payment, payable, receiver_numbers, instructions, mfs_types }: Props) {
    const [selectedMfs, setSelectedMfs] = useState<string>(mfs_types[0]?.value || '');
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
            <Head title="Send Money" />
            <div className="min-h-screen bg-gray-100 flex justify-center sm:py-12 font-sans">
                <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-screen sm:h-auto relative">
                    
                    {/* Top Bar */}
                    <div className="bg-slate-900 text-white p-6 pb-16 relative overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <button onClick={() => window.history.back()} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <span className="font-semibold tracking-wide text-sm uppercase opacity-80">Send Money</span>
                            <div className="w-9"></div> {/* Spacer */}
                        </div>
                        <div className="relative z-10 text-center">
                            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-2">Total Amount</p>
                            <h1 className="text-4xl font-bold tracking-tight">৳{payment.amount}</h1>
                        </div>
                    </div>

                    {/* Content Container - Overlapping */}
                    <div className="flex-1 bg-gray-50 -mt-8 rounded-t-3xl px-6 pt-8 pb-6 overflow-y-auto relative z-20">
                        
                        {/* Provider Selection */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {mfs_types.map((mfs) => (
                                <button
                                    key={mfs.value}
                                    onClick={() => handleMfsChange(mfs.value)}
                                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                                        selectedMfs === mfs.value
                                            ? 'border-blue-600 bg-white shadow-md scale-105'
                                            : 'border-transparent bg-white/50 hover:bg-white hover:shadow-sm'
                                    }`}
                                >
                                    <img 
                                        src={`/images/mfs/${mfs.value}.svg`} 
                                        alt={mfs.label} 
                                        className="w-10 h-10 object-contain mb-2"
                                    />
                                    <span className={`text-xs font-bold ${selectedMfs === mfs.value ? 'text-slate-900' : 'text-slate-500'}`}>
                                        {mfs.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {selectedMfs ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Receiver Info Card */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Send Money To</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xl font-bold text-slate-900 font-mono tracking-wide">{getReceiverNumber()}</p>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">Personal Account</p>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(getReceiverNumber())}
                                            className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all active:scale-95"
                                        >
                                            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Instructions */}
                                {instructions[selectedMfs] && (
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-2">Payment Instructions</p>
                                        <div 
                                            className="text-sm text-gray-700 prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5"
                                            dangerouslySetInnerHTML={{ __html: instructions[selectedMfs] || '' }}
                                        />
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Your Wallet Number</label>
                                        <input
                                            type="text"
                                            value={form.data.sender_number}
                                            onChange={(e) => form.setData('sender_number', e.target.value)}
                                            className="w-full px-4 py-3.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm text-slate-900 font-medium placeholder:text-gray-300"
                                            placeholder="01XXXXXXXXX"
                                            required
                                        />
                                        {form.errors.sender_number && (
                                            <p className="mt-1 text-xs text-red-500 ml-1">{form.errors.sender_number}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Transaction ID</label>
                                        <input
                                            type="text"
                                            value={form.data.mfs_transaction_id}
                                            onChange={(e) => form.setData('mfs_transaction_id', e.target.value)}
                                            className="w-full px-4 py-3.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm text-slate-900 font-medium placeholder:text-gray-300 uppercase"
                                            placeholder="TrxID"
                                            required
                                        />
                                        {form.errors.mfs_transaction_id && (
                                            <p className="mt-1 text-xs text-red-500 ml-1">{form.errors.mfs_transaction_id}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all transform active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {form.processing ? 'Verifying...' : 'Confirm Payment'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400 animate-in fade-in zoom-in duration-300">
                                <p className="text-sm">Select a wallet provider above to continue</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </BlankLayout>
    );
}
