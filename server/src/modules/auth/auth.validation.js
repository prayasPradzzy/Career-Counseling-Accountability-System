const { z } = require("zod");

// Zod schema for Signup Validation
const signupSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50).optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters").max(50).optional(),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    // 'admin' is intentionally INCLUDED so it passes validation and reaches the
    // service layer, which rejects it with the documented 403 role_not_allowed.
    // (If the enum rejected it here, the 403 intent would be unreachable and the
    // request would fail as a generic 400 instead.)
    role: z.enum(["student", "counselor", "parent", "admin"], {
      errorMap: () => ({ message: "invalid_role" }),
    }),
    code: z.string().optional(),
  }),
});

// Zod schema for Login Validation
const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
};
