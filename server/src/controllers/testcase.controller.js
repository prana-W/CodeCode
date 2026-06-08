import TestCase from '../models/TestCase.model.js';
import Problem from '../models/Problem.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const resolveOwnership = async (test_case_id, userId) => {
    const row = await TestCase.findWithContest(test_case_id);
    if (!row) {
        throw new ApiError(statusCode.NOT_FOUND, 'Test case not found.');
    }
    if (row.contest_authored_by !== userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not the author of the contest this problem belongs to.'
        );
    }
    return row;
};

const createTestCase = asyncHandler(async (req, res) => {
    const {
        problem_id,
        input_data,
        expected_output,
        sample_input_data,
        sample_expected_output,
    } = req.body;

    if (
        !problem_id ||
        !input_data ||
        !expected_output ||
        !sample_input_data ||
        !sample_expected_output
    ) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'problem_id, input_data, expected_output, sample_input_data, and sample_expected_output are required.'
        );
    }

    const problem = await Problem.findWithContest(Number(problem_id));
    if (!problem) {
        throw new ApiError(statusCode.NOT_FOUND, 'Problem not found.');
    }
    if (problem.contest_authored_by !== req.userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not the author of the contest this problem belongs to.'
        );
    }

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
        sample_input_data,
        sample_expected_output,
    });

    const testCase = await TestCase.findById(insertId);

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                'Test case created successfully.',
                testCase
            )
        );
});

const updateTestCase = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const row = await resolveOwnership(Number(id), req.userId);

    const {
        input_data = row.input_data,
        expected_output = row.expected_output,
        sample_input_data = row.sample_input_data,
        sample_expected_output = row.sample_expected_output,
    } = req.body;

    await TestCase.update(Number(id), {
        input_data,
        expected_output,
        sample_input_data,
        sample_expected_output,
    });

    const updated = await TestCase.findById(Number(id));

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Test case updated successfully.',
                updated
            )
        );
});

const deleteTestCase = asyncHandler(async (req, res) => {
    const {id} = req.params;

    await resolveOwnership(Number(id), req.userId);

    await TestCase.delete(Number(id));

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, 'Test case deleted successfully.')
        );
});

const getAllTestCases = asyncHandler(async (req, res) => {
    const {problem_id} = req.query;
    if (!problem_id) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'problem_id query param is required.'
        );
    }

    const rows = await TestCase.findAllByProblem(Number(problem_id));
    if (!rows.length) {
        return res
            .status(statusCode.OK)
            .json(new ApiResponse(statusCode.OK, 'No test cases found.', []));
    }

    const isAdmin = req.role === 'admin';
    if (!isAdmin && rows[0].contest_authored_by !== req.userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'Only the contest creator or admin can view all test cases.'
        );
    }

    const data = rows.map(({contest_authored_by, ...rest}) => rest);

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Test cases fetched.', data));
});

export {createTestCase, updateTestCase, deleteTestCase, getAllTestCases};
