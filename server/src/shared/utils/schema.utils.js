/**
 * Mongoose Schema Transformation Utilities
 * Common schema options and transformations across all domain models.
 */

const defaultSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

module.exports = {
  defaultSchemaOptions,
};
