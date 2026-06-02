import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import checkHealth from './controllers/checkHealth.controller.js';
import {errorHandler, verifyAccessToken} from './middlewares/index.js';
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
app.get('/api/v1/check-health', checkHealth);

// Error Handling
app.use(errorHandler());

export default app;
