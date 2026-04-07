-- AlterTable: Add shootType to Booking
ALTER TABLE "Booking" ADD COLUMN "shootType" TEXT NOT NULL DEFAULT 'static';

-- AlterTable: Replace pricePerHour with static/dynamic prices
ALTER TABLE "StudioSettings" ADD COLUMN "pricePerHourStatic" INTEGER NOT NULL DEFAULT 1500;
ALTER TABLE "StudioSettings" ADD COLUMN "pricePerHourDynamic" INTEGER NOT NULL DEFAULT 2500;

-- Migrate existing data
UPDATE "StudioSettings" SET "pricePerHourStatic" = "pricePerHour", "pricePerHourDynamic" = "pricePerHour" * 2;

-- Drop old column
ALTER TABLE "StudioSettings" DROP COLUMN "pricePerHour";
