import { initiatePayment } from '@/actions/App/Http/Controllers/InternalContestRegistrationPaymentController';
import BlankLayout from '@/layouts/blank-layout';
import { Head, useForm } from '@inertiajs/react';
import { CreditCard, Smartphone, ShieldCheck, Lock } from 'lucide-react';

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
        mfs_manual_enabled: boolean;
    };
};

export default function SelectGateway({ registration, payment_config }: Props) {
    const form = useForm({ gateway: payment_config.sslcommerz_enabled ? 'sslcommerz' : 'mfs_manual' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(initiatePayment.url({ registration: registration.id }));
    };

    return (
        <BlankLayout>
            <Head title="Checkout" />
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="w-full max-w-md space-y-8">
                    
                    {/* Header Section */}
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Checkout
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Registration for <span className="font-medium text-gray-900">{registration.contest_title}</span>
                        </p>
                    </div>

                    {/* Amount Card */}
                    <div className="bg-white py-8 px-4 shadow-sm rounded-2xl border border-gray-100 relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Payable</p>
                        <div className="flex items-center justify-center text-4xl font-extrabold text-gray-900">
                            <span className="text-2xl font-medium text-gray-400 mr-1">৳</span>
                            {registration.amount}
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500 bg-gray-50 py-1.5 px-3 rounded-full w-fit mx-auto">
                            <Lock className="h-3 w-3" />
                            Secured by 256-bit encryption
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700 px-1">Select Payment Method</p>
                            
                            {/* SSLCommerz */}
                            {payment_config.sslcommerz_enabled && (
                                <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${form.data.gateway === 'sslcommerz' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                    <div className="flex items-center h-5 absolute right-4 top-1/2 -translate-y-1/2">
                                        <input
                                            type="radio"
                                            name="gateway"
                                            value="sslcommerz"
                                            checked={form.data.gateway === 'sslcommerz'}
                                            onChange={(e) => form.setData('gateway', e.target.value)}
                                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4 flex-1 pr-8">
                                        <span className="block text-sm font-bold text-gray-900">
                                            Pay Online
                                        </span>
                                        <span className="block text-xs text-gray-500 mt-0.5">
                                            Instant activation via Card, bKash, Nagad
                                        </span>
                                    </div>
                                </label>
                            )}

                            {/* MFS Manual */}
                            {payment_config.mfs_manual_enabled && (
                                <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${form.data.gateway === 'mfs_manual' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                    <div className="flex items-center h-5 absolute right-4 top-1/2 -translate-y-1/2">
                                        <input
                                            type="radio"
                                            name="gateway"
                                            value="mfs_manual"
                                            checked={form.data.gateway === 'mfs_manual'}
                                            onChange={(e) => form.setData('gateway', e.target.value)}
                                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                                        <Smartphone className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4 flex-1 pr-8">
                                        <span className="block text-sm font-bold text-gray-900">
                                            Manual Send Money
                                        </span>
                                        <span className="block text-xs text-gray-500 mt-0.5">
                                            Manually send money to our personal number
                                        </span>
                                    </div>
                                </label>
                            )}

                            {!payment_config.sslcommerz_enabled && !payment_config.mfs_manual_enabled && (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm">No payment methods are currently available</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                        >
                            {form.processing ? 'Processing...' : `Pay ৳${registration.amount}`}
                        </button>
                        
                        <p className="text-center text-xs text-gray-400">
                            By continuing, you agree to our Terms of Service
                        </p>
                    </form>
                </div>
            </div>
        </BlankLayout>
    );
}
