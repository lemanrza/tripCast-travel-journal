export const getUserIdFromToken = (): string | null => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (payload) {
      const decoded = JSON.parse(atob(payload));
      // Check for common JWT user ID fields
      return decoded.id || decoded.userId || decoded.sub || null;
    }
  } catch (e) {
    console.error("Could not decode token:", e);
  }

  return null;
};

export const isTokenExpired = (): boolean => {
  const token = localStorage.getItem("token");

  if (!token) {
    return true;
  }

  try {
    const payload = token.split(".")[1];
    if (payload) {
      const decoded = JSON.parse(atob(payload));
      return Date.now() > decoded.exp * 1000;
    }
  } catch (e) {
    console.error("Could not decode token:", e);
  }

  return true;
};
