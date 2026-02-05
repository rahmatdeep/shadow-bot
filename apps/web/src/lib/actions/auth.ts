"use server";

import { authApi } from "@/lib/api/auth";
import { LoginSchema, SignupSchema } from "@repo/types";

export async function signupAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = SignupSchema.safeParse({ name, email, password });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      name,
      email,
    };
  }

  try {
    const res = await authApi.signup(result.data);

    if (res.status === 201) {
      // Return credentials for auto-login on client side
      return { success: true, email, password, name };
    } else {
      return { success: false, error: "Signup failed", name, email };
    }
  } catch (err: any) {
    const backendError = err.response?.data;
    return {
      success: false,
      error: backendError?.error || "Signup failed",
      errors: backendError?.details || null,
      name,
      email,
    };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = LoginSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      email,
    };
  }

  // return the credentials to be handled by the client component
  return { success: true, email, password };
}
