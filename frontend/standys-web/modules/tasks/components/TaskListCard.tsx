"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { EllipsisVertical, ListClock, PlusCircle } from "lucide-react";
import { useState } from "react";
import CreateTask from "./CreateTask";
import { getTasks } from "../api/get-tasks";
import { useQuery } from "@tanstack/react-query";

type TaskRow = {
  id: number;
  status: string;
  task: {
    title: string;
    description: string | null;
  };
};

export default function TaskListCard() {
  const [showInlineCreateTask, setShowInlineCreateTask] = useState(false);
  function getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  const todayDate = getTodayDate();
  const tasks = useQuery({
    queryKey: ["tasks", todayDate],
    queryFn: () => getTasks(todayDate),
  });
  function onClose() {
    setShowInlineCreateTask(false);
  }

  return (
    <Card className="rounded-sm bg-[#F8FAFC]">
      <CardContent>
        <div className="flex items-center justify-baseline gap-2">
          <ListClock className="text-[#4F46E5] h-6 w-6" />
          <h2 className="text-lg font-semibold">Today&apos;s Task List</h2>
        </div>
        <div className="mt-2 flex flex-col">
          <ItemGroup className="flex flex-col gap-2">
            {tasks.data?.data?.map((task: TaskRow) =>
              task.status === "completed" ? (
                <Item
                  key={task.id}
                  variant="muted"
                  className="w-full bg-gray-100"
                >
                  <ItemContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Checkbox checked={task.status === "completed"} />
                        <div>
                          <ItemTitle className="text-sm font-semibold">
                            {task.task.title}
                          </ItemTitle>
                          <ItemDescription className="text-xs font-light">
                            {task.task.description}
                          </ItemDescription>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <EllipsisVertical className="h-6 w-6" />
                      </button>
                    </div>
                  </ItemContent>
                </Item>
              ) : (
                <Item key={task.id} variant="muted" className="w-full bg-white">
                  <ItemContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Checkbox />
                        <div>
                          <ItemTitle className="text-sm font-semibold">
                            {task.task.title}
                          </ItemTitle>
                          <ItemDescription className="text-xs font-light">
                            {task.task.description}
                          </ItemDescription>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <EllipsisVertical className="h-6 w-6" />
                      </button>
                    </div>
                  </ItemContent>
                </Item>
              ),
            )}
          </ItemGroup>

          {!showInlineCreateTask ? (
            <Item
              onClick={() => setShowInlineCreateTask(true)}
              className="mt-4 rounded-sm border border-dashed border-gray-300 py-4 hover:bg-gray-100 cursor-pointer"
            >
              <ItemContent>
                <div className="w-full flex flex-col items-center justify-center gap-2">
                  <ItemTitle className="text-lg font-md">
                    Create New Task
                  </ItemTitle>
                  <PlusCircle className="h-6 w-6 text-[#0F172A] hover:text-gray-700" />
                </div>
              </ItemContent>
            </Item>
          ) : (
            <CreateTask onClose={onClose} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
