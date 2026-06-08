import {
    SYSTEM_PROMPT,
    PROMPT_PROBLEM_REFINING,
    PROMPT_TESTCASE_GENERATION,
} from '../config/aiConfig.js';
import {ApiError} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {GoogleGenAI} from '@google/genai';

export const generateDecoHint = async (userPrompt) => {
    const ollamaUrl = process.env.OLLAMA_URL;
    const ollamaModel = process.env.OLLAMA_MODEL;

    try {
        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: ollamaModel,
                messages: [
                    {role: 'system', content: SYSTEM_PROMPT},
                    {role: 'user', content: userPrompt},
                ],
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `Ollama API responded with status ${response.status}`
            );
        }

        const data = await response.json();
        // /api/chat returns { message: { role: 'assistant', content: '...' } }
        return data.message?.content || data.response;
    } catch (error) {
        console.error('[AI Service Error]:', error.message);
        throw new ApiError(
            statusCode.INTERNAL_SERVER_ERROR,
            'Failed to communicate with the AI assistant. Please make sure the local Ollama instance is running.'
        );
    }
};

export const generateExternalResponse = async (userPrompt, intent) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        let systemPrompt = '';
        if (intent === 'problem_statement_refining') {
            systemPrompt = PROMPT_PROBLEM_REFINING;
        } else if (intent === 'testcase_generation') {
            systemPrompt = PROMPT_TESTCASE_GENERATION;
        } else {
            throw new Error('Invalid intent');
        }

        const ai = new GoogleGenAI({apiKey: apiKey});

        const response = await ai.models.generateContent({
            model: model,
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                maxOutputTokens: 600,
            },
        });

        return response.text;
    } catch (error) {
        console.error('[External AI Service Error]:', error.message);
        throw new ApiError(
            statusCode.INTERNAL_SERVER_ERROR,
            'Failed to communicate with the external AI service.'
        );
    }
};

export const generateExternalStream = async (userPrompt, intent, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        let systemPrompt = '';
        if (intent === 'problem_statement_refining') {
            systemPrompt = PROMPT_PROBLEM_REFINING;
        } else if (intent === 'testcase_generation') {
            systemPrompt = PROMPT_TESTCASE_GENERATION;
        } else {
            throw new Error('Invalid intent');
        }

        const ai = new GoogleGenAI({apiKey: apiKey});

        const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
            },
        });

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Write chunks as they arrive
        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
                // Send standard SSE message format
                res.write(`data: ${JSON.stringify({text})}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('[External AI Stream Error]:', error.message);
        // If headers are already sent, we cannot change status code.
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to stream response.',
            });
        } else {
            res.write(
                `data: ${JSON.stringify({error: 'Streaming failed'})}\n\n`
            );
            res.end();
        }
    }
};
