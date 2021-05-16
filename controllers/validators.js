import {body} from "express-validator";

export const emailValidator = body('email', 'Invalid email address').isEmail();

export const passwordStrengthValidator = body('password', 'Password should be 8 character long and should contain at least 1 number, 1 lowercase, 1 uppercase & 1 symbol character').matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/);

export const newPasswordStrengthValidator = body('newPassword', 'Password is not strong enough').matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/);

export const usernameValidator = body('username', 'Username should not contain space, start with symbols, or contains \'.\' or\'_\' next to each other and it should be all lowercase & 8-20 character long').matches(/(?=[a-z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]/);
