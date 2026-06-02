import pool from './db.js';

const connectDB = async () => {
    const connection = await pool.getConnection();

    console.log('✅ MySQL Connected');

    connection.release();
};

export default connectDB;
