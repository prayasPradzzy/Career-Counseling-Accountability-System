const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid Mongo ObjectId format",
});

const createClientSchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "non-binary", "prefer-not-to-say"]).optional(),
    education: z
      .array(
        z.object({
          institution: z.string().min(1, "Institution is required"),
          degree: z.string().min(1, "Degree is required"),
          fieldOfStudy: z.string().min(1, "Field of study is required"),
          startYear: z.number().optional(),
          endYear: z.number().optional(),
          gradeGpa: z.string().optional(),
        })
      )
      .optional(),
    careerGoals: z.array(z.string()).optional(),
    targetIndustries: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    guardianInfo: z
      .object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
      })
      .optional(),
  }),
});

const inviteStudentSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email address is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    assignedCounselorId: objectIdSchema.optional(),
    education: z
      .array(
        z.object({
          institution: z.string(),
          degree: z.string(),
          fieldOfStudy: z.string(),
        })
      )
      .optional(),
    guardianInfo: z
      .object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
  }),
});

const activateStudentSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Invitation token is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

const updateClientSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "non-binary", "prefer-not-to-say"]).optional(),
    education: z
      .array(
        z.object({
          institution: z.string(),
          degree: z.string(),
          fieldOfStudy: z.string(),
          startYear: z.number().optional(),
          endYear: z.number().optional(),
          gradeGpa: z.string().optional(),
        })
      )
      .optional(),
    careerGoals: z.array(z.string()).optional(),
    targetIndustries: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    guardianInfo: z
      .object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
  }),
});

const assignCounselorSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    counselorId: objectIdSchema,
  }),
});

const consentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    isGiven: z.boolean().optional(),
    consentFormUrl: z.string().optional(),
    audioRecording: z
      .object({
        isGiven: z.boolean(),
      })
      .optional(),
  }),
});

module.exports = {
  createClientSchema,
  inviteStudentSchema,
  activateStudentSchema,
  updateClientSchema,
  assignCounselorSchema,
  consentSchema,
};
