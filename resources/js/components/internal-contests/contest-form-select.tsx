import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type ContestFormSelectProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options?: string[] | null;
    placeholder?: string;
    required?: boolean;
    error?: string;
    missingTitle: ReactNode;
    missingDescription: ReactNode;
    disabled?: boolean;
};

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
                    {options.map((option, index) => (
                        <SelectItem key={`${option}-${index}`} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
