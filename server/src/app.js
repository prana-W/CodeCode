import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import checkHealth from './controllers/checkHealth.controller.js';
import {errorHandler} from './middlewares/index.js';
import authRouter from './routes/auth.routes.js';
import contestRouter from './routes/contest.routes.js';
import problemRouter from './routes/problem.routes.js';
import testcaseRouter from './routes/testcase.routes.js';
import submissionRouter from './routes/submission.routes.js';
import userRouter from './routes/user.routes.js';
import aiRouter from './routes/ai.routes.js';
import statisticsRouter from './routes/statistics.routes.js';
import customInvocationRouter from './routes/custom-invocation.routes.js';
import morgan from 'morgan';
import {apiLimiter} from './middlewares/rateLimit.middleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDefinition from './config/swagger.js';

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
app.use('/api/', apiLimiter);

app.get('/', checkHealth);
app.get('/api/v1', checkHealth);

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDefinition, {customSiteTitle: 'CodeCode API Docs'})
);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/contests', contestRouter);
app.use('/api/v1/problems', problemRouter);
app.use('/api/v1/testcases', testcaseRouter);
app.use('/api/v1/submissions', submissionRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/statistics', statisticsRouter);
app.use('/api/v1/custom-invocation', customInvocationRouter);

// Error Handling
app.use(errorHandler());

export default app;
