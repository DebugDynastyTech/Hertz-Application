import { BASE_URL } from "../config/apiConfig";

export const loginUser = async (mobile_number: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ mobile_number, password }),
    });

    // Log status and response text for debugging
    console.log("Login response status:", response.status);
    const text = await response.text();
    console.log("Login response text:", text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("Failed to parse JSON:", e);
      throw e;
    }
    return data;
  } catch (error) {
    console.log("Login error:", error);
    throw error;
  }
};