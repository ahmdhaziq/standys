import TaskListCard from "@/modules/tasks/components/TaskListCard";
import IncompleteTasksSidebar from "@/modules/tasks/components/IncompleteTasksSidebar";

export default function Task() {
  return (
    <div className="flex flex-col gap-6 px-8 md:flex-row md:items-start">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-col items-center justify-center gap-2 mt-8 md:items-start md:justify-baseline">
          <h1 className="text-4xl font-semibold">Good Morning, User!</h1>
          <h4 className="font-light">18 August 2026</h4>
        </div>
        <TaskListCard />
      </div>
      <IncompleteTasksSidebar />
    </div>
  );
}
