# ec-viagens ♡

Aplicação para organizar viagens anuais entre amigas: participantes, caronas, pagamentos e galeria.

## Rodar localmente

Requer Node.js 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

Abra http://localhost:3000.

## Status

- Dashboard responsivo com viagens demonstrativas.
- Modal de criação de viagem apenas em memória; dados não persistem após recarregar.
- Schema inicial Prisma para PostgreSQL.
- Áreas de participantes, pagamentos, transporte e galeria ainda são placeholders.
- Autenticação, autorização, Asaas, WhatsApp e armazenamento de fotos ainda não estão implementados.

## Design system

Referência: https://github.com/erikacarvalh0/erikacarvalho-ds

O design system tem workspace React, mas não está publicado como biblioteca reutilizável. O botão em `src/components/ui/button.tsx` é um adaptador **provisório**. A integração real deve usar os componentes do DS após empacotamento ou sincronização, sem alterar o repositório original.

## Git

Branches: `feat/...`, `fix/...`, `chore/...`.

Commits e PRs: Conventional Commits com escopo e Gitmoji, como `feat(app): :sparkles: add initial dashboard`.

## Próximas etapas

Autenticação e RBAC por viagem, CRUD persistente, convites WhatsApp, integração Asaas com webhooks idempotentes e galeria privada.
