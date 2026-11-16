import Link from "next/link";

import { ProfileForm } from "@/features/profile/ProfileForm";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export default async function ProfilePage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, city: true, state: true, whatsapp: true },
  });

  return (
    <main className="members-page">
      <Link href="/dashboard">← Voltar às viagens</Link>
      <p className="eyebrow">MINHA CONTA</p>
      <h1>Meu perfil</h1>
      <p>E-mail: {user.email}</p>
      <ProfileForm initial={{
        name: user.name,
        city: user.city ?? "",
        state: user.state ?? "",
        whatsapp: user.whatsapp ?? "",
      }} />
      <p><Link href="/settings/notifications">Preferências de notificações</Link></p>
    </main>
  );
}
