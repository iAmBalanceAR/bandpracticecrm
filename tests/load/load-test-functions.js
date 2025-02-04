// Helper functions for Artillery load testing
function handleError(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error(`Error: ${response.statusCode} - ${response.body}`);
  }
  return next();
}

function logResponse(requestParams, response, context, ee, next) {
  if (process.env.DEBUG) {
    console.log(`Response: ${response.statusCode} - ${response.body}`);
  }
  return next();
}

function generateRandomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date(2024, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function handleAuthResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error(`Auth failed with status ${response.statusCode}`);
    return next(new Error(`Auth failed with status ${response.statusCode}`));
  }
  
  // Extract auth token from response body
  if (response.body && response.body.session && response.body.session.access_token) {
    context.vars.authToken = response.body.session.access_token;
  } else {
    console.error('No auth token found in response');
    return next(new Error('No auth token found in response'));
  }
  
  return next();
}

module.exports = {
  handleError,
  logResponse,
  generateRandomDate,
  handleAuthResponse
}; 