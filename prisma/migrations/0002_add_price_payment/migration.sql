-- AlterTable: Add price and payment fields to Booking
ALTER TABLE "Booking" ADD COLUMN "totalPrice" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateTable: StudioSettings
CREATE TABLE "StudioSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "pricePerHour" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudioSettings_pkey" PRIMARY KEY ("id")
);

-- Insert default settings
INSERT INTO "StudioSettings" ("id", "pricePerHour", "updatedAt") VALUES ('default', 500, NOW());
