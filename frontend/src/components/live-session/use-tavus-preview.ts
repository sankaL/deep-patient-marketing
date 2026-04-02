import { useState } from "react";

type TavusPreviewState = "idle" | "loading" | "active" | "error";
type TavusPreviewEndReason = "client_closed" | "window_unload" | "timeout" | "error";

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
  preview_session_id: string;
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
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<TavusPreviewState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startSession = async (options?: { demoRequestId?: string }) => {
    if (status === "loading" || conversationUrl) {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/tavus/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demo_request_id: options?.demoRequestId ?? null,
        }),
      });
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
          !payload.conversation_url ||
          typeof payload.preview_session_id !== "string" ||
          !payload.preview_session_id
      ) {
        throw new Error(DEFAULT_ERROR_MESSAGE);
      }

      setConversationUrl(payload.conversation_url);
      setPreviewSessionId(payload.preview_session_id);
      setStatus("active");
    } catch (error) {
      setConversationUrl(null);
      setPreviewSessionId(null);
      setStatus("error");
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : DEFAULT_ERROR_MESSAGE
      );
    }
  };

  const completeSession = async (
    endReason: TavusPreviewEndReason,
    options?: {
      errorMessage?: string | null;
      nextStatus?: TavusPreviewState;
    },
  ) => {
    const currentPreviewSessionId = previewSessionId;

    if (currentPreviewSessionId) {
      try {
        await fetch(`/api/tavus/preview-sessions/${currentPreviewSessionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ end_reason: endReason }),
          keepalive: endReason === "window_unload",
        });
      } catch {
        // Best-effort completion keeps the UI responsive if the user leaves abruptly.
      }
    }

    setConversationUrl(null);
    setPreviewSessionId(null);
    setStatus(options?.nextStatus ?? "idle");
    setErrorMessage(options?.errorMessage ?? null);
  };

  const resetSession = () => {
    setConversationUrl(null);
    setPreviewSessionId(null);
    setStatus("idle");
    setErrorMessage(null);
  };

  return {
    conversationUrl,
    completeSession,
    errorMessage,
    isActive: status === "active" && Boolean(conversationUrl),
    isLoading: status === "loading",
    previewSessionId,
    resetSession,
    startSession,
    status,
  };
}
