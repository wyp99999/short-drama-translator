const logger = require('../services/logger');
const ApiResponse = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      ApiResponse.error(err.message, 400)
    );
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(
      ApiResponse.error('Unauthorized', 401)
    );
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json(
      ApiResponse.error('File too large', 413)
    );
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json(
      ApiResponse.error('Too many files', 413)
    );
  }
  
  res.status(500).json(
    ApiResponse.error(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
}

module.exports = errorHandler;
