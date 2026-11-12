<?php

function send_email_fallback(
    $to,
    $subject,
    $htmlBody,
    $from = 'wasanthaeco2001@gmail.com',
    $fromName = 'Wasantha Eco Husk Solutions',
    $replyTo = null,
    $preferredSmtpPassword = null
) {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return 'Invalid recipient email address.';
    }

    $autoload = __DIR__ . '/../../../vendor/autoload.php';
    if (is_file($autoload)) {
        require_once $autoload;
    }

    if (class_exists('\PHPMailer\PHPMailer\PHPMailer')) {
        $smtpPassword = $preferredSmtpPassword ?: (getenv('SMTP_PASSWORD') ?: '');
        if ($smtpPassword === '') {
            foreach ([
                'SMTP_PASSWORD_API_REGISTER',
                'SMTP_PASSWORD_API_ORDERS_SENDORDERNOTIFICATION',
                'SMTP_PASSWORD_API_PLANTS_HELPERS_SENDEMAILFALLBACK',
                'SMTP_PASSWORD_API_SELLER_SENDRESPONSE',
            ] as $environmentKey) {
                $smtpPassword = getenv($environmentKey) ?: '';
                if ($smtpPassword !== '') {
                    break;
                }
            }
        }

        $smtpHost = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
        if (strcasecmp($smtpHost, 'smtp.gmail.com') === 0) {
            $smtpPassword = preg_replace('/\s+/', '', trim($smtpPassword));
        }

        if ($smtpPassword === '') {
            return 'SMTP password is not configured.';
        }

        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $smtpHost;
            $mail->SMTPAuth = true;
            $mail->Timeout = 10;
            $mail->Username = getenv('SMTP_USERNAME') ?: 'wasanthaeco2001@gmail.com';
            $mail->Password = $smtpPassword;
            $mail->SMTPSecure = getenv('SMTP_ENCRYPTION')
                ?: \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = (int) (getenv('SMTP_PORT') ?: 587);
            $mail->CharSet = 'UTF-8';
            $mail->setFrom($from, $fromName);

            if (!empty($replyTo) && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
                $mail->addReplyTo($replyTo);
            }

            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = trim(preg_replace('/\s+/', ' ', strip_tags($htmlBody)));
            $mail->send();

            return true;
        } catch (\Throwable $e) {
            error_log('SMTP email delivery failed: ' . $e->getMessage());
            return 'SMTP email delivery failed.';
        }
    }

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: {$fromName} <{$from}>\r\n";

    if (!empty($replyTo) && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers .= "Reply-To: {$replyTo}\r\n";
    }

    if (mail($to, $subject, $htmlBody, $headers)) {
        return true;
    }

    return 'SMTP is unavailable and mail() failed.';
}
