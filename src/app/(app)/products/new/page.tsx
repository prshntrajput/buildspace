import { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductForm } from "./product-form";

export const metadata: Metadata = {
  title: "New Product — BuildSpace",
  description: "Create a product and start building in public.",
};

export default function NewProductPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a Product</CardTitle>
          <CardDescription>
            This will set up a Build Room for tracking tasks, posting updates, and building your Execution Score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ProductForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
