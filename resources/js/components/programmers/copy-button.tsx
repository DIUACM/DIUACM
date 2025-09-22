import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type CopyButtonProps = {
    text: string;
    platform: string;
    className?: string;
};

export function CopyButton({ text, platform, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors",
                className
            )}
            title={`Copy ${platform} handle`}
        >
            {copied ? (
                <Check className="w-3 h-3" />
            ) : (
                <Copy className="w-3 h-3" />
            )}
        </button>
    );
}