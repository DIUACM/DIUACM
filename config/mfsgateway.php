<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default MFS Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration is used as fallback when MFS gateway details are not
    | available from the specific payable model (e.g., contest configuration).
    |
    */

    'default_receiver_numbers' => [
        'bkash' => env('MFS_BKASH_NUMBER', null),
        'rocket' => env('MFS_ROCKET_NUMBER', null),
        'nagad' => env('MFS_NAGAD_NUMBER', null),
    ],

    'default_instructions' => [
        'bkash' => env('MFS_BKASH_INSTRUCTION', 'Send money via bKash and submit the transaction ID.'),
        'rocket' => env('MFS_ROCKET_INSTRUCTION', 'Send money via Rocket and submit the transaction ID.'),
        'nagad' => env('MFS_NAGAD_INSTRUCTION', 'Send money via Nagad and submit the transaction ID.'),
    ],

    /*
    |--------------------------------------------------------------------------
    | MFS Gateway Enabled Status
    |--------------------------------------------------------------------------
    |
    | These flags determine which MFS gateways are enabled by default.
    | Individual payable models can override these settings.
    |
    */

    'enabled' => [
        'bkash' => env('MFS_BKASH_ENABLED', false),
        'rocket' => env('MFS_ROCKET_ENABLED', false),
        'nagad' => env('MFS_NAGAD_ENABLED', false),
    ],

];
