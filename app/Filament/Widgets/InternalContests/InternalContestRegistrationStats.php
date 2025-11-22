<?php

namespace App\Filament\Widgets\InternalContests;

use App\Models\InternalContest;
use App\Models\InternalContestRegistration;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class InternalContestRegistrationStats extends StatsOverviewWidget
{
    public ?InternalContest $record = null;

    protected function getStats(): array
    {
        if (! $this->record) {
            return [];
        }

        $registrationsQuery = InternalContestRegistration::where('internal_contest_id', $this->record->id);
        $totalRegistrations = $registrationsQuery->count();

        // Count paid registrations (those that are confirmed)
        $allRegistrations = InternalContestRegistration::where('internal_contest_id', $this->record->id)
            ->with('internalContest')
            ->get();
        $paidRegistrations = $allRegistrations->filter(fn ($reg) => $reg->isConfirmed())->count();
        $unpaidRegistrations = $totalRegistrations - $paidRegistrations;

        // Calculate percentage
        $paidPercentage = $totalRegistrations > 0 ? round(($paidRegistrations / $totalRegistrations) * 100, 1) : 0;

        // Count transport service requests
        $transportRequests = InternalContestRegistration::where('internal_contest_id', $this->record->id)
            ->where('transport_service_required', true)
            ->count();

        // Count by gender
        $maleCount = InternalContestRegistration::where('internal_contest_id', $this->record->id)
            ->where('gender', 'Male')
            ->count();
        $femaleCount = InternalContestRegistration::where('internal_contest_id', $this->record->id)
            ->where('gender', 'Female')
            ->count();

        return [
            Stat::make('Total Registrations', $totalRegistrations)
                ->description('All registrations for this contest')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('primary'),

            Stat::make('Paid Registrations', $paidRegistrations)
                ->description("{$paidPercentage}% of total registrations")
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),

            Stat::make('Unpaid Registrations', $unpaidRegistrations)
                ->description('Pending payment confirmation')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),

            Stat::make('Transport Requests', $transportRequests)
                ->description('Require transport service')
                ->descriptionIcon('heroicon-m-truck')
                ->color('info'),

            Stat::make('Male Participants', $maleCount)
                ->description("{$femaleCount} female participants")
                ->descriptionIcon('heroicon-m-users')
                ->color('gray'),

            Stat::make('Unique Sections', InternalContestRegistration::where('internal_contest_id', $this->record->id)
                ->distinct('section')
                ->count('section'))
                ->description('Different sections represented')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('purple'),
        ];
    }
}
