import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type DigestProduct = {
  name: string;
  slug: string;
  summary: string;
  highlights: string[];
  momentum: "strong" | "steady" | "slow";
};

type Props = {
  displayName: string;
  weekLabel: string;
  products: DigestProduct[];
  totalScore: number;
  scoreDelta7d: number;
  rankBucket: string;
  appUrl: string;
};

const MOMENTUM_EMOJI: Record<string, string> = {
  strong: "🔥",
  steady: "📈",
  slow: "🐌",
};

export function WeeklyDigestEmail({
  displayName,
  weekLabel,
  products,
  totalScore,
  scoreDelta7d,
  rankBucket,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your BuildSpace weekly digest — {weekLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Week in Building</Heading>
          <Text style={subheading}>{weekLabel}</Text>
          <Text style={text}>Hey {displayName},</Text>

          {/* Score summary */}
          <Section style={scoreCard}>
            <Text style={scoreLabel}>Execution Score</Text>
            <Text style={scoreValue}>{Math.round(totalScore)}</Text>
            <Text style={scoreMeta}>
              {scoreDelta7d >= 0 ? "+" : ""}
              {Math.round(scoreDelta7d)} this week · {rankBucket.charAt(0).toUpperCase() + rankBucket.slice(1)}
            </Text>
          </Section>

          {products.length > 0 ? (
            products.map((p, i) => (
              <Section key={i} style={productSection}>
                <Text style={productName}>
                  {MOMENTUM_EMOJI[p.momentum] ?? "📊"} {p.name}
                </Text>
                <Text style={productSummary}>{p.summary}</Text>
                {p.highlights.length > 0 && (
                  <ul style={ul}>
                    {p.highlights.map((h, j) => (
                      <li key={j} style={li}>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            ))
          ) : (
            <Text style={text}>No active products this week. Time to start building!</Text>
          )}

          <Hr style={hr} />

          <Section style={btnSection}>
            <Button href={`${appUrl}/feed`} style={button}>
              Go to BuildSpace
            </Button>
          </Section>
          <Text style={footer}>
            BuildSpace weekly digest. Manage preferences in{" "}
            <a href={`${appUrl}/settings/notifications`} style={link}>
              notification settings
            </a>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const h1 = { fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" };
const subheading = { fontSize: "14px", color: "#64748b", marginBottom: "24px", marginTop: "0" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", marginBottom: "12px" };
const scoreCard = { backgroundColor: "#0f172a", borderRadius: "10px", padding: "20px", textAlign: "center" as const, marginBottom: "28px" };
const scoreLabel = { fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 4px 0" };
const scoreValue = { fontSize: "40px", fontWeight: "700", color: "#ffffff", margin: "0 0 4px 0" };
const scoreMeta = { fontSize: "13px", color: "#94a3b8", margin: "0" };
const productSection = { marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e2e8f0" };
const productName = { fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" };
const productSummary = { fontSize: "14px", color: "#475569", lineHeight: "1.6", marginBottom: "8px" };
const ul = { paddingLeft: "20px", margin: "8px 0" };
const li = { fontSize: "13px", color: "#64748b", marginBottom: "4px" };
const hr = { borderColor: "#e2e8f0", margin: "24px 0" };
const btnSection = { textAlign: "center" as const, marginTop: "24px", marginBottom: "32px" };
const button = { backgroundColor: "#0f172a", color: "#ffffff", borderRadius: "6px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#94a3b8", marginTop: "32px" };
const link = { color: "#64748b" };
