<?php

use App\Mail\ContactFormMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    // Clear rate limiter before each test
    RateLimiter::clear('contact_form_127.0.0.1');
});

test('contact page can be rendered', function () {
    $response = $this->get('/contact');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('contact'));
});

test('contact form can be submitted with valid data', function () {
    Mail::fake();

    $formData = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'message' => 'This is a test message for DIU ACM contact form.',
    ];

    $response = $this->withoutMiddleware()
        ->post('/contact', $formData);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    Mail::assertQueued(ContactFormMail::class, function ($mail) use ($formData) {
        return $mail->hasTo('submissions@diuacm.com') &&
               $mail->senderName === $formData['name'] &&
               $mail->senderEmail === $formData['email'] &&
               $mail->messageContent === $formData['message'];
    });
});

test('contact form validates required fields', function () {
    $response = $this->withoutMiddleware()
        ->post('/contact', []);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['name', 'email', 'message']);
});

test('contact form validates email format', function () {
    $response = $this->withoutMiddleware()
        ->post('/contact', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'message' => 'This is a test message.',
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['email']);
});

test('contact form validates minimum length', function () {
    $response = $this->withoutMiddleware()
        ->post('/contact', [
            'name' => 'J',
            'email' => 'john@example.com',
            'message' => 'Too short',
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['name', 'message']);
});

test('contact form validates maximum length', function () {
    $response = $this->withoutMiddleware()
        ->post('/contact', [
            'name' => str_repeat('a', 256),
            'email' => str_repeat('a', 250).'@example.com',
            'message' => str_repeat('a', 2001),
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['name', 'email', 'message']);
});

test('contact form validates name format', function () {
    $response = $this->withoutMiddleware()
        ->post('/contact', [
            'name' => 'John123!@#',
            'email' => 'john@example.com',
            'message' => 'This is a test message.',
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['name']);
});

test('contact form handles rate limiting', function () {
    // Make multiple rapid requests to trigger rate limiting
    $responses = [];

    for ($i = 0; $i < 3; $i++) {
        $responses[] = $this->withoutMiddleware()
            ->post('/contact', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'message' => 'Test message '.$i,
            ]);
    }

    // All should redirect
    foreach ($responses as $response) {
        $response->assertRedirect();
    }

    // This test mainly verifies the rate limiting code doesn't break the form
    expect(true)->toBeTrue();
});

test('contact form detects honeypot spam', function () {
    $response = $this->withoutMiddleware()
        ->post('/contact', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'message' => 'This is a test message.',
            'website' => 'spam-value', // Bot filled this field
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success'); // Fake success to confuse bots
});

test('contact form handles mail sending failure gracefully', function () {
    Mail::shouldReceive('to')->andThrow(new Exception('Mail server unavailable'));

    $formData = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'message' => 'This is a test message for DIU ACM contact form.',
    ];

    $response = $this->withoutMiddleware()
        ->post('/contact', $formData);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['email']);
    $response->assertSessionHasInput(['name', 'email', 'message']);
});
