import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Loader2, Send } from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

export function ContactForm() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        message: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/contact', {
            onSuccess: () => {
                reset();
                toast.success('Message sent successfully!', {
                    description: "Thank you for your message! We'll get back to you within 24-48 hours.",
                    duration: 4000,
                });
            },
            onError: (errors) => {
                // Show error toast for validation or server errors
                if (Object.keys(errors).length > 0) {
                    toast.error('Please check your form', {
                        description: 'There are some validation errors that need to be fixed.',
                        duration: 5000,
                    });
                } else {
                    toast.error('Something went wrong', {
                        description: 'Please try again or contact us directly.',
                        duration: 5000,
                    });
                }
            },
        });
    };

    return (
        <div>
            <form onSubmit={submit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-900 md:text-base dark:text-slate-200">
                            Name *
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 md:px-4 md:py-3 md:text-base dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 dark:focus:ring-blue-400"
                            placeholder="Your full name"
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-900 md:text-base dark:text-slate-200">
                            Email *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 md:px-4 md:py-3 md:text-base dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 dark:focus:ring-blue-400"
                            placeholder="your.email@example.com"
                            required
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium text-slate-900 md:text-base dark:text-slate-200">
                        Message *
                    </Label>
                    <Textarea
                        id="message"
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        rows={6}
                        className="resize-vertical min-h-[120px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 md:px-4 md:py-3 md:text-base dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 dark:focus:ring-blue-400"
                        placeholder="Tell us about your question, feedback, or how we can help you..."
                        required
                    />
                    {errors.message && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>}
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:px-8 md:py-3 md:text-base dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 md:h-5 md:w-5" />
                                <span>Send Message</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
