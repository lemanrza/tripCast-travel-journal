import * as Yup from "yup";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const resetPasswordValidationSchema = Yup.object().shape({
  newPassword: Yup.string()
    .matches(
      passwordRegex,
      "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, and 1 number"
    )
    .required("Password is required"),

  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password is required"),
});

export default resetPasswordValidationSchema;