"""
DeepPatient Marketing — Backend API
FastAPI + Resend for email handling
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

try:
    import resend
except ImportError:
    resend = None  # type: ignore

app = FastAPI(title="DeepPatient Marketing API", version="1.0.0")

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Resend config ──
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "hello@deeppatient.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "team@deeppatient.com")

if resend and RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


# ── Models ──
class SubscribeRequest(BaseModel):
    email: EmailStr


class DemoRequest(BaseModel):
    name: str
    email: EmailStr
    institution: str = ""
    message: str = ""


# ── Endpoints ──
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "deeppatient-marketing"}


@app.post("/api/subscribe")
async def subscribe(payload: SubscribeRequest):
    """Newsletter subscription — sends a welcome email via Resend."""
    if not resend or not RESEND_API_KEY:
        # In development without Resend configured, just acknowledge
        print(f"[DEV] Newsletter subscribe: {payload.email}")
        return {"success": True, "message": "Subscribed (dev mode)"}

    try:
        resend.Emails.send(
            {
                "from": FROM_EMAIL,
                "to": [payload.email],
                "subject": "Welcome to DeepPatient!",
                "html": """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #202F31;">Welcome to DeepPatient!</h2>
                    <p style="color: #5C7066; line-height: 1.6;">
                        Thanks for subscribing. You'll receive updates on clinical education,
                        AI in medicine, and DeepPatient product news.
                    </p>
                    <p style="color: #5C7066;">— The DeepPatient Team</p>
                </div>
                """,
            }
        )
        return {"success": True, "message": "Subscribed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/demo-request")
async def demo_request(payload: DemoRequest):
    """Demo request — notifies admin via Resend."""
    if not resend or not RESEND_API_KEY:
        print(f"[DEV] Demo request: {payload.name} <{payload.email}>")
        return {"success": True, "message": "Demo request received (dev mode)"}

    try:
        # Notify admin
        resend.Emails.send(
            {
                "from": FROM_EMAIL,
                "to": [ADMIN_EMAIL],
                "subject": f"New Demo Request — {payload.name}",
                "html": f"""
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #202F31;">New Demo Request</h2>
                    <p><strong>Name:</strong> {payload.name}</p>
                    <p><strong>Email:</strong> {payload.email}</p>
                    <p><strong>Institution:</strong> {payload.institution or 'N/A'}</p>
                    <p><strong>Message:</strong> {payload.message or 'N/A'}</p>
                </div>
                """,
            }
        )

        # Confirmation to requester
        resend.Emails.send(
            {
                "from": FROM_EMAIL,
                "to": [payload.email],
                "subject": "Your DeepPatient Demo Request",
                "html": f"""
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #202F31;">Thanks, {payload.name}!</h2>
                    <p style="color: #5C7066; line-height: 1.6;">
                        We've received your demo request and will be in touch within 24 hours.
                    </p>
                    <p style="color: #5C7066;">— The DeepPatient Team</p>
                </div>
                """,
            }
        )

        return {"success": True, "message": "Demo request submitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
