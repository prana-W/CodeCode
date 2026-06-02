const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next); // Todo: Use return keyword here if non-void is returned from the fn()
        } catch (error) {
            next(error);
        }
    };
};

export default asyncHandler;
