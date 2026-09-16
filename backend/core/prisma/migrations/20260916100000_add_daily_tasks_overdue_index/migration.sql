-- CreateIndex
CREATE INDEX "daily_tasks_user_id_status_task_date_idx" ON "daily_tasks"("user_id", "status", "task_date");
