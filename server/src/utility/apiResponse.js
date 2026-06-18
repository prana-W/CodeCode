class ApiResponse {
    constructor(statusCode, message = 'Success', data = null, pagination = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
        if (pagination) {
            this.pagination = pagination;
        }
    }
}

export default ApiResponse;
