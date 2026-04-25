import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ideas, products } from "../../../../drizzle/schema";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "default";
  const slug = searchParams.get("slug") ?? "";

  let title = "BuildSpace";
  let subtitle = "Execute in public. Build your reputation.";
  let tag = "";

  if (type === "idea" && slug) {
    const rows = await db
      .select({ title: ideas.title, problem: ideas.problem })
      .from(ideas)
      .where(eq(ideas.slug, slug))
      .limit(1);
    const idea = rows[0];
    if (idea) {
      title = idea.title;
      subtitle = idea.problem.slice(0, 120) + (idea.problem.length > 120 ? "…" : "");
      tag = "Idea";
    }
  } else if (type === "product" && slug) {
    const rows = await db
      .select({ name: products.name, description: products.description, stage: products.stage })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    const product = rows[0];
    if (product) {
      title = product.name;
      subtitle = (product.description ?? "A product built on BuildSpace").slice(0, 120);
      tag = product.stage.charAt(0).toUpperCase() + product.stage.slice(1);
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              backgroundColor: "#7c3aed",
              borderRadius: "8px",
            }}
          >
            <span style={{ color: "white", fontSize: "20px", fontWeight: "700" }}>⚡</span>
          </div>
          <span style={{ color: "#a1a1aa", fontSize: "20px", fontWeight: "600" }}>BuildSpace</span>
          {tag && (
            <span
              style={{
                marginLeft: "8px",
                backgroundColor: "#27272a",
                color: "#a1a1aa",
                fontSize: "14px",
                padding: "4px 12px",
                borderRadius: "9999px",
              }}
            >
              {tag}
            </span>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span
            style={{
              color: "#fafafa",
              fontSize: title.length > 50 ? "40px" : "52px",
              fontWeight: "800",
              lineHeight: 1.15,
            }}
          >
            {title}
          </span>
          <span
            style={{
              color: "#71717a",
              fontSize: "24px",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#52525b", fontSize: "16px" }}>buildspace.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
