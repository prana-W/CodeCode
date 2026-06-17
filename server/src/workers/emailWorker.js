import {Worker} from 'bullmq';
import nodemailer from 'nodemailer';
import connection from '../config/redis.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const worker = new Worker(
    'email-queue',
    async (job) => {
        const {to, subject, html} = job.data;

        if (!to || !subject || !html) {
            console.error(
                `[EmailWorker] Job ${job.id} is missing required fields.`
            );
            return;
        }

        const mailOptions = {
            from: `"CodeCode" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(
                `[EmailWorker] Email sent to ${to} | MessageId: ${info.messageId}`
            );
        } catch (err) {
            // Log the failure but do NOT re-throw — job is discarded immediately,
            // no retries, no dead-letter queue entry.
            console.error(
                `[EmailWorker] Failed to send email to ${to}:`,
                err.message
            );
        }
    },
    {
        connection,
        concurrency: 5,
        // Discard failed jobs immediately — no retries, no dead-letter queue
        removeOnFail: {count: 0},
    }
);
