import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  applicantName: string;
  roleTitle: string;
  productName: string;
  productSlug: string;
  decision: "accepted" | "rejected";
  appUrl: string;
};

export function ApplicationDecidedEmail({
  applicantName,
  roleTitle,
  productName,
  productSlug,
  decision,
  appUrl,
}: Props) {
  const accepted = decision === "accepted";
  return (
    <Html>
      <Head />
      <Preview>
        Your application for {roleTitle} was {decision}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{accepted ? "🎉 You're in!" : "Application Update"}</Heading>
          <Text style={text}>Hey {applicantName},</Text>
          {accepted ? (
            <>
              <Text style={text}>
                Your application for <strong>{roleTitle}</strong> on{" "}
                <strong>{productName}</strong> was <strong>accepted</strong>. You&apos;re now a team
                member — time to ship.
              </Text>
              <Section style={btnSection}>
                <Button href={`${appUrl}/products/${productSlug}/team`} style={button}>
                  Go to Build Room
                </Button>
              </Section>
            </>
          ) : (
            <>
              <Text style={text}>
                Your application for <strong>{roleTitle}</strong> on{" "}
                <strong>{productName}</strong> was not selected this time. The team has received
                multiple applications and chose a different candidate.
              </Text>
              <Text style={text}>
                Keep building your Execution Score and apply to other open roles.
              </Text>
              <Section style={btnSection}>
                <Button href={`${appUrl}/feed`} style={button}>
                  Browse Open Roles
                </Button>
              </Section>
            </>
          )}
          <Text style={footer}>BuildSpace — execution-first builder platform.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const h1 = { fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "24px" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", marginBottom: "12px" };
const btnSection = { textAlign: "center" as const, marginTop: "32px", marginBottom: "32px" };
const button = { backgroundColor: "#0f172a", color: "#ffffff", borderRadius: "6px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#94a3b8", marginTop: "32px" };
