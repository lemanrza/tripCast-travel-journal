// import { useState } from "react";
// import {
//   MapPin,
//   Heart,
//   CircleUser,
//   ChevronRight,
//   ChevronLeft,
//   Calendar,
// } from "lucide-react";
// import ProgressBar from "@/components/Register/ProgressBar";
// import StepHeader from "@/components/Register/StepHeader";
// import LocationSearch from "@/components/Register/LocationSearch";
// import StepNavigation from "@/components/Register/StepNavigation";
// import { Calendar as CalendarDate } from "react-calendar";
// import "react-calendar/dist/Calendar.css";
// import {
//   Coffee,
//   Plane,
//   Monitor,
//   Laptop,
//   Dog,
//   Cat,
//   Music,
//   BookOpen,
//   Dumbbell,
//   ChefHat,
//   Palette,
//   Camera,
//   Gamepad2,
//   Mountain,
//   Waves,
//   TreePine,
//   Theater,
//   Pizza,
//   FolderRoot as Football,
//   Sprout,
//   Guitar,
//   Flame,
//   ShoppingBasket as Basketball,
//   Target,
//   Home,
//   Wine,
//   Beer,
//   Umbrella,
//   Snowflake,
//   Car,
//   Tent,
//   Film,
//   Globe,
//   Piano,
// } from "lucide-react";
// import { useFormik } from "formik";
// import registerValidation from "@/validations/registerValidation";
// import controller from "@/services/commonRequest";
// import endpoints from "@/services/api";
// import { enqueueSnackbar } from "notistack";
// import { useNavigate } from "react-router-dom";
// import ReCAPTCHA from "react-google-recaptcha";
// import { FcGoogle } from "react-icons/fc";

// interface LocationResult {
//   id: string;
//   city: string;
//   country: string;
// }

// interface RegisterFormValues {
//   location: string;
//   dateOfBirth: string;
//   hobbies: string[];
//   firstName: string;
//   lastName: string;
//   username: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
// }

// function Register() {
//   const { t } = useTranslation();
//   const [step, setStep] = useState(1);
//   const [location, setLocation] = useState("");
//   const [selectedLocation, setSelectedLocation] =
//     useState<LocationResult | null>(null);
//   const navigate = useNavigate();
//   const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [captchaValue, setCaptchaValue] = useState<string | null>(null);

//   const handleDateChange = (value: any) => {
//     if (value && value instanceof Date) {
//       setDateOfBirth(value);
//       registerFormik.setFieldValue("dateOfBirth", value.toISOString());
//       setIsCalendarOpen(false);
//     }
//   };

//   const toggleCalendar = () => {
//     setIsCalendarOpen(!isCalendarOpen);
//   };
//   const registerFormik = useFormik<RegisterFormValues>({
//     initialValues: {
//       location: "",
//       dateOfBirth: "",
//       hobbies: [],
//       firstName: "",
//       lastName: "",
//       username: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//     },
//     validationSchema: registerValidation,
//     onSubmit: async (values, action) => {
//       if (!captchaValue) {
//         enqueueSnackbar(t("register_captcha"), {
//           variant: "error",
//           autoHideDuration: 2000,
//         });
//         return;
//       }

//       if (!dateOfBirth) {
//         enqueueSnackbar(t("register_select_dob"), {
//           variant: "error",
//           autoHideDuration: 2000,
//         });
//         return;
//       }

//       if (!selectedLocation) {
//         enqueueSnackbar(t("register_select_location"), {
//           variant: "error",
//           autoHideDuration: 2000,
//         });
//         return;
//       }

//       if (!values.hobbies || values.hobbies.length < 3) {
//         console.log("Hobbies validation failed");
//         enqueueSnackbar(t("register_select_hobbies"), {
//           variant: "error",
//           autoHideDuration: 2000,
//         });
//         return;
//       }

//       const formattedDate = dateOfBirth.toISOString();

//       const registrationData = {
//         username: values.username,
//         email: values.email,
//         password: values.password,
//         profile: {
//           firstName: values.firstName,
//           lastName: values.lastName,
//           location: `${selectedLocation.city}, ${selectedLocation.country}`,
//           dateOfBirth: formattedDate,
//         },
//         hobbies: values.hobbies,
//       };

//       try {
//         await controller.post(`${endpoints.users}/register`, registrationData);

//         enqueueSnackbar(t("register_success"), {
//           autoHideDuration: 2000,
//           anchorOrigin: {
//             vertical: "bottom",
//             horizontal: "right",
//           },
//           variant: "success",
//         });

//         action.resetForm();
//         navigate("/auth/login");
//       } catch (error: any) {
//         console.error("Registration failed", error);
//         enqueueSnackbar(
//           error.response?.data?.message || t("register_failed"),
//           {
//             autoHideDuration: 2000,
//             anchorOrigin: {
//               vertical: "bottom",
//               horizontal: "right",
//             },
//             variant: "error",
//           }
//         );
//         values.email = "";
//         values.username = "";
//       }
//     },
//   });

//   const interests = [
//     { name: "Coffee", icon: Coffee },
//     { name: "Travel", icon: Plane },
//     { name: "Netflix", icon: Monitor },
//     { name: "Coding", icon: Laptop },
//     { name: "Dogs", icon: Dog },
//     { name: "Cats", icon: Cat },
//     { name: "Music", icon: Music },
//     { name: "Reading", icon: BookOpen },
//     { name: "Fitness", icon: Dumbbell },
//     { name: "Cooking", icon: ChefHat },
//     { name: "Art", icon: Palette },
//     { name: "Photo", icon: Camera },
//     { name: "Gaming", icon: Gamepad2 },
//     { name: "Hiking", icon: Mountain },
//     { name: "Swimming", icon: Waves },
//     { name: "Yoga", icon: TreePine },
//     { name: "Theater", icon: Theater },
//     { name: "Food", icon: Pizza },
//     { name: "Sports", icon: Football },
//     { name: "Garden", icon: Sprout },
//     { name: "Guitar", icon: Guitar },
//     { name: "Dancing", icon: Flame },
//     { name: "Basketball", icon: Basketball },
//     { name: "Soccer", icon: Target },
//     { name: "Darts", icon: Target },
//     { name: "Games", icon: Home },
//     { name: "Wine", icon: Wine },
//     { name: "Beer", icon: Beer },
//     { name: "Beach", icon: Umbrella },
//     { name: "Winter", icon: Snowflake },
//     { name: "Cars", icon: Car },
//     { name: "Comedy", icon: Tent },
//     { name: "Movies", icon: Film },
//     { name: "Tech", icon: Globe },
//     { name: "Nature", icon: Globe },
//     { name: "Piano", icon: Piano },
//   ];

//   const handleInterestToggle = (interest: string, e: React.MouseEvent) => {
//     e.preventDefault();

//     // If there are already 5 hobbies selected, prevent adding more
//     if (registerFormik.values.hobbies.length >= 5 && !registerFormik.values.hobbies.includes(interest)) {
//       return;
//     }

//     // Toggle the interest
//     registerFormik.setFieldValue(
//       "hobbies",
//       registerFormik.values.hobbies.includes(interest)
//         ? registerFormik.values.hobbies.filter((i) => i !== interest)
//         : [...registerFormik.values.hobbies, interest]
//     );
//   };


//   const handleCaptchaChange = (value: string | null) => {
//     setCaptchaValue(value);
//   };

//   const handleNextStep = () => {
//     if (step < 4) {
//       setStep(step + 1);
//     }
//   };

//   const handlePrevStep = () => {
//     if (step > 1) {
//       setStep(step - 1);
//     }
//   };

//   const handleLocationChange = (value: string) => {
//     setLocation(value);
//     registerFormik.setFieldValue("location", value);
//   };

//   const handleLocationSelect = (locationResult: LocationResult) => {
//     setSelectedLocation(locationResult);
//     const locationString = `${locationResult.city}, ${locationResult.country}`;
//     registerFormik.setFieldValue("location", locationString);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <div className="w-full max-w-4xl">
//         {/* Header with title */}
//         <div className="flex flex-col items-center mb-2">
//           <h1 className="text-4xl font-extrabold text-[#222] mb-2 tracking-tight flex items-center gap-2">
//             {t("register_title")}
//           </h1>
//           <p className="text-gray-500 text-base">
//             {t("register_subtitle")}
//           </p>
//         </div>

//         {/* Progress Bar */}
//         <ProgressBar currentStep={step} totalSteps={4} />

//         {/* Main Content Card */}
//         <div className="bg-white rounded-3xl p-8 shadow-xl">
//           <form onSubmit={registerFormik.handleSubmit}>
//             {step === 1 && (
//               <>
//                 <StepHeader
//                   icon={MapPin}
//                   title={t("register_step1_title")}
//                   subtitle={t("register_step1_subtitle")}
//                 />
//                 <LocationSearch
//                   value={location}
//                   onChange={handleLocationChange}
//                   onSelect={handleLocationSelect}
//                   selectedLocation={selectedLocation}
//                 />
//                 <div className="flex justify-end">
//                   <StepNavigation
//                     onNext={handleNextStep}
//                     canGoNext={!!selectedLocation}
//                   />
//                 </div>
//               </>
//             )}

//             {step === 2 && (
//               <>
//                 <div className="text-center mb-8">
//                   <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E5F8F1] bg-opacity-10 rounded-full mb-4">
//                     <Heart className="w-8 h-8 text-[#00B878]" />
//                   </div>
//                   <h2 className="text-2xl font-bold text-gray-800 mb-2">
//                     {t("register_step2_title")}
//                   </h2>
//                   <p className="text-gray-500">
//                     {t("register_step2_subtitle")}
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-6 gap-3 mb-6">
//                   {interests.map((interest) => {
//                     const IconComponent = interest.icon;
//                     const isSelected = registerFormik.values.hobbies.includes(interest.name);
//                     const isDisabled = registerFormik.values.hobbies.length >= 5 && !isSelected; // Disable if 5 interests are selected

//                     return (
//                       <button
//                         key={interest.name}
//                         onClick={(e) => handleInterestToggle(interest.name, e)}
//                         disabled={isDisabled}
//                         className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${isSelected
//                           ? "bg-[#00B878] border-[#00B878] text-white shadow-lg"
//                           : isDisabled
//                             ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                             : "bg-white border-gray-200 text-gray-600 hover:border-[#00B878] hover:text-[#00B878]"
//                           }`}
//                       >
//                         <IconComponent className="w-6 h-6 mb-2" />
//                         <span className="text-xs font-medium">{interest.name}</span>
//                       </button>
//                     );
//                   })}

//                 </div>

//                 <div className="text-center mb-6">
//                   <p className="text-sm text-gray-500">
//                     {t("register_step2_selected", { count: registerFormik.values.hobbies.length })}{" "}
//                     {registerFormik.values.hobbies.length < 3
//                       ? t("register_select_minimum_3")
//                       : registerFormik.values.hobbies.length > 5
//                         ? t("register_select_maximum_5")
//                         : ""}
//                   </p>
//                 </div>


//                 <div className="flex gap-3">
//                   <button
//                     type="button"
//                     onClick={handlePrevStep}
//                     className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
//                   >
//                     <ChevronLeft className="w-5 h-5" />
//                     {t("register_step2_back")}
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleNextStep}
//                     disabled={registerFormik.values.hobbies.length < 3}
//                     className={`flex-1 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${registerFormik.values.hobbies.length >= 3
//                       ? "bg-[#00B878] hover:bg-[#00a76d] text-white shadow-lg"
//                       : "bg-gray-200 text-gray-400 cursor-not-allowed"
//                       }`}
//                   >
//                     {t("register_step2_continue")}
//                     <ChevronRight className="w-5 h-5" />
//                   </button>
//                 </div>
//               </>
//             )}

//             {step === 3 && (
//               <>
//                 <StepHeader
//                   icon={Calendar}
//                   title={t("register_step3_title")}
//                   subtitle={t("register_step3_subtitle")}
//                 />
//                 <div className="space-y-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       {t("register_step3_label")}
//                     </label>
//                     <div className="relative">
//                       <input
//                         type="text"
//                         onClick={toggleCalendar}
//                         placeholder={t("register_step3_label")}
//                         className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#00B878] focus:ring-opacity-20 focus:border-[#00B878] transition-all bg-gray-50"
//                         defaultValue={
//                           dateOfBirth ? dateOfBirth.toLocaleDateString() : ""
//                         }
//                       />

//                       {isCalendarOpen && (
//                         <CalendarDate
//                           value={dateOfBirth}
//                           onChange={handleDateChange}
//                           className="absolute top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] bg-green-700 mt-2 w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#00B878] focus:ring-opacity-20 focus:border-[#00B878] transition-all "
//                         />
//                       )}
//                     </div>
//                     {dateOfBirth && (
//                       <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
//                         <div className="flex items-center gap-2 text-green-700">
//                           <span className="text-lg">🎂</span>
//                           <span className="font-semibold">
//                             {t("register_step3_age", { age: new Date().getFullYear() - dateOfBirth.getFullYear() })}
//                           </span>
//                         </div>
//                         <p className="text-sm text-green-600 mt-1">
//                           {t("register_step3_born", {
//                             date: dateOfBirth.toLocaleDateString("en-US", {
//                               weekday: "long",
//                               year: "numeric",
//                               month: "long",
//                               day: "numeric",
//                             })
//                           })}
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   <StepNavigation
//                     onPrevious={handlePrevStep}
//                     onNext={handleNextStep}
//                   />
//                 </div>
//               </>
//             )}

//             {step === 4 && (
//               <>
//                 <div className="text-center mb-8">
//                   <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E5F8F1] bg-opacity-10 rounded-full mb-4">
//                     <CircleUser className="w-8 h-8 text-[#00B878]" />
//                   </div>
//                   <h2 className="text-2xl font-bold text-gray-800 mb-2">
//                     {t("register_step4_title")}
//                   </h2>
//                   <p className="text-gray-500">
//                     {t("register_step4_subtitle")}
//                   </p>
//                 </div>

//                 <div className="space-y-4">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       window.location.href = `${import.meta.env.VITE_SERVER_URL
//                         }/auth/google`;
//                     }}
//                     className="flex items-center justify-center w-full gap-3 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
//                   >
//                     <FcGoogle className="text-xl" />
//                     <span className="text-sm text-semibold text-gray-700">
//                       {t("register_google")}
//                     </span>
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       window.location.href = `${import.meta.env.VITE_SERVER_URL
//                         }/auth/github`;
//                     }}
//                     className="flex items-center justify-center w-full gap-3 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
//                   >
//                     <img
//                       src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
//                       alt="GitHub"
//                       className="w-5 h-5"
//                     />
//                     <span className="text-sm text-gray-700 text-semibold">
//                       {t("register_github")}
//                     </span>
//                   </button>
//                   <div className="text-center">
//                     <span className="text-gray-400 text-sm">
//                       {t("register_or_email")}
//                     </span>
//                   </div>

//                   <div>
//                     <label className="text-sm font-medium text-[#222]">
//                       {t("register_first_name")}
//                     </label>
//                     <input
//                       type="text"
//                       value={registerFormik.values.firstName}
//                       onChange={registerFormik.handleChange}
//                       onBlur={registerFormik.handleBlur}
//                       name="firstName"
//                       placeholder={t("register_first_name_placeholder")}
//                       className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b]"
//                     />
//                     {registerFormik.errors.firstName &&
//                       registerFormik.touched.firstName && (
//                         <span className="text-red-500 text-sm mt-1 block">
//                           {registerFormik.errors.firstName}
//                         </span>
//                       )}
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-[#222]">
//                       {t("register_last_name")}
//                     </label>
//                     <input
//                       type="text"
//                       value={registerFormik.values.lastName}
//                       onChange={registerFormik.handleChange}
//                       onBlur={registerFormik.handleBlur}
//                       name="lastName"
//                       placeholder={t("register_last_name_placeholder")}
//                       className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b]"
//                     />
//                     {registerFormik.errors.lastName &&
//                       registerFormik.touched.lastName && (
//                         <span className="text-red-500 text-sm mt-1 block">
//                           {registerFormik.errors.lastName}
//                         </span>
//                       )}
//                   </div>
//                   <div className="col-span-2">
//                     <label className="text-sm font-medium text-[#222]">
//                       {t("register_username")}
//                     </label>
//                     <input
//                       type="text"
//                       value={registerFormik.values.username}
//                       onChange={registerFormik.handleChange}
//                       onBlur={registerFormik.handleBlur}
//                       name="username"
//                       placeholder={t("register_username_placeholder")}
//                       className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b]"
//                     />
//                     {registerFormik.errors.username &&
//                       registerFormik.touched.username && (
//                         <span className="text-red-500 text-sm mt-1 block">
//                           {registerFormik.errors.username}
//                         </span>
//                       )}
//                   </div>
//                   <div className="col-span-2">
//                     <label className="text-sm font-medium text-[#222]">
//                       {t("register_email")}
//                     </label>
//                     <input
//                       type="email"
//                       value={registerFormik.values.email}
//                       onChange={registerFormik.handleChange}
//                       onBlur={registerFormik.handleBlur}
//                       name="email"
//                       placeholder={t("register_email_placeholder")}
//                       className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b]"
//                     />
//                     {registerFormik.errors.email &&
//                       registerFormik.touched.email && (
//                         <span className="text-red-500 text-sm mt-1 block">
//                           {registerFormik.errors.email}
//                         </span>
//                       )}
//                   </div>
//                   <div className="relative">
//                     <label className="text-sm font-medium text-[#222]">
//                       {t("register_password")}
//                     </label>
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       value={registerFormik.values.password}
//                       onChange={registerFormik.handleChange}
//                       onBlur={registerFormik.handleBlur}
//                       name="password"
//                       placeholder={t("register_password_placeholder")}
//                       className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b] pr-10"
//                     />
//                     <button
//                       type="button"
//                       tabIndex={-1}
//                       onClick={() => setShowPassword((v) => !v)}
//                       className="absolute right-3 top-9.5 text-[#43e97b] cursor-pointer"
//                     >
//                       {showPassword ? (
//                         <svg
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           strokeWidth={1.5}
//                           stroke="currentColor"
//                           className="w-5 h-5"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
//                           />
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                           />
//                         </svg>
//                       ) : (
//                         <svg
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           strokeWidth={1.5}
//                           stroke="currentColor"
//                           className="w-5 h-5"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.53 6.53C4.06 8.36 2.25 12 2.25 12s3.75 7.5 9.75 7.5c1.61 0 3.09-.22 4.41-.61M17.47 17.47C19.94 15.64 21.75 12 21.75 12c-.653-1.306-1.86-3.342-3.72-5.06"
//                           />
//                         </svg>
//                       )}
//                     </button>
//                     {registerFormik.errors.password &&
//                       registerFormik.touched.password && (
//                         <span className="text-red-500 text-sm mt-1 block">
//                           {registerFormik.errors.password}
//                         </span>
//                       )}
//                   </div>
//                   <div className="relative">
//                     <label className="text-sm font-medium text-[#222]">
//                       {t("register_confirm_password")}
//                     </label>
//                     <input
//                       type={showConfirm ? "text" : "password"}
//                       value={registerFormik.values.confirmPassword}
//                       onChange={registerFormik.handleChange}
//                       onBlur={registerFormik.handleBlur}
//                       name="confirmPassword"
//                       placeholder={t("register_confirm_password_placeholder")}
//                       className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b] pr-10"
//                     />
//                     <button
//                       type="button"
//                       tabIndex={-1}
//                       onClick={() => setShowConfirm((v) => !v)}
//                       className="absolute right-3 top-9.5 text-[#43e97b] cursor-pointer"
//                     >
//                       {showConfirm ? (
//                         <svg
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           strokeWidth={1.5}
//                           stroke="currentColor"
//                           className="w-5 h-5"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
//                           />
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                           />
//                         </svg>
//                       ) : (
//                         <svg
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           strokeWidth={1.5}
//                           stroke="currentColor"
//                           className="w-5 h-5"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.53 6.53C4.06 8.36 2.25 12 2.25 12s3.75 7.5 9.75 7.5c1.61 0 3.09-.22 4.41-.61M17.47 17.47C19.94 15.64 21.75 12 21.75 12c-.653-1.306-1.86-3.342-3.72-5.06"
//                           />
//                         </svg>
//                       )}
//                     </button>
//                     {registerFormik.errors.confirmPassword &&
//                       registerFormik.touched.confirmPassword && (
//                         <span className="text-red-500 text-sm mt-1 block">
//                           {registerFormik.errors.confirmPassword}
//                         </span>
//                       )}
//                   </div>
//                   <div className="mt-4 bg-gray-100 rounded-xl py-3 flex items-center justify-center">
//                     <ReCAPTCHA
//                       sitekey="6LdV1owrAAAAAEzeZ2JZqUuhPZb7psuocH7MLAVI"
//                       onChange={handleCaptchaChange}
//                     />
//                   </div>
//                   <div className="flex gap-3">
//                     <button
//                       type="button"
//                       onClick={handlePrevStep}
//                       className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
//                     >
//                       <ChevronLeft className="w-5 h-5" />
//                       Back
//                     </button>
//                     <button
//                       type="submit"
//                       disabled={registerFormik.isSubmitting || !captchaValue}
//                       className="flex-1 bg-[#00B878] hover:bg-[#00a76d] text-white py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       {registerFormik.isSubmitting
//                         ? t("register_creating")
//                         : t("register_create")}
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-500">
//               <span className="mr-1">{t("register_already_account")}</span>
//               <a
//                 href="/auth/login"
//                 className="text-[#00B878] font-semibold hover:text-[#00a76d] transition-colors"
//               >
//                 {t("register_signin")}
//               </a>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Register;

const Register = () => {
  return (
    <div>Register</div>
  )
}

export default Register