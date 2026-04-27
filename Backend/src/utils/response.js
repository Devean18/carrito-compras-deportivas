const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

const buildResponse = (statusCode, data = null, message = null, meta = null, success = true) => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify({ success, data, message, meta }),
});

exports.ok = (data, message = 'OK', meta = null) =>
  buildResponse(200, data, message, meta, true);

exports.created = (data, message = 'Created', meta = null) =>
  buildResponse(201, data, message, meta, true);

exports.fail = (message = 'Error', status = 500) =>
  buildResponse(status, null, message, null, false);
