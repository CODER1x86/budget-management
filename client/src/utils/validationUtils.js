export const validationUtils = {
    isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    },

    isPhoneNumber(phone) {
        const phoneRegex = /^(\+?63|0)?[9]\d{9}$/;
        return phoneRegex.test(phone);
    },

    validateForm(formData, rules) {
        const errors = {};
        
        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];

            if (fieldRules.required && !value) {
                errors[field] = 'This field is required';
            } else if (value) {
                if (fieldRules.minLength && value.length < fieldRules.minLength) {
                    errors[field] = `Minimum length is ${fieldRules.minLength} characters`;
                }
                if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
                    errors[field] = `Maximum length is ${fieldRules.maxLength} characters`;
                }
                if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                    errors[field] = fieldRules.message || 'Invalid format';
                }
                if (fieldRules.custom) {
                    const customError = fieldRules.custom(value, formData);
                    if (customError) {
                        errors[field] = customError;
                    }
                }
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};
