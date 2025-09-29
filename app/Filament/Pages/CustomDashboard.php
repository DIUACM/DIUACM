<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\ContestsChartWidget;
use App\Filament\Widgets\RecentActivitiesWidget;
use App\Filament\Widgets\StatsOverviewWidget;
use BackedEnum;
use Filament\Pages\Dashboard;
use Filament\Support\Icons\Heroicon;

class CustomDashboard extends Dashboard
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChartPie;

    protected static ?string $title = 'DIUACM Dashboard';

    protected static ?string $navigationLabel = 'Dashboard';

    protected static ?int $navigationSort = -2;

    protected static string $routePath = '/';

    public function getWidgets(): array
    {
        return [
            StatsOverviewWidget::class,
            ContestsChartWidget::class,
            RecentActivitiesWidget::class,
        ];
    }

    public function getColumns(): int|array
    {
        return [
            'md' => 2,
            'xl' => 3,
        ];
    }
}
