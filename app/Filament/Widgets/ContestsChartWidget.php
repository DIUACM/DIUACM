<?php

namespace App\Filament\Widgets;

use App\Models\Contest;
use Carbon\Carbon;
use Filament\Widgets\ChartWidget;

class ContestsChartWidget extends ChartWidget
{
    protected ?string $heading = 'Contest Activity';

    protected string|int|array $columnSpan = 'full';

    protected function getData(): array
    {
        // Get contest data for the last 6 months
        $data = collect(range(5, 0))->map(function ($monthsBack) {
            $date = Carbon::now()->subMonths($monthsBack);
            $count = Contest::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();

            return [
                'month' => $date->format('M Y'),
                'count' => $count,
            ];
        });

        return [
            'datasets' => [
                [
                    'label' => 'Contests Created',
                    'data' => $data->pluck('count')->toArray(),
                    'borderColor' => 'rgb(59, 130, 246)',
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                    'fill' => true,
                ],
            ],
            'labels' => $data->pluck('month')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => true,
                ],
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                ],
            ],
        ];
    }
}
