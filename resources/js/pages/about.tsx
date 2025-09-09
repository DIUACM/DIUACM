import { Head } from '@inertiajs/react';
import { Trophy, Book, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';

export default function About() {
    return (
        <MainLayout title="About">
            <div className="container mx-auto px-4 py-16">
                {/* Header section */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                        About{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                            DIU ACM
                        </span>
                    </h1>
                    <div className="mx-auto w-20 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-6"></div>
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                        A dedicated wing under DIU CPC, fostering a thriving competitive
                        programming culture
                    </p>
                </div>

                {/* Introduction section */}
                <Card className="mb-10 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                    <CardContent className="p-8">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-4">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Who We Are
                            </h2>
                        </div>

                        <div className="space-y-4 text-slate-600 dark:text-slate-300">
                            <p>
                                DIU ACM is a dedicated wing under the DIU CPC, focused on
                                fostering a thriving competitive programming culture within the
                                university. Our community comprises passionate problem solvers and
                                coding enthusiasts who regularly participate in programming
                                contests, take classes from expert trainers, and mentor selected
                                juniors in their journey to mastering competitive programming.
                            </p>
                            <p>
                                At DIU ACM, we believe in learning through practice and teamwork.
                                We&apos;re committed to building a community where programming skills
                                are nurtured, challenged, and celebrated.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Activities and Mission section */}
                <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                        <CardContent className="p-8 h-full">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-3">
                                    <Book className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Our Activities
                                </h2>
                            </div>

                            <div className="space-y-4 text-slate-600 dark:text-slate-300">
                                <p>
                                    Our members actively engage in various activities, including:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <span className="font-medium">Regular Contests:</span> We
                                        organize and participate in coding contests to sharpen our
                                        skills and compete at national and international levels.
                                    </li>
                                    <li>
                                        <span className="font-medium">Trainer&apos;s Classes:</span> Senior
                                        competitive programmers and invited trainers conduct classes,
                                        covering advanced topics to help members improve their
                                        algorithmic and problem-solving abilities.
                                    </li>
                                    <li>
                                        <span className="font-medium">Junior Mentorship:</span> Our
                                        experienced members take the responsibility of guiding and
                                        teaching promising juniors, ensuring the continuity of
                                        excellence in the community.
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                        <CardContent className="p-8 h-full">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center mr-3">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Our Mission
                                </h2>
                            </div>

                            <div className="space-y-4 text-slate-600 dark:text-slate-300">
                                <p>
                                    This website serves as a central platform to manage and
                                    streamline our activities, including tracking attendance for
                                    classes, contests, and events. As we grow, we plan to introduce
                                    new features such as score calculation, individual progress
                                    tracking, and more, to better support the development of our
                                    members.
                                </p>
                                <p>
                                    Together, we strive to make DIU ACM a hub of excellence in
                                    competitive programming at Daffodil International University.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Join Us section */}
                <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 text-center">
                            Join Us
                        </h2>

                        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-center max-w-2xl mx-auto">
                            <p>
                                Whether you&apos;re an experienced competitive programmer or just
                                starting your journey, DIU ACM welcomes you. Join our community to
                                learn, grow, and excel in the world of competitive programming.
                            </p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">
                                The DIU ACM Team
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
