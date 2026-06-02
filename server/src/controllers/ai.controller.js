import {generateHint} from '../services/ai.service.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const askAssistant = asyncHandler(async (req, res) => {
    let {prompt} = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Prompt is required and must be a non-empty string.'
        );
    }

    // Call the AI Service
    const aiResponse = await generateHint(prompt);

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

export {askAssistant};
