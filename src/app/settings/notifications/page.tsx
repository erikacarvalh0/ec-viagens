import Link from "next/link";

import { ConsentForm } from "@/features/notifications/ConsentForm";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export default async function NotificationSettingsPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { whatsapp: true, paymentReminderConsentAt: true },
  });

  return (
    <main className="members-page">
      <Link href="/dashboard">← Voltar às viagens</Link>
      <p className="eyebrow">PREFERÊNCIAS</p>
      <h1>Notificações pelo WhatsApp</h1>
      <p>
        Os lembretes de pagamento são opcionais. A autorização é registrada
        somente quando você confirma sua escolha.
      </p>
      <p>WhatsApp cadastrado: {user.whatsapp ?? "Não cadastrado"}</p>
      <ConsentForm initialConsent={Boolean(user.paymentReminderConsentAt)} />
    </main>
  );
}
