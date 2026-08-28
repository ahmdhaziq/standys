'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

interface InlineCreateTaskProps {
  onClose: () => void;
}
export default function InlineCreateTask({ onClose }: InlineCreateTaskProps) {
const {register, handleSubmit, formState: { errors }} = useForm<>({
  defaultValues: {
    title: '',
    description: '',
  }
}
)
  return (
    <Card>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <Input placeholder="What needs to be done?" className="border-0" type="text"/>
            </Field>
            <Field>
              <Textarea className="border-0" rows={3} placeholder="Enter task description here..." />
            </Field>
          </FieldGroup>
        </FieldSet>
        <hr className="my-2 border-t border-gray-300" />
      </CardContent>
      <CardFooter>
        <div className="w-full flex items-center justify-end">
          <Button type="button" className="bg-[#4F46E5]">Create Task</Button>
          <Button type="button" className="bg-[#E5E7EB] text-[#1F2937] ml-2" onClick={onClose}>Cancel</Button>
        </div>
      </CardFooter>
    </Card>
  )
}