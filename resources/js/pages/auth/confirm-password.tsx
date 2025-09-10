import ConfirmablePasswordController from '@/actions/App/Http/Controllers/Auth/ConfirmablePasswordController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import MainLayout from '@/layouts/main-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function ConfirmPassword() {
    return (
        <MainLayout title="Confirm password">
            <Head title="Confirm password" />

            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-input bg-card p-6 shadow-md">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-card-foreground">Confirm your password</h1>
                        <p className="mt-1 text-sm text-muted-foreground">This is a secure area of the application. Please confirm your password before continuing.</p>
                    </div>

                    <Form {...ConfirmablePasswordController.store.form()} resetOnSuccess={['password']}>
                        {({ processing, errors }) => (
                            <div className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput id="password" name="password" placeholder="Password" autoComplete="current-password" autoFocus />

                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center">
                                    <Button 
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600" 
                                        disabled={processing}
                                    >
                                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        Confirm password
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </MainLayout>
    );
}
