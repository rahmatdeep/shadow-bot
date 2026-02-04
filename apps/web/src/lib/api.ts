import axios from "axios";

// Access the environment variable. Fallback to localhost if not set (development safety).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function startBot(
  meetUrl: string,
  botName: string,
  userEmail: string,
) {
  try {
    const response = await apiClient.post("/bot/start", {
      url: meetUrl,
      name: botName,
      userEmail,
    });
    return response.data;
  } catch (error) {
    console.error("Error starting bot:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Failed to start bot");
    }
    throw error;
  }
}

export async function stopBot(containerId: string) {
  try {
    const response = await apiClient.post("/bot/stop", { containerId });
    return response.data;
  } catch (error) {
    console.error("Error stopping bot:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Failed to stop bot");
    }
    throw error;
  }
}

export async function getRecordings(userEmail: string) {
  try {
    const response = await apiClient.get("/bot/recordings", {
      params: { userEmail },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return []; // Return empty array on error to prevent crashing UI
  }
}
