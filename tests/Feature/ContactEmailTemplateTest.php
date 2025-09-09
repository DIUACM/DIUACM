<?php

use App\Mail\ContactFormMail;

test('contact email template renders correctly', function () {
    $mail = new ContactFormMail(
        senderName: 'John Doe',
        senderEmail: 'john@example.com',
        messageContent: 'This is a test message for DIU ACM.'
    );

    $rendered = $mail->render();

    expect($rendered)
        ->toContain('John Doe')
        ->toContain('john@example.com')
        ->toContain('This is a test message for DIU ACM.')
        ->toContain('New Contact Form Submission')
        ->toContain('DIU ACM contact form');
});

test('contact email has correct subject and reply-to', function () {
    $mail = new ContactFormMail(
        senderName: 'Jane Smith',
        senderEmail: 'jane@example.com',
        messageContent: 'Another test message.'
    );

    $envelope = $mail->envelope();

    expect($envelope->subject)->toBe('Contact Form Submission from Jane Smith');
    expect($envelope->replyTo)->toHaveCount(1);
    expect($envelope->replyTo[0]->address)->toBe('jane@example.com');
});

test('contact email content definition is correct', function () {
    $mail = new ContactFormMail(
        senderName: 'Test User',
        senderEmail: 'test@example.com',
        messageContent: 'Test content.'
    );

    $content = $mail->content();

    expect($content->view)->toBe('emails.contact-form');
    expect($content->with)->toHaveKey('senderName', 'Test User');
    expect($content->with)->toHaveKey('senderEmail', 'test@example.com');
    expect($content->with)->toHaveKey('messageContent', 'Test content.');
});
