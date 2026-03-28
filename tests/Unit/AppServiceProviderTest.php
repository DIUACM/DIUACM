<?php

use App\Providers\AppServiceProvider;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;

beforeEach(function (): void {
    $this->app = new Container;

    Container::setInstance($this->app);
});

afterEach(function (): void {
    Container::setInstance(null);
});

it('raises the livewire nesting depth when it is below the minimum', function (): void {
    $this->app->instance('config', new Repository([
        'livewire' => [
            'payload' => [
                'max_nesting_depth' => 10,
            ],
        ],
    ]));

    (new AppServiceProvider($this->app))->boot();

    expect(config('livewire.payload.max_nesting_depth'))->toBe(20);
});

it('preserves higher livewire nesting depth values', function (): void {
    $this->app->instance('config', new Repository([
        'livewire' => [
            'payload' => [
                'max_nesting_depth' => 30,
            ],
        ],
    ]));

    (new AppServiceProvider($this->app))->boot();

    expect(config('livewire.payload.max_nesting_depth'))->toBe(30);
});
