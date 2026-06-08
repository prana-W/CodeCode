import {
    generateDecoHint,
    generateExternalResponse,
    generateExternalStream,
} from '../services/ai.service.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const askDecoAssistant = asyncHandler(async (req, res) => {
    let {prompt} = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Prompt is required and must be a non-empty string.'
        );
    }

    // Call the AI Service for Deco (Ollama)
    const aiResponse = await generateDecoHint(prompt);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'AI response generated successfully.',
                {hint: aiResponse}
            )
        );
});

const askExternalAssistant = asyncHandler(async (req, res) => {
    let {prompt, intent} = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Prompt is required and must be a non-empty string.'
        );
    }

    const validIntents = ['problem_statement_refining', 'testcase_generation'];
    if (!intent || !validIntents.includes(intent)) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            `Intent is required and must be one of: ${validIntents.join(', ')}.`
        );
    }

    // Call the External AI Service (Gemini)
    const aiResponse = await generateExternalResponse(prompt, intent);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'External AI response generated successfully.',
                {response: aiResponse}
            )
        );
});

const askExternalAssistantStream = asyncHandler(async (req, res) => {
    let {prompt, intent} = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Prompt is required and must be a non-empty string.'
        );
    }

    const validIntents = ['problem_statement_refining', 'testcase_generation'];
    if (!intent || !validIntents.includes(intent)) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            `Intent is required and must be one of: ${validIntents.join(', ')}.`
        );
    }

    // Call the External AI Service for streaming
    // It handles the res internally with SSE
    await generateExternalStream(prompt, intent, res);
});

export {askDecoAssistant, askExternalAssistant, askExternalAssistantStream};
