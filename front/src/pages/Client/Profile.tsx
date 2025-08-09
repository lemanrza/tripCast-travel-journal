import { useState, useRef, useEffect } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import { enqueueSnackbar } from "notistack";
import { getUserIdFromToken, isTokenExpired } from "@/utils/auth";
import type { User } from "@/types/userType";
import type { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import Navigation from "@/components/Navigation";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState<User>({
    fullName: "",
    email: "",
    location: "",
    bio: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_AVATAR_URL =
    "https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png";

  const isCustomAvatar = (avatarUrl: string | undefined) => {
    return avatarUrl && avatarUrl !== DEFAULT_AVATAR_URL;
  };
  const reduxUser = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (isTokenExpired()) {
          localStorage.removeItem("token");
          window.location.href = "/";
          return;
        }

        const userId = getUserIdFromToken();
        if (!userId) {
          localStorage.removeItem("token");
          window.location.href = "/";
          return;
        }

        const response = await controller.getOne(`${endpoints.users}/user`, reduxUser?.id || userId);
        setUserData(response.data);
        console.log(response)

        setFormData({
          fullName: response.data.fullName || "",
          email: response.data.email || "",
          location: response.data.location || "",
          bio: response.data.bio || "",
        });
      } catch (error: any) {
        console.error("Error fetching user data:", error);

        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/";
          return;
        }

        enqueueSnackbar("Failed to load user data", {
          variant: "error",
          autoHideDuration: 2000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      enqueueSnackbar("Please select a valid image file (JPEG, PNG, or GIF)", {
        variant: "error",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar("Image size must be less than 5MB", {
        variant: "error",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }

    try {
      setIsUploadingImage(true);

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const uploadFormData = new FormData();
      uploadFormData.append("avatar", file);

      const userId = getUserIdFromToken();
      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/auth/me/${userId}/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: uploadFormData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Server error:", errorData);
        throw new Error(errorData.message || "Failed to upload image");
      }

      const result = await response.json();

      setUserData((prev: any) => {
        const updatedData = {
          ...prev,
          profile: {
            ...prev.profile,
            avatar: result.data.avatar,
            public_id: result.data.public_id,
          },
        };
        return updatedData;
      });

      URL.revokeObjectURL(previewUrl);
      setImagePreview("");

      enqueueSnackbar("Profile image updated successfully!", {
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    } catch (error: any) {
      console.error("❌ Error uploading image:", error);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview("");
      }

      enqueueSnackbar(
        error.message || "Failed to upload image. Please try again.",
        {
          variant: "error",
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        }
      );
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = async () => {
    try {
      setIsUploadingImage(true);

      const userId = getUserIdFromToken();
      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/auth/me/${userId}/delete-image`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete image");
      }

      await response.json();

      setUserData((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: DEFAULT_AVATAR_URL,
          public_id: undefined,
        },
      }));

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview("");
      }

      enqueueSnackbar("Profile image removed successfully!", {
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    } catch (error: any) {
      console.error("❌ Error deleting image:", error);
      enqueueSnackbar(
        error.message || "Failed to remove image. Please try again.",
        {
          variant: "error",
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        }
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00B878] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load user data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold dark:text-white">Profile</h1>
        </div>

        <div className="bg-white dark:bg-[#262626] rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold overflow-hidden transition-all duration-200 group-hover:shadow-xl group-hover:scale-[1.02] mx-auto bg-[#00B878] dark:bg-[#00B878]"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : userData?.profileImage?.url ? (
                  <img
                    src={userData.profileImage.url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData?.fullName?.charAt(0) +
                  userData?.fullName?.charAt(1)
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              <div className="mt-3 flex flex-col items-center gap-2">
                <button
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${isUploadingImage
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#00B878] text-white hover:bg-emerald-600 border border-[#00B878] hover:border-emerald-600"
                    }`}
                  onClick={!isUploadingImage ? triggerFileInput : undefined}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M12 2L12 22M2 12L22 12" />
                      </svg>
                      <span>Change Photo</span>
                    </>
                  )}
                </button>

                {/* Show remove button only if user has a custom avatar (not default) and no preview */}
                {isCustomAvatar(userData?.profileImage?.url) && !imagePreview && (
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${isUploadingImage
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 hover:border-red-300"
                      }`}
                    onClick={!isUploadingImage ? handleDeleteImage : undefined}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6" />
                        </svg>
                        <span>Remove Photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">
                {userData?.fullName || "User"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">@{userData?.username || "username"}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {formData.bio || "No bio available"}
              </p>

              <div className="flex items-center gap-6 text-gray-500 text-sm dark:text-gray-400 mb-6">
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{formData.location || "Location not set"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>
                    Joined{" "}
                    {new Date(userData?.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userData?.connections?.length || 0}
                  </span>
                  <p className="text-gray-500 text-sm dark:text-gray-400">Connections</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">23</span>
                  <p className="text-gray-500 text-sm dark:text-gray-400">Active Chats</p>
                </div>
              </div>
            </div>
          </div>
        </div>



        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* {activeTab === "overview" && (
          <Overview
            formData={formData}
            setFormData={setFormData}
            userData={userData}
            setUserData={setUserData}
          />
        )} */}

        {/* {activeTab === "settings" && <Settings />} */}

        {/* {activeTab === "privacy" && (
          <Privacy
            userData={userData}
            setUserData={setUserData}
            formData={formData}
            handleInputChange={handleInputChange}
            setFormData={setFormData}
          />
        )} */}

        {/* {activeTab === "account" && (
          <Account
            userData={userData}
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )} */}
      </div>
    </div>
  );
};

export default Profile;
