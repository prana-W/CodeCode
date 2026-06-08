import db from '../db/db.js';
import { ApiError, ApiResponse, asyncHandler } from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

export const getTemplates = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const [templates] = await db.query(
        'SELECT * FROM user_templates WHERE user_id = ? ORDER BY template_id DESC',
        [userId]
    );
    res.status(statusCode.OK).json(new ApiResponse(statusCode.OK, 'Templates retrieved successfully.', templates));
});

export const getTemplateById = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const [templates] = await db.query(
        'SELECT * FROM user_templates WHERE template_id = ? AND user_id = ?',
        [id, userId]
    );

    if (templates.length === 0) {
        throw new ApiError(statusCode.NOT_FOUND, 'Template not found.');
    }

    res.status(statusCode.OK).json(new ApiResponse(statusCode.OK, 'Template retrieved successfully.', templates[0]));
});

export const createTemplate = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { title, source_code, language, is_default } = req.body;

    if (!title || !source_code || !language) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Title, source code, and language are required.');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        if (is_default) {
            // Unset existing default
            await connection.query(
                'UPDATE user_templates SET is_default = FALSE WHERE user_id = ?',
                [userId]
            );
        }

        const [result] = await connection.query(
            'INSERT INTO user_templates (title, user_id, source_code, language, is_default) VALUES (?, ?, ?, ?, ?)',
            [title, userId, source_code, language, is_default || false]
        );

        await connection.commit();
        res.status(statusCode.CREATED).json(new ApiResponse(statusCode.CREATED, 'Template created successfully.', { template_id: result.insertId }));
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export const updateTemplate = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const { title, source_code, language, is_default } = req.body;

    if (!title || !source_code || !language) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Title, source code, and language are required.');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Ensure the template belongs to the user
        const [existing] = await connection.query(
            'SELECT template_id FROM user_templates WHERE template_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            await connection.rollback();
            throw new ApiError(statusCode.NOT_FOUND, 'Template not found.');
        }

        if (is_default) {
            // Unset existing default
            await connection.query(
                'UPDATE user_templates SET is_default = FALSE WHERE user_id = ?',
                [userId]
            );
        }

        await connection.query(
            'UPDATE user_templates SET title = ?, source_code = ?, language = ?, is_default = ? WHERE template_id = ? AND user_id = ?',
            [title, source_code, language, is_default !== undefined ? is_default : false, id, userId]
        );

        await connection.commit();
        res.status(statusCode.OK).json(new ApiResponse(statusCode.OK, 'Template updated successfully.'));
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export const deleteTemplate = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    const [result] = await db.query(
        'DELETE FROM user_templates WHERE template_id = ? AND user_id = ?',
        [id, userId]
    );

    if (result.affectedRows === 0) {
        throw new ApiError(statusCode.NOT_FOUND, 'Template not found.');
    }

    res.status(statusCode.OK).json(new ApiResponse(statusCode.OK, 'Template deleted successfully.'));
});

export const setDefaultTemplate = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [existing] = await connection.query(
            'SELECT template_id FROM user_templates WHERE template_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            await connection.rollback();
            throw new ApiError(statusCode.NOT_FOUND, 'Template not found.');
        }

        // Unset existing default
        await connection.query(
            'UPDATE user_templates SET is_default = FALSE WHERE user_id = ?',
            [userId]
        );

        // Set new default
        await connection.query(
            'UPDATE user_templates SET is_default = TRUE WHERE template_id = ? AND user_id = ?',
            [id, userId]
        );

        await connection.commit();
        res.status(statusCode.OK).json(new ApiResponse(statusCode.OK, 'Template set as default successfully.'));
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});
