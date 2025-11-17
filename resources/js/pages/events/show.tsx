
import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import events from '@/routes/events';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';


export default function EventDetailsPage() {
   

    return (
        <MainLayout>
          
            <section className="container mx-auto px-4 py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link href={events.index.url()}>
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Button>
                    </Link>
                </div>

               

            </section>
        </MainLayout>
    );
}
