import { requireTripMember } from "@/features/members/permissions";
import { downloadPrivatePhoto } from "@/features/photos/storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string; photoId: string }> },
) {
  const { tripId, photoId } = await params;
  try {
    await requireTripMember(tripId);
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, tripId },
    select: { storageKey: true, thumbnailKey: true },
  });
  if (!photo) return new Response("Not found", { status: 404 });

  try {
    const isThumbnail = new URL(request.url).searchParams.get("size") === "thumb";
    const key = isThumbnail && photo.thumbnailKey ? photo.thumbnailKey : photo.storageKey;
    const response = await downloadPrivatePhoto(key);
    const bytes = await response.arrayBuffer();
    return new Response(bytes, {
      headers: {
        "Content-Type": key.endsWith(".png") ? "image/png" : "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Storage unavailable", { status: 502 });
  }
}
