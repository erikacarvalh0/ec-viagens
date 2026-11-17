import { randomUUID } from "node:crypto";

import { requireTripMember } from "@/features/members/permissions";
import { deletePrivatePhoto, uploadPrivatePhoto } from "@/features/photos/storage";
import { optimizePhoto } from "@/features/photos/optimization";
import { MAX_PHOTO_BYTES, validatePhotoUpload } from "@/features/photos/validation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Context = { params: Promise<{ tripId: string }> };

export async function POST(request: Request, context: Context) {
  const { tripId } = await context.params;
  let member: Awaited<ReturnType<typeof requireTripMember>>;
  try {
    member = await requireTripMember(tripId);
  } catch {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_PHOTO_BYTES + 4096) {
    return Response.json({ error: "Arquivo muito grande." }, { status: 413 });
  }

  let form: FormData;
  try {
    const maxBodyBytes = MAX_PHOTO_BYTES + 4096;
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing upload body.");
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBodyBytes) {
        await reader.cancel();
        return Response.json({ error: "Arquivo muito grande." }, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: bytes,
    });
    form = await boundedRequest.formData();
  } catch {
    return Response.json({ error: "Formulário inválido." }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File) || file.size > MAX_PHOTO_BYTES) {
    return Response.json({ error: "Selecione uma imagem de até 5 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let contentType: string;
  try {
    contentType = validatePhotoUpload(bytes, file.type);
  } catch {
    return Response.json({ error: "Envie uma imagem JPEG ou PNG válida." }, { status: 400 });
  }

  const rawCaption = form.get("caption");
  const caption = typeof rawCaption === "string" ? rawCaption.trim().slice(0, 200) : "";
  const photoId = randomUUID();
  const key = `trips/${tripId}/${photoId}.jpg`;
  const thumbnailKey = `trips/${tripId}/${photoId}-thumb.jpg`;
  let attemptedOriginal = false;
  let attemptedThumbnail = false;

  try {
    const optimized = await optimizePhoto(bytes);
    attemptedOriginal = true;
    await uploadPrivatePhoto(key, optimized.original.bytes, optimized.original.contentType);
    attemptedThumbnail = true;
    await uploadPrivatePhoto(thumbnailKey, optimized.thumbnail.bytes, optimized.thumbnail.contentType);
    const photo = await prisma.photo.create({
      data: {
        tripId,
        uploadedById: member.userId,
        storageKey: key,
        thumbnailKey,
        caption: caption || null,
      },
    });
    return Response.json({ id: photo.id }, { status: 201 });
  } catch {
    // Best-effort cleanup, including PUT requests whose outcome was uncertain.
    if (attemptedThumbnail) await deletePrivatePhoto(thumbnailKey).catch(() => undefined);
    if (attemptedOriginal) await deletePrivatePhoto(key).catch(() => undefined);
    return Response.json({ error: "Não foi possível processar ou salvar a foto." }, { status: 500 });
  }
}
