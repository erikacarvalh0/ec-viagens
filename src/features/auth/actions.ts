"use server";

import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

import { loginSchema, registrationSchema } from "./schemas";

export type AuthActionState = {
  error: string;
};

export async function register(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: "Verifique os dados. A senha deve ter pelo menos 12 caracteres." };
  }

  try {
    await prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        passwordHash: await hashPassword(result.data.password),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Este e-mail já está cadastrado." };
    }

    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  redirect("/login?registered=1");
}

export async function login(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: "Informe um e-mail e uma senha válidos." };
  }

  try {
    await signIn("credentials", {
      ...result.data,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
