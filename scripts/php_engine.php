<?php
/**
 * PHP SEMI-AUTOMATED PAYMENT VERIFICATION ENGINE
 * File 1: imap_cron.php (Run every 1-5 minutes via Server Cron Job)
 */

declare(strict_types=1);

// --- DATABASE CONFIGURATION ---
$dbHost = '127.0.0.1';
$dbName = 'your_database_name';
$dbUser = 'your_db_user';
$dbPass = 'your_db_password';

// --- IMAP MAILBOX CONFIGURATION ---
$imapHost = '{imap.gmail.com:993/imap/ssl}INBOX';
$imapUser = 'your-payment-alerts@gmail.com';
$imapPass = 'your-app-password'; // Gmail App Password / Outlook Pass

try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Database Connection Error: " . $e->getMessage());
}

/**
 * 1. IMAP CRON SCRIPT EXECUTION
 */
function runImapEmailParser(PDO $pdo, string $mailbox, string $username, string $password): void
{
    if (!function_exists('imap_open')) {
        die("PHP IMAP extension is not installed. Please enable php-imap on your server.");
    }

    $inbox = @imap_open($mailbox, $username, $password);
    if (!$inbox) {
        die("IMAP Connection Failed: " . imap_last_error());
    }

    // Search for UNSEEN (Unread) Emails
    $emails = imap_search($inbox, 'UNSEEN');

    if ($emails) {
        foreach ($emails as $emailNumber) {
            $overview = imap_fetch_overview($inbox, (string)$emailNumber, 0);
            $body = imap_fetchbody($inbox, $emailNumber, 1.1) ?: imap_body($inbox, $emailNumber);
            $sender = $overview[0]->from ?? 'Unknown Sender';

            // REGEX PATTERNS TO EXTRACT TID AND AMOUNT
            // Train these regexes according to your bank/wallet email format
            $tidRegex = '/(?:Trx ID|TID|Transaction ID|Ref No)[:\s]+([A-Za-z0-9]{8,18})/i';
            $amountRegex = '/(?:Amount|Rs\.?|PKR|\$)[:\s]+([0-9,]+(?:\.[0-9]{1,2})?)/i';

            $extractedTid = null;
            $extractedAmount = null;

            if (preg_match($tidRegex, $body, $tidMatches)) {
                $extractedTid = trim($tidMatches[1]);
            }

            if (preg_match($amountRegex, $body, $amountMatches)) {
                $cleanAmount = str_replace(',', '', $amountMatches[1]);
                $extractedAmount = (float)$cleanAmount;
            }

            if ($extractedTid && $extractedAmount > 0) {
                // Insert into payments_received table securely
                $stmt = $pdo->prepare("
                    INSERT INTO payments_received (transaction_id, amount, sender_info, status, created_at)
                    VALUES (:tid, :amount, :sender, 'pending', NOW())
                    ON DUPLICATE KEY UPDATE transaction_id = transaction_id
                ");
                $stmt->execute([
                    ':tid' => $extractedTid,
                    ':amount' => $extractedAmount,
                    ':sender' => $sender
                ]);

                // Mark email as READ
                imap_setflag_full($inbox, (string)$emailNumber, "\\Seen");
            }
        }
    }

    imap_close($inbox);
    echo "IMAP Cron completed successfully.\n";
}

/**
 * 2. USER DEPOSIT FORM VERIFICATION API LOGIC
 */
function verifyUserDeposit(PDO $pdo, string $userId, string $submittedTid, float $submittedAmount, ?string $screenshotPath): array
{
    $submittedTid = trim(htmlspecialchars($submittedTid, ENT_QUOTES, 'UTF-8'));
    
    // Check Rate Limiting (max 3 attempts per 60 seconds)
    $rateStmt = $pdo->prepare("
        SELECT COUNT(*) FROM user_deposits 
        WHERE user_id = :user_id AND processed_at >= NOW() - INTERVAL 1 MINUTE
    ");
    $rateStmt->execute([':user_id' => $userId]);
    $attempts = (int)$rateStmt->fetchColumn();

    if ($attempts >= 3) {
        return [
            'success' => false,
            'message' => 'Rate limit exceeded. Maximum 3 verification attempts allowed per minute. Please wait.'
        ];
    }

    $pdo->beginTransaction();
    try {
        // Query payments_received for matching pending TID
        $stmt = $pdo->prepare("
            SELECT * FROM payments_received 
            WHERE transaction_id = :tid AND status = 'pending' 
            FOR UPDATE
        ");
        $stmt->execute([':tid' => $submittedTid]);
        $paymentRecord = $stmt->fetch();

        // Check if TID exists and amount matches
        if ($paymentRecord && (float)$paymentRecord['amount'] === $submittedAmount) {
            
            // 1. Instantly update user balance
            $updateUser = $pdo->prepare("UPDATE users SET balance = balance + :amount WHERE id = :user_id");
            $updateUser->execute([':amount' => $submittedAmount, ':user_id' => $userId]);

            // 2. Mark payment as claimed
            $updatePayment = $pdo->prepare("UPDATE payments_received SET status = 'claimed' WHERE id = :id");
            $updatePayment->execute([':id' => $paymentRecord['id']]);

            // 3. Log user deposit as auto-approved
            $logDeposit = $pdo->prepare("
                INSERT INTO user_deposits (user_id, submitted_tid, submitted_amount, screenshot_path, status, processed_at)
                VALUES (:user_id, :tid, :amount, :ss, 'auto-approved', NOW())
            ");
            $logDeposit->execute([
                ':user_id' => $userId,
                ':tid' => $submittedTid,
                ':amount' => $submittedAmount,
                ':ss' => $screenshotPath
            ]);

            $pdo->commit();
            return [
                'success' => true,
                'status' => 'auto-approved',
                'message' => 'Payment verified automatically! Funds credited to your balance.'
            ];
        } else {
            // TID not found yet or amount mismatch -> Queue for Manual Review
            $logDeposit = $pdo->prepare("
                INSERT INTO user_deposits (user_id, submitted_tid, submitted_amount, screenshot_path, status, processed_at)
                VALUES (:user_id, :tid, :amount, :ss, 'manual-review', NOW())
            ");
            $logDeposit->execute([
                ':user_id' => $userId,
                ':tid' => $submittedTid,
                ':amount' => $submittedAmount,
                ':ss' => $screenshotPath
            ]);

            $pdo->commit();
            return [
                'success' => true,
                'status' => 'manual-review',
                'message' => 'Transaction logged! Pending manual review by admin.'
            ];
        }
    } catch (Exception $e) {
        $pdo->rollBack();
        return [
            'success' => false,
            'message' => 'Verification failed due to a system error: ' . $e->getMessage()
        ];
    }
}
