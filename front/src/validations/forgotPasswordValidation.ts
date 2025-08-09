import * as Yup from "yup";

const forgotPasswordValidationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
});

export default forgotPasswordValidationSchema;