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
    expect($content->text)->toBe('emails.contact-form-text');
    expect($content->with)->toHaveKey('senderName', 'Test User');
    expect($content->with)->toHaveKey('senderEmail', 'test@example.com');
    expect($content->with)->toHaveKey('messageContent', 'Test content.');
});

test('contact email plain text template renders correctly', function () {
    $mail = new ContactFormMail(
        senderName: 'John Doe',
        senderEmail: 'john@example.com',
        messageContent: 'This is a test message for DIU ACM.'
    );

    // Test rendering the plain text version
    $textContent = view('emails.contact-form-text', [
        'senderName' => $mail->senderName,
        'senderEmail' => $mail->senderEmail,
        'messageContent' => $mail->messageContent,
    ])->render();

    expect($textContent)
        ->toContain('NEW CONTACT FORM SUBMISSION')
        ->toContain('From: John Doe')
        ->toContain('Email: john@example.com')
        ->toContain('This is a test message for DIU ACM.')
        ->toContain('DIU ACM contact form')
        ->toContain('Association for Computing Machinery');
});
