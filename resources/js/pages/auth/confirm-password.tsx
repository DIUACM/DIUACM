import ConfirmablePasswordController from '@/actions/App/Http/Controllers/Auth/ConfirmablePasswordController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/layouts/main-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function ConfirmPassword() {
    return (
        <MainLayout title="Confirm password">
            <Head title="Confirm password" />

            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Confirm your password</h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">This is a secure area of the application. Please confirm your password before continuing.</p>
                    </div>

                    <Form {...ConfirmablePasswordController.store.form()} resetOnSuccess={['password']}>
                        {({ processing, errors }) => (
                            <div className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" name="password" placeholder="Password" autoComplete="current-password" autoFocus />

                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center">
                                    <Button className="w-full" disabled={processing}>
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
