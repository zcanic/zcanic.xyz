"""
Pydantic Models for API Requests and Responses
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Common Models ---
class BaseResponse(BaseModel):
    success: bool = False
    message: Optional[str] = None
    request_id: Optional[str] = None
    duration_ms: Optional[int] = None

# --- TTS Endpoint --- 
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Chinese text to be translated and synthesized.")
    speaker_id: Optional[int] = Field(None, description="Voicevox speaker ID. If None, uses default from config.")
    # session_id: Optional[str] = Field(None, description="Optional session ID for context or logging.")
    # user_id: Optional[str] = Field(None, description="Optional user ID for context or logging.")

class TTSResponseData(BaseModel):
    original_text: str
    translated_text: Optional[str] = None
    audio_url: Optional[str] = None

class TTSProcessResponse(BaseResponse):
    data: Optional[TTSResponseData] = None

# --- Speakers Endpoint --- 
class SpeakerStyle(BaseModel):
    name: str
    id: int

class Speaker(BaseModel):
    name: str
    speaker_uuid: str
    styles: List[SpeakerStyle]
    version: Optional[str] = None

class SpeakersResponse(BaseResponse):
    speakers: Optional[List[Speaker]] = None

# --- Health Check Endpoint --- 
class ComponentHealth(BaseModel):
    status: bool
    # message: Optional[str] = None # Could add more details if needed

class HealthResponse(BaseModel):
    overall_status: str = Field(..., description="Overall health status of the service, e.g., 'healthy', 'degraded', 'unhealthy'")
    version: str
    components: Dict[str, ComponentHealth]

# --- API Key Info (Optional, if you want an endpoint to describe API key requirements) ---
# class APIKeyInfoResponse(BaseModel):
#     authentication_type: str = "Header"
#     header_name: str = "X-API-Key"
#     description: str = "API Key required for accessing protected endpoints." 