"use server";

import { LoginSchema, SignupSchema } from "types";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function signupAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = SignupSchema.safeParse({ name, email, password });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      data: { name, email },
    };
  }

  try {
    const res = await axios.post(`${API_URL}/auth/signup`, result.data, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 201) {
      // Return credentials for auto-login on client side
      return { success: true, email, password };
    } else {
      return { error: "Signup failed" };
    }
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response) {
      return { error: err.response.data.error || "Signup failed" };
    }
    return { error: "Network Error" };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = LoginSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      data: { email },
    };
  }

  // return the credentials to be handled by the client component
  return { success: true, email, password };
}
