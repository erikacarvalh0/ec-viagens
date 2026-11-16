"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  acceptInvitation,
  createInvitation,
} from "./invitations";
import { changeMemberRole } from "./permissions";

export type MemberActionState = {
  error: string;
  invitationUrl?: string;
};

export async function generateInvitation(
  tripId: string,
  previous: MemberActionState,
): Promise<MemberActionState> {
  void previous;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    return { error: "Configure NEXT_PUBLIC_APP_URL before sharing invitations." };
  }

  try {
    const token = await createInvitation(tripId);
    const invitationUrl = new URL(`/invite/${token}`, baseUrl).toString();
    revalidatePath(`/trips/${tripId}/members`);

    return { error: "", invitationUrl };
  } catch {
    return { error: "Only trip administrators can create invitations." };
  }
}

export async function updateMemberRole(
  tripId: string,
  memberId: string,
  role: "ADMIN" | "MEMBER",
  previous: MemberActionState,
): Promise<MemberActionState> {
  void previous;
  try {
    await changeMemberRole(tripId, memberId, role);
    revalidatePath(`/trips/${tripId}/members`);

    return { error: "" };
  } catch {
    return {
      error: "Unable to change this role. The last administrator cannot be demoted.",
    };
  }
}

export async function redeemInvitation(
  token: string,
  previous: MemberActionState,
): Promise<MemberActionState> {
  void previous;
  let tripId: string;

  try {
    tripId = await acceptInvitation(token);
  } catch {
    return { error: "This invitation has expired, was used, or is invalid." };
  }

  revalidatePath(`/trips/${tripId}/members`);
  redirect(`/trips/${tripId}/members`);
}
