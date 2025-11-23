<?php

namespace App\Filament\Widgets\InternalContests;

use App\Models\InternalContest;
use App\Models\InternalContestRegistration;
use Filament\Widgets\ChartWidget;

class InternalContestSectionChart extends ChartWidget
{
    public ?InternalContest $record = null;

    protected int|string|array $columnSpan = 'full';

    protected ?string $heading = 'Registrations by Section';

    protected ?string $description = 'Breakdown of paid and unpaid registrations per section';

    protected function getData(): array
    {
        if (! $this->record) {
            return [
                'datasets' => [],
                'labels' => [],
            ];
        }

        // Get all registrations grouped by section
        $registrationsBySection = InternalContestRegistration::where('internal_contest_id', $this->record->id)
            ->with('internalContest')
            ->get()
            ->groupBy('section');

        $sections = [];
        $paidData = [];
        $unpaidData = [];

        foreach ($registrationsBySection as $section => $registrations) {
            $sections[] = $section ?: 'Not Specified';

            $paidCount = $registrations->filter(fn ($reg) => $reg->isConfirmed())->count();
            $unpaidCount = $registrations->count() - $paidCount;

            $paidData[] = $paidCount;
            $unpaidData[] = $unpaidCount;
        }

        return [
            'datasets' => [
                [
                    'label' => 'Paid',
                    'data' => $paidData,
                    'backgroundColor' => 'rgba(34, 197, 94, 0.7)',
                    'borderColor' => 'rgba(34, 197, 94, 1)',
                ],
                [
                    'label' => 'Unpaid',
                    'data' => $unpaidData,
                    'backgroundColor' => 'rgba(251, 146, 60, 0.7)',
                    'borderColor' => 'rgba(251, 146, 60, 1)',
                ],
            ],
            'labels' => $sections,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                    'ticks' => [
                        'stepSize' => 1,
                    ],
                ],
            ],
            'plugins' => [
                'legend' => [
                    'display' => true,
                ],
            ],
        ];
    }
}
