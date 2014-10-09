var logger = require('logger');
var loggerS3 = require('logger-s3');

module.exports = {
  init: init,
  clientLogger: clientLogger,
  requestLogger: requestLogger
};

function init(config) {
  if (config.maxEntriesPerFile) logger.maxEntries(config.maxEntriesPerFile);
  if (config.queueFlushInterval) logger.ttl(config.queueFlushInterval);
  loggerS3.init(config);
  logger.init(loggerS3.writeLog);
  logger.onError(console.error);
  return logger;
}

function clientLogger(request, response, next) {
  var args = request.body || request.query;
  if (args.log) {
    var now = Date.now();
    var timeDiff = (args.log.date || now) - now;
    var logs = args.log.logs || [];
    logs.forEach(function(logEntry) {
      logEntry.date = (logEntry.date || now) - timeDiff;
    });
    if (logs.length) logger.append(logs); 
  }
  next();
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
