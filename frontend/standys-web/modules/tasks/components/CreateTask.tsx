"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { CreateTaskInput } from "../schema/create-task.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../api/create-task";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface CreateTaskProps {
  onClose: () => void;
}
export default function CreateTask({ onClose }: CreateTaskProps) {
  const {
    register,
    handleSubmit,
  } = useForm<CreateTaskInput>({
    defaultValues: {
      title: "",
      description: "",
    },
  });
  const router = useRouter();
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (response) => {
      if (!response.ok) {
        if (response.status === 401) {
          toast.add({
            type: "error",
            description: "Unauthorized. Please log in again.",
          });
          router.push("/auth/login");
        } else {
          toast.add({
            type: "error",
            description:
              response.error || "An error occurred while creating the task.",
          });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        onClose();
      }
    },
    onError: (error: Error) => {
      if (error.message.includes("401")) {
          toast.add({
            type: "error",
            description: "Unauthorized. Please log in.",
          });
          router.push("/auth/login");
      }
      toast.add({
        type: "error",
        description: error.message || "An error occurred while creating the task.",
      });
    },
  });

  return (
    <Card>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <Input
                {...register("title")}
                placeholder="What needs to be done?"
                className="border-0"
                type="text"
              />
            </Field>
            <Field>
              <Textarea
                {...register("description")}
                className="border-0"
                rows={3}
                placeholder="Enter task description here..."
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <hr className="my-2 border-t border-gray-300" />
      </CardContent>
      <CardFooter>
        <div className="w-full flex items-center justify-end">
          <Button
            type="button"
            onClick={handleSubmit((data) => createTaskMutation.mutate(data))}
            className="bg-[#4F46E5]"
          >
            Create Task
          </Button>
          <Button
            type="button"
            className="bg-[#E5E7EB] text-[#1F2937] ml-2"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
