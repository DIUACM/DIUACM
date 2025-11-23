<?php

namespace App\Filament\ContestAdmin\Resources\Payments\Pages;

use App\Filament\ContestAdmin\Resources\Payments\PaymentResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePayment extends CreateRecord
{
    protected static string $resource = PaymentResource::class;
}
