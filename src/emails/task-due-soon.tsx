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
  assigneeName: string;
  taskTitle: string;
  productName: string;
  buildRoomId: string;
  dueDate: string;
  appUrl: string;
};

export function TaskDueSoonEmail({
  assigneeName,
  taskTitle,
  productName,
  buildRoomId,
  dueDate,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        Task due soon: {taskTitle} on {productName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Task Due Soon</Heading>
          <Text style={text}>Hey {assigneeName},</Text>
          <Text style={text}>
            A task assigned to you is due soon:
          </Text>
          <Section style={taskCard}>
            <Text style={taskTitle_}>{taskTitle}</Text>
            <Text style={meta}>
              {productName} · Due {dueDate}
            </Text>
          </Section>
          <Text style={text}>
            Remember: tasks closed without a proof link contribute 0 to your Execution Score.
          </Text>
          <Section style={btnSection}>
            <Button href={`${appUrl}/build-room/${buildRoomId}`} style={button}>
              Open Build Room
            </Button>
          </Section>
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
const taskCard = { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "24px" };
const taskTitle_ = { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0" };
const meta = { fontSize: "13px", color: "#64748b", margin: "0" };
const btnSection = { textAlign: "center" as const, marginTop: "32px", marginBottom: "32px" };
const button = { backgroundColor: "#0f172a", color: "#ffffff", borderRadius: "6px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#94a3b8", marginTop: "32px" };
