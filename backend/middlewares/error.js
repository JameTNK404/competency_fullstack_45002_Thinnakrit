module.exports = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'Payload Too Large';
  } else if (message === 'Unsupported file type') {
    status = 415;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }
  res.status(status).json({ success: false, message });
};
