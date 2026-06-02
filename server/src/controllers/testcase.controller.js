import TestCase from '../models/TestCase.model.js';
import Problem from '../models/Problem.model.js';
import Contest from '../models/Contest.model.js';
import { ApiError, ApiResponse, asyncHandler } from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const resolveOwnership = async (problem_id, userId) => {
    const problem = await Problem.findById(problem_id);
    if (!problem) {
        throw new ApiError(statusCode.NOT_FOUND, 'Problem not found.');
    }

    const contest = await Contest.findById(problem.contest_id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Owning contest not found.');
    }

    if (contest.authored_by !== userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not the author of the contest this problem belongs to.'
        );
    }

    return { problem, contest };
};

const createTestCase = asyncHandler(async (req, res) => {
    const { problem_id, input_data, expected_output, is_sample } = req.body;

    if (!problem_id || !input_data || !expected_output) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'problem_id, input_data and expected_output are required.'
        );
    }

    await resolveOwnership(Number(problem_id), req.userId);

    const existing = await TestCase.findByProblemId(Number(problem_id));
    if (existing) {
        throw new ApiError(
            statusCode.CONFLICT,
            'A test case already exists for this problem.'
        );
    }

    const insertId = await TestCase.create({
        problem_id: Number(problem_id),
        input_data,
        expected_output,
        is_sample: is_sample ?? false,
    });

    const testCase = await TestCase.findById(insertId);

    return res
        .status(statusCode.CREATED)
        .json(new ApiResponse(statusCode.CREATED, 'Test case created successfully.', testCase));
});

const updateTestCase = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const testCase = await TestCase.findById(Number(id));
    if (!testCase) {
        throw new ApiError(statusCode.NOT_FOUND, 'Test case not found.');
    }

    await resolveOwnership(testCase.problem_id, req.userId);

    const {
        input_data      = testCase.input_data,
        expected_output = testCase.expected_output,
        is_sample       = testCase.is_sample,
    } = req.body;

    await TestCase.update(Number(id), { input_data, expected_output, is_sample });

    const updated = await TestCase.findById(Number(id));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Test case updated successfully.', updated));
});

const deleteTestCase = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const testCase = await TestCase.findById(Number(id));
    if (!testCase) {
        throw new ApiError(statusCode.NOT_FOUND, 'Test case not found.');
    }

    await resolveOwnership(testCase.problem_id, req.userId);

    await TestCase.delete(Number(id));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Test case deleted successfully.'));
});

export { createTestCase, updateTestCase, deleteTestCase };
