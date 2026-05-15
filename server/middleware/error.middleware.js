const errorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'CSRF token invalid.' });
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error(err.stack);
  res.status(statusCode).json({ message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
};

module.exports = { errorHandler };
