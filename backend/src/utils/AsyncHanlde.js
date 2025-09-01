const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            const statusCode = typeof error.statuscode === 'number' ? error.statuscode : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        }
    }
}

export default asyncHandler;