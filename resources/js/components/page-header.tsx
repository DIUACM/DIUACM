interface PageHeaderProps {
    title: string;
    gradientText: string;
    description: string;
}

export default function PageHeader({ title, gradientText, description }: PageHeaderProps) {
    return (
        <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                {title}{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                    {gradientText}
                </span>
            </h1>
            <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"></div>
            <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">{description}</p>
        </div>
    );
}
