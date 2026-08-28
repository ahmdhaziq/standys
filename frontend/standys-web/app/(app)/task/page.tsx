import TaskListCard from "@/modules/tasks/components/TaskListCard";

export default function Task(){
  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex flex-col gap-2 justify-center items-center md:items-start md:justify-baseline">
        <h1 className="text-4xl font-semibold">Good Morning, User!</h1>
        <h4 className="font-light">18 August 2026</h4>
      </div>
     <TaskListCard />
    </div>
  )
}