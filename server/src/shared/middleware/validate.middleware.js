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
    const errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(", ");
    next(new ApiError(400, errorMessage, error.errors));
  }
};

module.exports = validate;
