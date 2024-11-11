export const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);

    let strength = 'weak';
    let score = 0;

    if (password.length >= minLength) score++;
    if (hasNumber) score++;
    if (hasSymbol) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;

    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return strength;
};

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};
