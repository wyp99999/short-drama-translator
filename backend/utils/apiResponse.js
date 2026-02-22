class ApiResponse {
  static success(data, message = 'success') {
    return {
      code: 0,
      data,
      message
    };
  }
  
  static error(message, code = 500, details = null) {
    const response = {
      code,
      message,
      data: null
    };
    if (details && process.env.NODE_ENV === 'development') {
      response.details = details;
    }
    return response;
  }
  
  static paginated(data, pagination) {
    return {
      code: 0,
      data,
      pagination,
      message: 'success'
    };
  }
}

module.exports = ApiResponse;
