<?php

use App\Mail\ContactFormMail;
use Illuminate\Support\Facades\Mail;

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

    $response = $this->post('/contact', $formData);

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
    $response = $this->post('/contact', []);

    $response->assertSessionHasErrors(['name', 'email', 'message']);
});

test('contact form validates email format', function () {
    $response = $this->post('/contact', [
        'name' => 'John Doe',
        'email' => 'invalid-email',
        'message' => 'This is a test message.',
    ]);

    $response->assertSessionHasErrors(['email']);
});

test('contact form validates minimum length', function () {
    $response = $this->post('/contact', [
        'name' => 'J',
        'email' => 'john@example.com',
        'message' => 'Too short',
    ]);

    $response->assertSessionHasErrors(['name', 'message']);
});

test('contact form validates maximum length', function () {
    $response = $this->post('/contact', [
        'name' => str_repeat('a', 256),
        'email' => str_repeat('a', 250).'@example.com',
        'message' => str_repeat('a', 2001),
    ]);

    $response->assertSessionHasErrors(['name', 'email', 'message']);
});
