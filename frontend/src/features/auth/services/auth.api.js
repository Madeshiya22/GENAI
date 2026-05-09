export async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      return {
        success: false,
      };
    }

    return await response.json();
  } catch (error) {
    console.log(error);

    return {
      success: false,
    };
  }
}

export async function logoutUser() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.log(error);
  }
}
