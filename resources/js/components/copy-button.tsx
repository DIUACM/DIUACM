import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface CopyButtonProps {
    text: string;
    platform: string;
    className?: string;
}

export function CopyButton({ text, platform, className = '' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Button variant="ghost" size="icon" onClick={handleCopy} className={`h-5 w-5 ${className}`} title={`Copy ${platform} handle`}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
    );
}
