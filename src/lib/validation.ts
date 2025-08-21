// Validation schemas and functions
export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export function validateData(data: any, schema: ValidationSchema): ValidationResult {
  const errors: { [key: string]: string } = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${field} est requis`;
      continue;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) continue;

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} doit contenir au moins ${rules.minLength} caractères`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} ne peut pas dépasser ${rules.maxLength} caractères`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = `${field} n'est pas dans le bon format`;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Student validation schema
export const studentValidationSchema: ValidationSchema = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  dateOfBirth: {
    required: true,
    custom: (value) => {
      if (!value) return null;
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 2 || age > 18) {
        return 'L\'âge doit être entre 2 et 18 ans';
      }
      return null;
    }
  },
  class: {
    required: true
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200
  },
  phone: {
    required: true,
    pattern: /^(\+261|0)[0-9]{9}$/
  },
  parentName: {
    required: true,
    minLength: 2,
    maxLength: 100
  }
};

// Teacher validation schema
export const teacherValidationSchema: ValidationSchema = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  subject: {
    required: true,
    minLength: 2
  },
  experience: {
    custom: (value) => {
      const exp = parseInt(value);
      if (isNaN(exp) || exp < 0 || exp > 50) {
        return 'L\'expérience doit être entre 0 et 50 ans';
      }
      return null;
    }
  }
};