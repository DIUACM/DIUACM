<?php

namespace App\Filament\Widgets;

use App\Models\Contest;
use App\Models\Event;
use App\Models\Team;
use App\Models\Tracker;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseStatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseStatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Users', User::count())
                ->description('Registered members')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'),

            Stat::make('Total Contests', Contest::count())
                ->description('Contest events')
                ->descriptionIcon('heroicon-m-trophy')
                ->color('success'),

            Stat::make('Teams', Team::count())
                ->description('Registered teams')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('info'),

            Stat::make('Events', Event::count())
                ->description('Total events')
                ->descriptionIcon('heroicon-m-calendar-days')
                ->color('warning'),

            Stat::make('Trackers', Tracker::count())
                ->description('Performance trackers')
                ->descriptionIcon('heroicon-m-chart-bar-square')
                ->color('gray'),

            Stat::make('Recent Users', User::where('created_at', '>=', now()->subDays(30))->count())
                ->description('New this month')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('primary'),
        ];
    }
}
