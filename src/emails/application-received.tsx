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
  ownerName: string;
  applicantName: string;
  applicantHandle: string;
  roleTitle: string;
  productName: string;
  productSlug: string;
  coverNoteSnippet: string;
  appUrl: string;
};

export function ApplicationReceivedEmail({
  ownerName,
  applicantName,
  applicantHandle,
  roleTitle,
  productName,
  productSlug,
  coverNoteSnippet,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {applicantName} applied for {roleTitle} on {productName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Application Received</Heading>
          <Text style={text}>Hey {ownerName},</Text>
          <Text style={text}>
            <strong>
              {applicantName} (@{applicantHandle})
            </strong>{" "}
            just applied for the <strong>{roleTitle}</strong> role on{" "}
            <strong>{productName}</strong>.
          </Text>
          {coverNoteSnippet && (
            <Section style={quoteSection}>
              <Text style={quote}>&ldquo;{coverNoteSnippet}&rdquo;</Text>
            </Section>
          )}
          <Section style={btnSection}>
            <Button href={`${appUrl}/products/${productSlug}/team`} style={button}>
              Review Application
            </Button>
          </Section>
          <Text style={footer}>
            You received this because you&apos;re a team owner on BuildSpace.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const h1 = { fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "24px" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", marginBottom: "12px" };
const quoteSection = { backgroundColor: "#f1f5f9", borderLeft: "4px solid #0f172a", padding: "12px 16px", borderRadius: "4px", marginBottom: "24px" };
const quote = { fontSize: "14px", color: "#475569", lineHeight: "1.6", fontStyle: "italic", margin: "0" };
const btnSection = { textAlign: "center" as const, marginTop: "32px", marginBottom: "32px" };
const button = { backgroundColor: "#0f172a", color: "#ffffff", borderRadius: "6px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#94a3b8", marginTop: "32px" };
