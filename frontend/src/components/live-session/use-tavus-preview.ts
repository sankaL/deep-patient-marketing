import { useState } from "react";

type TavusPreviewState = "idle" | "loading" | "active" | "error";

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

interface TavusErrorResponse {
  detail?: string | { message?: string };
}

const DEFAULT_ERROR_MESSAGE =
  "The live preview is unavailable right now. Please try again later.";

function readErrorMessage(payload: TavusErrorResponse | TavusConversationResponse | null) {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return DEFAULT_ERROR_MESSAGE;
  }

  const { detail } = payload;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string" &&
    detail.message.trim()
  ) {
    return detail.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}

export function useTavusPreview() {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<TavusPreviewState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startSession = async () => {
    if (status === "loading" || conversationUrl) {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/tavus/conversation", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as
        | TavusConversationResponse
        | TavusErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(readErrorMessage(payload));
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !("conversation_url" in payload) ||
        typeof payload.conversation_url !== "string" ||
        !payload.conversation_url
      ) {
        throw new Error(DEFAULT_ERROR_MESSAGE);
      }

      setConversationUrl(payload.conversation_url);
      setStatus("active");
    } catch (error) {
      setConversationUrl(null);
      setStatus("error");
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : DEFAULT_ERROR_MESSAGE
      );
    }
  };

  const resetSession = () => {
    setConversationUrl(null);
    setStatus("idle");
    setErrorMessage(null);
  };

  return {
    conversationUrl,
    errorMessage,
    isActive: status === "active" && Boolean(conversationUrl),
    isLoading: status === "loading",
    resetSession,
    startSession,
    status,
  };
}