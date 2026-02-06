-- AlterTable
ALTER TABLE "public"."Transcript" DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB;
