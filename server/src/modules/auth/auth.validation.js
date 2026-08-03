const { z } = require("zod");

// Zod schema for Signup Validation
const signupSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
    lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["student", "counselor", "admin"]).optional(),
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
