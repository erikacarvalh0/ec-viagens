-- Initial schema for fresh PostgreSQL databases. PasswordResetToken is added by the next migration.

CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER');

CREATE TYPE "TripTitle" AS ENUM ('VAN_COORDINATOR', 'ORGANIZER');

CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

CREATE TYPE "Period" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "whatsapp" TEXT,
    "paymentReminderConsentAt" TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "locationName" TEXT,
    "address" TEXT,
    "mapUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripMember" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    CONSTRAINT "TripMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberTitle" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" "TripTitle" NOT NULL,
    "description" TEXT,
    CONSTRAINT "MemberTitle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelInfo" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "outboundAt" TIMESTAMP(3),
    "outboundPeriod" "Period",
    "outboundOrigin" TEXT,
    "returnAt" TIMESTAMP(3),
    "returnPeriod" "Period",
    "returnOrigin" TEXT,
    "transportMode" TEXT,
    "needsRide" BOOLEAN NOT NULL DEFAULT false,
    "interestedVan" BOOLEAN NOT NULL DEFAULT false,
    "shareUber" BOOLEAN NOT NULL DEFAULT false,
    "offersRide" BOOLEAN NOT NULL DEFAULT false,
    "rideOutbound" BOOLEAN NOT NULL DEFAULT false,
    "rideReturn" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TravelInfo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueDay" INTEGER,
    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "paymentPlanId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "asaasPaymentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "paymentUrl" TEXT,
    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "caption" TEXT,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientWhatsapp" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "User_whatsapp_key" ON "User"("whatsapp");

CREATE UNIQUE INDEX "TripMember_tripId_userId_key" ON "TripMember"("tripId","userId");

CREATE UNIQUE INDEX "MemberTitle_memberId_title_key" ON "MemberTitle"("memberId","title");

CREATE UNIQUE INDEX "TravelInfo_memberId_key" ON "TravelInfo"("memberId");

CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

CREATE UNIQUE INDEX "Charge_asaasPaymentId_key" ON "Charge"("asaasPaymentId");

CREATE INDEX "Charge_status_dueAt_idx" ON "Charge"("status","dueAt");

CREATE UNIQUE INDEX "PaymentEvent_externalEventId_key" ON "PaymentEvent"("externalEventId");

CREATE UNIQUE INDEX "Photo_storageKey_key" ON "Photo"("storageKey");

CREATE UNIQUE INDEX "Photo_thumbnailKey_key" ON "Photo"("thumbnailKey");

CREATE UNIQUE INDEX "Notification_kind_referenceId_scheduledFor_key" ON "Notification"("kind","referenceId","scheduledFor");

ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MemberTitle" ADD CONSTRAINT "MemberTitle_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TripMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelInfo" ADD CONSTRAINT "TravelInfo_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TripMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Charge" ADD CONSTRAINT "Charge_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Charge" ADD CONSTRAINT "Charge_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TripMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "Charge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
