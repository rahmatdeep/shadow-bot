-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PENDING', 'ASKING_TO_JOIN', 'JOINED', 'COMPLETED', 'FAILED', 'TIMEOUT');

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PENDING',
    "errorMetadata" JSONB,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
