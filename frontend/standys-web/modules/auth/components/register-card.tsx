"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterUser,
  registerUserSchema,
} from "../schema/register-user.schema";
import { FieldErrors, useForm } from "react-hook-form";
import { registerUser } from "../api/register";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export default function RegisterCard() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (dto: RegisterUser) => {
    try {
      await registerUser(dto);

      toast.add({
        type: "success",
        description: "Account created successfully",
      });

      router.push("/auth/login");
    } catch (error) {
      toast.add({
        type: "error",
        description:
          error instanceof Error ? error.message : "Registration failed",
      });

      reset();
    }
  };

  const onInvalid = (errors: FieldErrors<RegisterUser>) => {
    const firstError = Object.values(errors)[0];

    if (firstError?.message) {
      toast.add({ type: "error", description: firstError.message });
    }
  };

  return (
    <Card className="rounded-sm max-w-sm">
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#4F46E5] flex items-center justify-center">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">Register An Account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to create an account
          </p>
          <div className="flex flex-col w-full">
            <FieldSet>
              <Field>
                <FieldLabel>Full Name</FieldLabel>
                <Input
                  className="h-12 rounded-sm bg-[#EFF1F3]"
                  {...register("name")}
                />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  className="h-12 rounded-sm bg-[#EFF1F3]"
                  type="email"
                  {...register("email")}
                />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  className="h-12 rounded-sm bg-[#EFF1F3]"
                  type="password"
                  {...register("password")}
                />
                <FieldDescription className="text-xs text-muted-foreground">
                  Your password must be at least <b>6</b> characters long,
                  containing at least one <b>uppercase</b> letter, one{" "}
                  <b>lowercase</b> letter, one <b>number</b>, and one{" "}
                  <b>special character</b>.
                </FieldDescription>
              </Field>
            </FieldSet>
            <Button
              className="w-full mt-4 rounded-sm bg-[#4F46E5] text-white hover:bg-[#4338CA]"
              variant="default"
              size="lg"
              onClick={handleSubmit(onSubmit, onInvalid)}
            >
              Register Account
              <LogIn className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
