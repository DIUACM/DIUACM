<?php

use App\Models\ContactMessage;

it('can display the contact page', function () {
    $response = $this->get('/contact');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('contact'));
});

it('can submit a contact form with valid data', function () {
    $contactData = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'message' => 'This is a test message that is long enough to meet the minimum requirement.',
    ];

    $response = $this->post('/contact', $contactData);

    $response->assertRedirect('/contact');

    $this->assertDatabaseHas('contact_messages', $contactData);
});

it('validates required fields', function () {
    $response = $this->post('/contact', []);

    $response->assertSessionHasErrors(['name', 'email', 'message']);
});

it('validates email format', function () {
    $response = $this->post('/contact', [
        'name' => 'John Doe',
        'email' => 'invalid-email',
        'message' => 'This is a test message that is long enough to meet the minimum requirement.',
    ]);

    $response->assertSessionHasErrors(['email']);
});

it('validates minimum message length', function () {
    $response = $this->post('/contact', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'message' => 'Short',
    ]);

    $response->assertSessionHasErrors(['message']);
});

it('validates maximum field lengths', function () {
    $response = $this->post('/contact', [
        'name' => str_repeat('a', 256), // 256 characters (over the 255 limit)
        'email' => str_repeat('a', 250).'@example.com', // Over 255 limit
        'message' => str_repeat('a', 2001), // Over 2000 limit
    ]);

    $response->assertSessionHasErrors(['name', 'email', 'message']);
});

it('creates a contact message record', function () {
    $contactData = [
        'name' => 'Jane Smith',
        'email' => 'jane@example.com',
        'message' => 'This is another test message with sufficient length for validation.',
    ];

    $this->post('/contact', $contactData);

    $contactMessage = ContactMessage::where('email', 'jane@example.com')->first();

    expect($contactMessage)->not->toBeNull();
    expect($contactMessage->name)->toBe('Jane Smith');
    expect($contactMessage->email)->toBe('jane@example.com');
    expect($contactMessage->message)->toBe('This is another test message with sufficient length for validation.');
});
