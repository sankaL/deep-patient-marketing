from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


OrgSizeBucket = Literal[
    "1–50",
    "51–150",
    "151–250",
    "251–500",
    "501–1,000",
    "1,001–2,500",
    "2,500+",
]


class DemoRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    institution: str = Field(default="", max_length=200)
    team_size_text: str = Field(default="", max_length=120)

    model_config = {"extra": "forbid"}


class DemoRequestResponse(BaseModel):
    success: bool
    message: str
    request_id: UUID


class PricingInquiryRequest(BaseModel):
    first_name: str = Field(alias="firstName", min_length=1, max_length=100)
    last_name: str = Field(alias="lastName", min_length=1, max_length=100)
    email: EmailStr
    institution: str = Field(min_length=1, max_length=200)
    org_size_bucket: OrgSizeBucket = Field(alias="orgSize")
    source: str = Field(default="", max_length=200)
    message: str = Field(default="", max_length=4000)

    model_config = {"populate_by_name": True}


class PricingInquiryResponse(BaseModel):
    success: bool
    message: str
    request_id: UUID
