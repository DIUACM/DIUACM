import { Button } from '@/components/ui/button';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { type ComponentProps, type ReactElement } from 'react';

const APPEARANCE_ORDER: Appearance[] = ['light', 'dark', 'system'];

const LABELS: Record<Appearance, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
};

const ICONS: Record<Appearance, ReactElement> = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    system: <Monitor className="h-5 w-5" />,
};
type AppearanceToggleButtonProps = Omit<ComponentProps<typeof Button>, 'size' | 'variant' | 'type' | 'onClick'>;

export default function AppearanceToggleButton({ className, ...props }: AppearanceToggleButtonProps) {
    const { appearance, updateAppearance } = useAppearance();

    const advanceAppearance = () => {
        const index = APPEARANCE_ORDER.indexOf(appearance);
        const next = APPEARANCE_ORDER[(index + 1) % APPEARANCE_ORDER.length] ?? 'system';

        updateAppearance(next);
    };

    const currentLabel = LABELS[appearance];
    const buttonTitle = `Switch theme (current: ${currentLabel})`;

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9 rounded-md', className)}
            onClick={advanceAppearance}
            title={buttonTitle}
            aria-label={`Toggle theme (current: ${currentLabel})`}
            {...props}
        >
            {ICONS[appearance] ?? ICONS.system}
        </Button>
    );
}
