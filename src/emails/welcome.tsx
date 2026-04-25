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
  displayName: string;
  handle: string;
  appUrl: string;
};

export function WelcomeEmail({ displayName, handle, appUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BuildSpace, {displayName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to BuildSpace</Heading>
          <Text style={text}>
            Hey {displayName} (@{handle}),
          </Text>
          <Text style={text}>
            You&apos;re now on BuildSpace — the platform where builders execute in public and build
            their Execution Score one shipped task at a time.
          </Text>
          <Text style={text}>Here&apos;s what to do next:</Text>
          <Text style={listItem}>1. Post your first idea or browse products to join</Text>
          <Text style={listItem}>2. Start a Build Room and add tasks with proof links</Text>
          <Text style={listItem}>3. Ship weekly updates to grow your Execution Score</Text>
          <Section style={btnSection}>
            <Button href={`${appUrl}/feed`} style={button}>
              Go to your Feed
            </Button>
          </Section>
          <Text style={footer}>
            BuildSpace — execution-first builder platform. Unsubscribe in settings.
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
const listItem = { fontSize: "15px", color: "#334155", lineHeight: "1.6", marginBottom: "8px", paddingLeft: "8px" };
const btnSection = { textAlign: "center" as const, marginTop: "32px", marginBottom: "32px" };
const button = { backgroundColor: "#0f172a", color: "#ffffff", borderRadius: "6px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#94a3b8", marginTop: "32px" };
