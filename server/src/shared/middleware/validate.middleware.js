const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    // Format Zod errors nicely
    // Zod v4 exposes issues as `error.issues`; older versions used `error.errors`.
    // Guard both so a validation rejection never crashes into a 500.
    const issues = error.issues || error.errors || [];
    const errorMessage = issues
      .map((err) => `${(err.path || []).join(".")}: ${err.message}`)
      .join(", ");
    next(new ApiError(400, errorMessage, issues));
  }
};

module.exports = validate;
