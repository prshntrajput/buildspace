import { Metadata } from "next";
import { IdeaForm } from "./idea-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "New Idea — BuildSpace",
  description: "Share your idea with the world and get AI-powered feedback.",
};

export default function NewIdeaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Share Your Idea</CardTitle>
          <CardDescription>
            Structure your idea so others can understand the problem, who it&apos;s for, and how you&apos;d solve it.
            AI will review it for clarity and market signal once published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IdeaForm />
        </CardContent>
      </Card>
    </div>
  );
}
