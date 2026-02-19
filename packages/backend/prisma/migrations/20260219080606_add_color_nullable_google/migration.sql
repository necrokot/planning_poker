-- AlterTable
ALTER TABLE "users" ADD COLUMN     "color" TEXT,
ALTER COLUMN "google_id" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;
