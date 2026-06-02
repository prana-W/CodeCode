import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import checkHealth from './controllers/checkHealth.controller.js';
import { errorHandler } from './middlewares/index.js';
import authRouter from './routes/auth.routes.js';
import contestRouter from './routes/contest.routes.js';
import problemRouter from './routes/problem.routes.js';
import testcaseRouter from './routes/testcase.routes.js';
import submissionRouter from './routes/submission.routes.js';
import morgan from 'morgan';

const app = express();

app.use(morgan('dev'));

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use(express.json());

app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieParser());

// API Routes
app.get('/', checkHealth);
app.get('/api/v1', checkHealth);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/contests', contestRouter);
app.use('/api/v1/problems', problemRouter);
app.use('/api/v1/testcases', testcaseRouter);
app.use('/api/v1/submissions', submissionRouter);

// Error Handling
app.use(errorHandler());

export default app;

