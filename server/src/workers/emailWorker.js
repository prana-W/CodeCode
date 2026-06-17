import { Worker } from 'bullmq';
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
        const { to, subject, html } = job.data;

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
            console.error(
                `[EmailWorker] Failed to send email to ${to}:`,
                err.message
            );
            throw err;
        }
    },
    {
        connection,
        concurrency: 10,
        removeOnComplete: { count: 5 },
        removeOnFail: { count: 5 },
    }
);

worker.on('completed', job => {
    console.log(`✅ [EmailWorker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ [EmailWorker] Job ${job?.id} failed with error: ${err.message}`);
});

console.log('🚀 Email Worker is running and listening to email-queue...');
