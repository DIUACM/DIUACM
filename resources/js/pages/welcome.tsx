import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main-layout';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BookOpen,
    CheckCircle2,
    Code2,
    FileCode2,
    Globe,
    Laptop,
    MessageSquare,
    Target,
    Terminal,
    Trophy,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Simple local time badge component
function LocalTime() {
    const [now, setNow] = useState<string>(new Date().toLocaleTimeString());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000 * 60);
        return () => clearInterval(id);
    }, []);
    return <span>{now}</span>;
}

// Data (inspired by the provided Next.js project)
const rules = {
    contests: [
        'No external website usage during contests except the platform',
        'Hard copy templates are allowed with specified limits',
        'Code sharing must be enabled on Vjudge contests',
        'Any form of plagiarism results in permanent ban',
    ],
    lab: [
        'Lab access requires regular ACM programmer status',
        'Maintain respectful behavior towards seniors and teachers',
        'Avoid disturbing others during practice sessions',
        'Keep the lab clean and organized',
    ],
    online: [
        'Forum usage prohibited during online contests',
        'Basic resource websites (GFG, CPAlgo) are allowed',
        'Maintain code submission history',
        'Report technical issues immediately',
    ],
} as const;

const programs = [
    {
        title: 'Green Sheet Program',
        description: 'Master programming basics with our curated problem set covering fundamental concepts. Solve 60% to qualify for Blue Sheet.',
        icon: FileCode2,
        color: 'from-green-500 to-emerald-500',
        link: '/about', // adjusted to existing route
    },
    {
        title: 'Blue Sheet Advanced',
        description: '1000+ carefully selected problems for advanced programmers. Regular updates based on top solver performance.',
        icon: Award,
        color: 'from-blue-500 to-indigo-500',
        link: '/about', // adjusted to existing route
    },
    {
        title: 'ACM Advanced Camp',
        description: 'Intensive training program for TOPC top performers with mentoring from seniors and alumni.',
        icon: Target,
        color: 'from-purple-500 to-pink-500',
        link: '/about', // adjusted to existing route
    },
] as const;

const competitions = [
    {
        title: 'Take-Off Programming Contest',
        description: 'Semester-based contest series for beginners with mock, preliminary, and main rounds.',
        phases: ['Mock Round', 'Preliminary', 'Main Contest'],
        eligibility: '1st semester students enrolled in Programming & Problem Solving',
    },
    {
        title: 'Unlock The Algorithm',
        description: 'Advanced algorithmic contest focusing on data structures and algorithms.',
        phases: ['Mock Round', 'Preliminary', 'Final Round'],
        eligibility: 'Students enrolled in Algorithms course',
    },
    {
        title: 'DIU ACM Cup',
        description: 'Tournament-style competition to crown the best programmer each semester.',
        phases: ['Group Stage', 'Knockouts', 'Finals'],
        eligibility: 'Top 32 regular programmers',
    },
] as const;

const features = [
    {
        title: 'Structured Learning',
        description: 'Follow our carefully designed learning tracks to build skills progressively from basics to advanced topics.',
        icon: BookOpen,
    },
    {
        title: 'Regular Contests',
        description: "Weekly contests help you apply what you've learned and track your improvement over time.",
        icon: Trophy,
    },
    {
        title: 'Expert Mentorship',
        description: 'Get guidance from experienced seniors and alumni who have excelled in competitive programming.',
        icon: Users,
    },
] as const;

const steps = [
    {
        title: 'Master the Green Sheet',
        description: 'Complete our curated set of beginner-level problems. Aim for 60% completion to become eligible for the Blue Sheet.',
        icon: BookOpen,
        color: 'text-green-500',
    },
    {
        title: 'Join Regular Contests',
        description:
            'Participate in our weekly onsite DIU Individual Contest every Friday and track your progress through our Individual Contest Tracker.',
        icon: Code2,
        color: 'text-blue-500',
    },
    {
        title: 'Visit ACM Lab',
        description: 'Come to KT-310 to meet the community and get help with your competitive programming journey.',
        icon: Users,
        color: 'text-purple-500',
    },
] as const;

const stats = [
    {
        value: '100+',
        label: 'Weekly Problems',
        icon: Code2,
        color: 'from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600',
    },
    {
        value: '20+',
        label: 'Annual Contests',
        icon: Trophy,
        color: 'from-cyan-500 to-cyan-700 dark:from-cyan-400 dark:to-cyan-600',
    },
    {
        value: '50+',
        label: 'ICPC Participants',
        icon: Award,
        color: 'from-violet-500 to-violet-700 dark:from-violet-400 dark:to-violet-600',
    },
    {
        value: '200+',
        label: 'Active Members',
        icon: Users,
        color: 'from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-600',
    },
] as const;

function HeroSection() {
    const currentUser = 'diuacm';
    return (
        <section className="relative overflow-hidden py-16 md:py-28">
            <div className="relative z-10 container mx-auto px-4">
                <div className="grid grid-cols-1 items-center justify-between gap-10 md:grid-cols-2">
                    <div>
                        <div className="mb-6 inline-flex items-center">
                            <Badge className="mr-2 bg-blue-100 px-3.5 py-1.5 text-sm text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800">
                                DIU ACM
                            </Badge>
                            <div className="h-px w-10 bg-slate-300 dark:bg-slate-700"></div>
                            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Competitive Programming Hub</span>
                        </div>

                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl dark:text-white">
                            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                                Learn & Compete
                            </span>{' '}
                            <span className="relative whitespace-nowrap">
                                in Programming
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 418 42"
                                    className="absolute left-0 -mt-1 -ml-1 h-[0.58em] w-full fill-blue-400/40 dark:fill-blue-300/20"
                                    preserveAspectRatio="none"
                                >
                                    <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path>
                                </svg>
                            </span>
                            <span className="mt-2 block">Contests</span>
                        </h1>

                        <p className="mb-8 text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-300">
                            Join DIU ACM to excel in competitive programming through structured learning paths, regular contests, and expert
                            mentorship. Home of ICPC aspirants at Daffodil International University.
                        </p>

                        <div className="mb-8 flex flex-wrap gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="min-w-[200px] rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                            >
                                <Link href="/about" prefetch="hover">
                                    <Trophy className="mr-2 h-4 w-4" />
                                    Join Contests
                                </Link>
                            </Button>

                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="min-w-[200px] rounded-full border border-slate-200 bg-white/80 px-8 font-medium text-blue-600 shadow-md backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-white hover:text-blue-700 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/80 dark:text-blue-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                            >
                                <Link href="/about" prefetch="hover">
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Learn More
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right Side - Code editor style card */}
                    <div className="group relative hidden min-w-0 flex-1 md:block">
                        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-30 dark:opacity-40 dark:group-hover:opacity-50"></div>
                        <div className="absolute -top-2 -left-2 h-16 w-16 animate-pulse rounded-full bg-blue-500/20 blur-xl duration-5000 dark:bg-blue-400/20"></div>
                        <div className="absolute -right-2 -bottom-2 h-16 w-16 animate-pulse rounded-full bg-purple-500/20 blur-xl duration-7000 dark:bg-purple-400/20"></div>

                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur-sm transition-colors duration-300 dark:border-slate-800/50 dark:bg-slate-900/90">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/90 p-3 transition-colors duration-300 sm:p-4 dark:border-slate-700/70 dark:bg-slate-800/90">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500 shadow-inner" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-inner" />
                                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-inner" />
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-slate-300">
                                    <Code2 className="h-4 w-4" />
                                    main.cpp
                                </div>
                                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                    <div className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                    <span>Ready</span>
                                </div>
                            </div>

                            <div className="space-y-4 overflow-x-auto bg-slate-50/70 p-4 text-slate-800 transition-colors duration-300 sm:p-5 dark:bg-slate-900/80 dark:text-slate-200">
                                <pre className="font-mono text-xs leading-6 font-medium sm:text-sm">
                                    <code>
                                        <span className="text-blue-600 dark:text-blue-400">#include </span>
                                        <span className="text-slate-500 dark:text-slate-400">&lt;</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">bits/stdc++.h</span>
                                        <span className="text-slate-500 dark:text-slate-400">&gt;</span>
                                        {`\n`}
                                        <span className="text-purple-600 dark:text-purple-400">using namespace </span>
                                        <span className="text-blue-600 dark:text-blue-400">std</span>
                                        <span className="text-slate-600 dark:text-slate-300">;</span>
                                        {`\n`}
                                        <span className="text-pink-600 dark:text-pink-400">#define </span>
                                        <span className="text-cyan-600 dark:text-cyan-400">ll </span>
                                        <span className="text-blue-600 dark:text-blue-400">long long</span>
                                        {`\n\n`}
                                        <span className="text-blue-600 dark:text-blue-400">int</span>
                                        <span className="text-slate-600 dark:text-slate-300"> </span>
                                        <span className="text-yellow-600 dark:text-yellow-400">main</span>
                                        <span className="text-slate-600 dark:text-slate-300">() {'{'}</span>
                                        {`\n    `}
                                        <span className="text-blue-600 dark:text-blue-400">ios_base</span>
                                        <span className="text-slate-600 dark:text-slate-300">::</span>
                                        <span className="text-yellow-600 dark:text-yellow-400">sync_with_stdio</span>
                                        <span className="text-slate-600 dark:text-slate-300">(</span>
                                        <span className="text-orange-600 dark:text-orange-400">false</span>
                                        <span className="text-slate-600 dark:text-slate-300">);</span>
                                        {`\n    `}
                                        <span className="text-blue-600 dark:text-blue-400">cin</span>
                                        <span className="text-slate-600 dark:text-slate-300">.</span>
                                        <span className="text-yellow-600 dark:text-yellow-400">tie</span>
                                        <span className="text-slate-600 dark:text-slate-300">(</span>
                                        <span className="text-orange-600 dark:text-orange-400">nullptr</span>
                                        <span className="text-slate-600 dark:text-slate-300">);</span>
                                        {`\n\n    `}
                                        <span className="text-blue-600 dark:text-blue-400">cout</span>
                                        <span className="text-slate-600 dark:text-slate-300"> &lt;&lt; </span>
                                        <span className="text-amber-600 dark:text-amber-400">"Welcome to DIUACM!"</span>
                                        <span className="text-slate-600 dark:text-slate-300"> &lt;&lt; </span>
                                        <span className="text-blue-600 dark:text-blue-400">endl</span>
                                        <span className="text-slate-600 dark:text-slate-300">;</span>
                                        {`\n    `}
                                        <span className="text-pink-600 dark:text-pink-400">return</span>
                                        <span className="text-slate-600 dark:text-slate-300"> </span>
                                        <span className="text-orange-600 dark:text-orange-400">0</span>
                                        <span className="text-slate-600 dark:text-slate-300">;</span>
                                        {`\n`}
                                        <span className="text-slate-600 dark:text-slate-300">{'}'}</span>
                                    </code>
                                </pre>
                                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 transition-colors duration-300 dark:border-slate-700/50 dark:text-slate-400">
                                    <div className="flex items-center gap-2 font-mono">
                                        <Terminal className="h-3.5 w-3.5" />
                                        <span>@{currentUser}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="rounded bg-slate-200/70 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                                            <LocalTime />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Welcome() {
    return (
        <MainLayout title="Home">
            {/* Hero */}
            <HeroSection />

            {/* How It Works */}
            <section className="bg-gradient-to-b from-white to-slate-50 py-16 dark:from-slate-900 dark:to-slate-950">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">How DIU ACM Works</h2>
                        <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300"></div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className="absolute -top-4 -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white dark:bg-blue-700">
                                    {index + 1}
                                </div>
                                <div className="mb-4 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                        <step.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                                    <p className="mt-2 text-slate-600 dark:text-slate-300">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Programs */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">Learning Programs</h2>
                        <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300"></div>
                        <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                            Structured paths to excellence in competitive programming
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {programs.map((program, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 bg-gradient-to-r dark:bg-blue-900/30">
                                    <program.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">{program.title}</h3>
                                <p className="mb-4 text-slate-600 dark:text-slate-300">{program.description}</p>
                                <Button
                                    asChild
                                    variant="link"
                                    className="flex items-center gap-1 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    <Link href={program.link}>
                                        View details <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-slate-50 py-16 dark:bg-slate-900/50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div
                                    className={`absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-20`}
                                ></div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${stat.color} mb-4 flex items-center justify-center`}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Competitions */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">Our Competitions</h2>
                        <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300"></div>
                        <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                            Regular contests to test and improve your skills
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {competitions.map((competition, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                            >
                                <h3 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">{competition.title}</h3>
                                <p className="mb-6 text-slate-600 dark:text-slate-300">{competition.description}</p>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Phases</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {competition.phases.map((phase, i) => (
                                                <span
                                                    key={i}
                                                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                                >
                                                    {phase}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Eligibility</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{competition.eligibility}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-slate-50 py-16 dark:bg-slate-900/50">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">What You&apos;ll Get</h2>
                        <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300"></div>
                        <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                            Empowering your competitive programming journey with comprehensive resources
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rules */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">Rules &amp; Guidelines</h2>
                        <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300"></div>
                        <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                            Essential rules to maintain the integrity of our competitive programming community
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Contest Rules</h3>
                            </div>
                            <ul className="space-y-4">
                                {rules.contests.map((rule, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                                        <span className="text-slate-600 dark:text-slate-400">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Laptop className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Lab Rules</h3>
                            </div>
                            <ul className="space-y-4">
                                {rules.lab.map((rule, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                                        <span className="text-slate-600 dark:text-slate-400">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Online Contest Rules</h3>
                            </div>
                            <ul className="space-y-4">
                                {rules.online.map((rule, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                                        <span className="text-slate-600 dark:text-slate-400">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative overflow-hidden py-20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10" />

                <div className="relative container mx-auto px-4">
                    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl md:p-10 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-8 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">Join DIU ACM Community</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300">
                                We don&apos;t have a traditional membership system. Your passion for competitive programming and regular participation
                                makes you a part of our community.
                            </p>
                        </div>

                        <div className="flex flex-col justify-center gap-6 md:flex-row">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
                            >
                                <a href="https://t.me/+X94KLytY-Kk5NzU9" target="_blank" rel="noopener noreferrer">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Join Telegram
                                </a>
                            </Button>

                            <Button
                                asChild
                                size="lg"
                                className="rounded-full border border-slate-200 bg-white px-8 font-medium text-blue-600 shadow-md transition-all hover:border-blue-200 hover:bg-slate-50 hover:text-blue-700 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-blue-300"
                            >
                                <Link href="/contact" prefetch="hover">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Contact Us
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
