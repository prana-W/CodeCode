CREATE DATABASE IF NOT EXISTS codecode_v0;
USE codecode_v0;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    institute VARCHAR(255) NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    rating INT DEFAULT 0,
    max_rating INT DEFAULT 0,

    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,

    isVerified BOOLEAN NOT NULL DEFAULT FALSE,

    authored_by INT NOT NULL,

    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    contest_start_time DATETIME NOT NULL,
    contest_end_time DATETIME NOT NULL,
    
    contest_evaluation ENUM(
        'pending',
        'running',
        'completed'
    ) NOT NULL DEFAULT 'pending',

    division TINYINT NOT NULL,

    CONSTRAINT chk_contest_division
        CHECK (division IN (1, 2, 3, 4, 5)),

    FOREIGN KEY (authored_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS problems (
    problem_id INT AUTO_INCREMENT PRIMARY KEY,

    contest_id INT NOT NULL,

    title VARCHAR(255) NOT NULL,

    score INT NOT NULL,
    rating INT NOT NULL,
    
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 256,

    statement LONGTEXT NOT NULL,

    explanation LONGTEXT NULL,

    CONSTRAINT chk_problem_score
        CHECK (score BETWEEN 0 AND 5000),

    FOREIGN KEY (contest_id)
        REFERENCES contests(id)
        ON DELETE CASCADE
);

CREATE TABLE test_cases (
    test_case_id INT AUTO_INCREMENT PRIMARY KEY,

    problem_id INT UNIQUE,

    input_data LONGTEXT NOT NULL,
    expected_output LONGTEXT NOT NULL,
    
    is_sample BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (problem_id)
        REFERENCES problems(problem_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
    submission_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    problem_id INT NOT NULL,
    submitted_by INT NOT NULL,

    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    verdict ENUM(
        'pending',
        'running',
        'accepted',
        'wrong_answer',
        'runtime_error',
        'compilation_error',
        'time_limit_exceeded',
        'memory_limit_exceeded'
    ) NOT NULL DEFAULT 'pending',

    language ENUM(
        'cpp',
        'c',
        'java',
        'python',
        'javascript'
    ) NOT NULL,

    source_code LONGTEXT NOT NULL,

    execution_time_ms INT NULL,
    memory_used_kb INT NULL,

    FOREIGN KEY (problem_id)
        REFERENCES problems(problem_id)
        ON DELETE CASCADE,

    FOREIGN KEY (submitted_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE contest_standings (
    contest_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,

    accepted_submission_id BIGINT NOT NULL,

    PRIMARY KEY (
        contest_id,
        user_id,
        problem_id
    )
);

CREATE TABLE IF NOT EXISTS contest_registrations (
    registration_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    contest_id INT NOT NULL,
    user_id INT NOT NULL,

    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	
    UNIQUE KEY unique_registration (
        contest_id,
        user_id
    ),

    FOREIGN KEY (contest_id)
        REFERENCES contests(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);