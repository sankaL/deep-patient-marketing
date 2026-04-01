import type { ContactFormData } from "@/components/live-session/contact-modal";

export type DemoRequestSource = "book_demo" | "live_preview";

interface DemoRequestResponse {
  request_id: string;
}

export async function submitDemoRequest(
  payload: ContactFormData,
  requestSource: DemoRequestSource,
): Promise<string> {
  const response = await fetch("/api/demo-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      institution: payload.institution ?? "",
      team_size_text: payload.teamSize ?? "",
      request_source: requestSource,
    }),
  });

  const responsePayload = (await response.json().catch(() => null)) as
    | DemoRequestResponse
    | { detail?: string }
    | null;

  if (!response.ok || !responsePayload || !("request_id" in responsePayload)) {
    const message =
      responsePayload &&
      typeof responsePayload === "object" &&
      "detail" in responsePayload &&
      typeof responsePayload.detail === "string"
        ? responsePayload.detail
        : "We could not capture your request right now. Please try again.";
    throw new Error(message);
  }

  return responsePayload.request_id;
}
