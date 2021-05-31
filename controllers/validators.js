import {body} from "express-validator";

export const emailValidator = body('email', 'Invalid email address').isEmail();

export const passwordStrengthValidator = body('password', 'Password should be 8 character long and contains at least 1 number').matches(/^(?=.*\d).{8,}$/);

export const newPasswordStrengthValidator = body('newPassword', 'Password should be 8 character long and contains at least 1 number').matches(/^(?=.*\d).{8,}$/);

export const usernameValidator = body('username', 'Username should not contain space, start with symbols, or contains \'.\' or\'_\' next to each other and it should be all lowercase & 8-20 character long').matches(/(?=[a-z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]/);
