import * as Yup from "yup";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const registerValidation = Yup.object().shape({
    fullName: Yup.string().required("Full name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
        .matches(
            passwordRegex,
            "Password must contain at least one uppercase letter, one lowercase letter, and one symbol"
        )
        .required("Password is required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Please confirm your password"),
    acceptTerms: Yup.boolean().oneOf(
        [true],
        "You must accept the terms and conditions"
    )
});

export default registerValidation;