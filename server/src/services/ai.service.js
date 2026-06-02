import {SYSTEM_PROMPT} from '../config/aiConfig.js';
import {ApiError} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

export const generateHint = async (userPrompt) => {
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
