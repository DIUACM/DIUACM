import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export type RepeaterOption = string | { name?: string; full_name?: string };

type ContestFormSelectProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options?: RepeaterOption[] | null;
    placeholder?: string;
    required?: boolean;
    error?: string;
    missingTitle: ReactNode;
    missingDescription: ReactNode;
    disabled?: boolean;
};

type NormalizedOption = {
    label: string;
    value: string;
    key: string;
};

function normalizeOptions(options: RepeaterOption[]): NormalizedOption[] {
    return options.map((option, index) => {
        if (typeof option === 'string') {
            return {
                label: option,
                value: option,
                key: `${option}-${index}`,
            };
        }

        const label = option.name ?? option.full_name ?? '';

        return {
            label,
            value: label,
            key: `${label || 'option'}-${index}`,
        };
    });
}

export function ContestFormSelect({
    id,
    label,
    value,
    onChange,
    options,
    placeholder = 'Select option',
    required = false,
    error,
    missingTitle,
    missingDescription,
    disabled = false,
}: ContestFormSelectProps) {
    const hasOptions = Array.isArray(options) && options.length > 0;

    if (!hasOptions) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{missingTitle}</AlertTitle>
                <AlertDescription>{missingDescription}</AlertDescription>
            </Alert>
        );
    }

    const normalizedOptions = normalizeOptions(options);

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
                <SelectTrigger className={`h-11 w-full ${error ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {normalizedOptions.map((option) => (
                        <SelectItem key={option.key} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
