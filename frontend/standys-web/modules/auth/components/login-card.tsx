import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, FieldSet, FieldLabel, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";

export default function LoginCard() {
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
                  />
                </Field>
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    className="rounded-sm h-12"
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
            <Button
              className="w-full mt-4 rounded-sm"
              variant="default"
              size="lg"
            >
              Log in
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
