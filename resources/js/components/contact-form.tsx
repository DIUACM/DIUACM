import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

export function ContactForm() {
    const { data, setData, post, processing, errors, reset } = useForm<ContactFormData>({
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
                    description: 'Thank you for your message! We\'ll get back to you within 24-48 hours.',
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-200">
                            Name *
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            placeholder="Your full name"
                            required
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-200">
                            Email *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            placeholder="your.email@example.com"
                            required
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-200">
                        Message *
                    </Label>
                    <Textarea
                        id="message"
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-vertical min-h-[120px]"
                        placeholder="Tell us about your question, feedback, or how we can help you..."
                        required
                    />
                    {errors.message && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.message}</p>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="flex items-center space-x-2 px-6 py-2 md:px-8 md:py-3 text-sm md:text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
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