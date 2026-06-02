import { Worker } from "bullmq";
import connection from "../config/redis.js";

const worker = new Worker(
    "submission-queue",
    async (job) => {

        const submissionId =
            job.data.submissionId;

        console.log(
            "Processing:",
            submissionId
        );

        // Judge Logic Here
    },
    { connection }
);