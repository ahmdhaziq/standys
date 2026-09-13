"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, FieldSet, FieldLabel, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { login } from "../api/login";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export default function LoginCard() {
  type LoginForm = { email: string; password: string };
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
  } = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);

      toast.add({
        type: "success",
        description: "Successfully Logged In.",
      });

      router.push("/task");
    } catch (error) {
      toast.add({
        type: "error",
        description:
          error instanceof Error ? error.message : "Invalid Email or Password.",
      });
      reset();
    }
  };
  return (
    <Card className="rounded-sm">
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#4F46E5] flex items-center justify-center">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">Welcome Back</h1>
          <h4 className="text-sm text-muted-foreground">
            Please log in to your account to continue.
          </h4>
          <Button
            variant="default"
            size="lg"
            className="w-full rounded-sm border-2 border-[#0F172A] bg-gray-200 text-[#0F172A]"
          >
            Log in with Google
          </Button>
          <p className="text-sm text-muted-foreground">or</p>
          <div className="flex flex-col w-full">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="rounded-sm h-12"
                    {...register("email")}
                  />
                </Field>
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="Enter your password"
                    className="rounded-sm h-12"
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
            <Button
              onClick={handleSubmit(onSubmit)}
              className="w-full mt-4 rounded-sm"
              variant="default"
              size="lg"
            >
              Log in
            </Button>
            <div className="flex justify-center items-center mt-2">
              <p className="text-sm">
                Don&apos;t have an account?{" "}
                <a
                  href="/auth/register"
                  className="text-blue-500 hover:underline"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
