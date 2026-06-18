module.exports = {
    apps: [
        {
            name: 'api-server',
            script: 'src/index.js',
            node_args: '-r dotenv/config',
            watch_delay: 1000,
            ignore_watch: ['node_modules', 'sandbox', 'logs', '.pm2'],
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'worker-submission',
            script: 'src/workers/submissionWorker.js',
            node_args: '-r dotenv/config',
            watch_delay: 1000,
            ignore_watch: ['node_modules', 'sandbox', 'logs', '.pm2'],
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'worker-custom-invocation',
            script: 'src/workers/customInvocationWorker.js',
            node_args: '-r dotenv/config',
            watch_delay: 1000,
            ignore_watch: ['node_modules', 'sandbox', 'logs', '.pm2'],
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'worker-email-service',
            script: 'src/workers/emailWorker.js',
            node_args: '-r dotenv/config',
            watch_delay: 1000,
            ignore_watch: ['node_modules', 'sandbox', 'logs', '.pm2'],
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};

