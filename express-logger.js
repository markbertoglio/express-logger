var logger = require('logger');
var loggerS3 = require('logger-s3');

module.exports = {
  init: init,
  clientLogger: clientLogger,
  requestLogger: requestLogger
};

function init(config) {
  var writeLog = loggerS3.init(config);
  logger.init(writeLog);
  logger.writeLog = writeLog;
  return logger;
}

function clientLogger(request, response, next) {
  var args = request.body || request.query;
  if (args.log) logger.writeLog(args.log, next);
  else next();
}

function requestLogger(request, response, next) {
  var args = request.body || request.query;
  var end = response.end;
  response.end = function(chunk, encoding) {
    response.end = end;
    var ret = response.end(chunk, encoding);
    logger.log({
      req: request.originalUrl,
      args: JSON.stringify(args),
      resp: chunk
    });
    return ret;
  };
  return next();
}
