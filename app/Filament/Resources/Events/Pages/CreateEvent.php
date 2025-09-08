<?php

namespace App\Filament\Resources\Events\Pages;

use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;
use App\Filament\Resources\Events\EventResource;
use Carbon\Carbon;
use Filament\Actions\Action;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Http;

class CreateEvent extends CreateRecord
{
    protected static string $resource = EventResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('quickContest')
                ->label('Quick Contest')
                ->icon('heroicon-o-bolt')
                ->color('success')
                ->schema([
                    TextInput::make('contest_link')
                        ->label('Contest Link')
                        ->placeholder('https://codeforces.com/contest/1234 or https://vjudge.net/contest/567890')
                        ->url()
                        ->required()
                        ->helperText('Supported platforms: Codeforces, VJudge, AtCoder'),
                ])
                ->action(function (array $data): void {
                    $this->updateInfo($data);
                }),
        ];
    }

    public function updateInfo(array $data): void
    {
        $contest_link = $data['contest_link'];
        $parsedUrl = parse_url($contest_link);

        if (isset($parsedUrl['host'])) {
            if ($parsedUrl['host'] == 'codeforces.com') {
                $this->fetchCodeforcesContest($contest_link);
            } elseif ($parsedUrl['host'] == 'atcoder.jp') {
                $this->fetchAtCoderContest($contest_link);
            } elseif ($parsedUrl['host'] == 'vjudge.net') {
                $this->fetchVJudgeContest($contest_link);
            } else {
                Notification::make()
                    ->title('Unsupported Platform')
                    ->body('Currently supported: Codeforces, VJudge, AtCoder')
                    ->warning()
                    ->send();
            }
        } else {
            Notification::make()
                ->title('Invalid URL')
                ->body('Please provide a valid contest URL')
                ->danger()
                ->send();
        }
    }

    private function fetchCodeforcesContest(string $contest_link): void
    {
        $contest_id = explode('/', parse_url($contest_link, PHP_URL_PATH))[2] ?? null;
        if (! $contest_id) {
            Notification::make()
                ->title('Invalid Codeforces Contest URL')
                ->body('Unable to extract contest ID from the URL')
                ->warning()
                ->send();

            return;
        }

        try {
            $response = Http::timeout(10)->get('https://codeforces.com/api/contest.list');

            if (! $response->successful()) {
                throw new \Exception('API request failed');
            }

            $res = $response->json();

            if ($res['status'] == 'OK') {
                foreach ($res['result'] as $contest) {
                    if ($contest['id'] == $contest_id) {
                        $this->form->fill([
                            'title' => $contest['name'],
                            'starting_at' => Carbon::createFromTimestamp($contest['startTimeSeconds'])->toDateTimeString(),
                            'ending_at' => Carbon::createFromTimestamp($contest['startTimeSeconds'] + $contest['durationSeconds'])->toDateTimeString(),
                            'event_link' => $contest_link,
                            'type' => EventType::CONTEST,
                            'status' => VisibilityStatus::PUBLIC,
                            'participation_scope' => ParticipationScope::OPEN_FOR_ALL,
                            'open_for_attendance' => true,
                        ]);

                        Notification::make()
                            ->title('Contest Data Fetched Successfully')
                            ->body("Loaded: {$contest['name']}")
                            ->success()
                            ->send();

                        return;
                    }
                }

                Notification::make()
                    ->title('Contest Not Found')
                    ->body("Contest with ID {$contest_id} was not found")
                    ->warning()
                    ->send();
            } else {
                Notification::make()
                    ->title('API Error')
                    ->body('Codeforces API returned an error')
                    ->warning()
                    ->send();
            }
        } catch (\Exception $e) {
            Notification::make()
                ->title('Failed to Fetch Contest Data')
                ->body('Unable to connect to Codeforces API. Please try again later.')
                ->danger()
                ->send();
        }
    }

    private function fetchVJudgeContest(string $contest_link): void
    {
        try {
            $response = Http::timeout(15)->get($contest_link);

            if (! $response->successful()) {
                throw new \Exception('Failed to fetch contest page');
            }

            $html = $response->body();
            preg_match('/<textarea[^>]*name=\"dataJson\"[^>]*>(.*?)<\/textarea>/s', $html, $matches);

            if (isset($matches[1])) {
                $jsonText = $matches[1];
                $contest = json_decode($jsonText, true);

                if ($contest && isset($contest['title'], $contest['begin'], $contest['end'])) {
                    $this->form->fill([
                        'title' => html_entity_decode($contest['title']),
                        'starting_at' => Carbon::createFromTimestamp($contest['begin'] / 1000)->toDateTimeString(),
                        'ending_at' => Carbon::createFromTimestamp($contest['end'] / 1000)->toDateTimeString(),
                        'event_link' => $contest_link,
                        'type' => EventType::CONTEST,
                        'status' => VisibilityStatus::PUBLIC,
                        'participation_scope' => ParticipationScope::OPEN_FOR_ALL,
                        'open_for_attendance' => true,
                    ]);

                    Notification::make()
                        ->title('VJudge Contest Data Fetched Successfully')
                        ->body('Loaded: '.html_entity_decode($contest['title']))
                        ->success()
                        ->send();
                } else {
                    throw new \Exception('Invalid contest data format');
                }
            } else {
                Notification::make()
                    ->title('Contest Data Not Found')
                    ->body('Unable to extract contest information from the VJudge page')
                    ->warning()
                    ->send();
            }
        } catch (\Exception $e) {
            Notification::make()
                ->title('Failed to Fetch VJudge Contest')
                ->body('Unable to load contest data. Please check the URL and try again.')
                ->danger()
                ->send();
        }
    }

    private function fetchAtCoderContest(string $contest_link): void
    {
        // AtCoder doesn't have a public API, so we'll provide manual input guidance
        Notification::make()
            ->title('AtCoder Contest Detection')
            ->body('AtCoder contests need to be entered manually. Please fill in the form with contest details.')
            ->info()
            ->persistent()
            ->send();

        // You could potentially scrape AtCoder pages here if needed
        // For now, we'll just notify the user to input manually
    }
}
