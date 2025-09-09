NEW CONTACT FORM SUBMISSION
=========================

From: {{ $senderName }}
Email: {{ $senderEmail }}
Received: {{ now()->format('F j, Y \a\t g:i A T') }}

MESSAGE:
--------
{{ $messageContent }}

=========================

This message was sent via the DIU ACM contact form.
You can reply directly to this email to respond to {{ $senderName }}.

DIU ACM - Daffodil International University
Association for Computing Machinery
