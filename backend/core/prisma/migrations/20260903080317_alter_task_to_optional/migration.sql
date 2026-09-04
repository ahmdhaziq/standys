-- DropForeignKey
ALTER TABLE "daily_tasks" DROP CONSTRAINT "daily_tasks_task_id_fkey";

-- AlterTable
ALTER TABLE "daily_tasks" ALTER COLUMN "task_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
