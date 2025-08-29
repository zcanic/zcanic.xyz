"""
API Routes for Zcanic Voice App
"""
import uuid
import time
from typing import Optional, List, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Request, Response, Query
from fastapi.responses import FileResponse, JSONResponse
from starlette import status
from loguru import logger

from voice_app.api.models import (
    TTSRequest, TTSProcessResponse, TTSResponseData,
    SpeakersResponse, Speaker as SpeakerModel,
    HealthResponse, ComponentHealth,
    BaseResponse # For generic error responses if needed
)
from voice_app.services import (
    TranslatorService, 
    VoicevoxService, 
    TTSOrchestratorService
)
from voice_app.utils.config_manager import get_config
from voice_app.version import __version__ # We will create this file next

router = APIRouter(prefix="/v1") # Prefix all API routes with /api/v1

# --- Dependency for API Key Authentication (Optional) ---
async def verify_api_key(
    x_api_key: Optional[str] = Header(None, description="Your secret API Key for authentication.")
) -> None:
    config = get_config()
    configured_api_key = config.get("server", {}).get("api_key")
    
    if configured_api_key: # Only enforce if api_key is configured in settings
        if not x_api_key:
            logger.warning("Missing X-API-Key header in request to protected endpoint.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="X-API-Key header missing.",
                headers={"WWW-Authenticate": "ApiKey"}
            )
        if x_api_key != configured_api_key:
            logger.warning("Invalid API Key received.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API Key.",
                headers={"WWW-Authenticate": "ApiKey"}
            )
        logger.debug("API Key verified successfully.")
    else:
        logger.debug("No API key configured in server settings, access granted without key.")

# --- Service Instantiation (Consider using FastAPI's dependency injection for these) ---
# For simplicity in rebuild, direct instantiation. For larger apps, use Depends for services.
# These will be initialized when the module is first imported.
_translator_service = TranslatorService()
_voicevox_service = VoicevoxService()
_tts_orchestrator = TTSOrchestratorService(translator=_translator_service, voicevox=_voicevox_service)

# --- API Endpoints ---

@router.post("/tts", 
             response_model=TTSProcessResponse, 
             summary="Text-to-Speech Conversion",
             description="Translates Chinese text to Japanese and synthesizes Japanese speech using Voicevox.",
             dependencies=[Depends(verify_api_key)])
async def process_tts(request_data: TTSRequest, request: Request):
    request_id = str(uuid.uuid4())
    logger.info(f"TTS request received [ID: {request_id}]. Text: '{request_data.text[:50]}...', Speaker ID: {request_data.speaker_id}")
    
    start_time = time.time()
    try:
        orchestrator_result = await _tts_orchestrator.process_text_to_speech(
            original_text=request_data.text,
            speaker_id=request_data.speaker_id,
            request_id=request_id
        )
        duration_ms = int((time.time() - start_time) * 1000)

        if orchestrator_result["success"]:
            return TTSProcessResponse(
                success=True,
                message=orchestrator_result.get("message", "TTS process completed."),
                request_id=request_id,
                duration_ms=duration_ms,
                data=TTSResponseData(
                    original_text=orchestrator_result["original_text"],
                    translated_text=orchestrator_result["translated_text"],
                    audio_url=f"{request.url_for('serve_audio_file', filename=orchestrator_result['audio_filename'])}" if orchestrator_result.get("audio_filename") else None
                 )
            )
        else:
            logger.error(f"TTS processing failed for [ID: {request_id}]. Reason: {orchestrator_result.get('message')}")
            # Return a 500 error if the orchestrator signals a failure but not a specific HTTP error
            # Or choose a more specific error code based on the failure type if available
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=orchestrator_result.get("message", "TTS processing failed internally.")
            )

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.exception(f"Unhandled exception in /tts endpoint for [ID: {request_id}]: {e}")
        # Consider if a more generic error response model is needed or if HTTPException is enough
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}"
        )

@router.get("/speakers", 
            response_model=SpeakersResponse, 
            summary="Get Available Speakers",
            description="Retrieves a list of available Voicevox speakers.",
            dependencies=[Depends(verify_api_key)])
async def get_speakers():
    request_id = str(uuid.uuid4())
    logger.info(f"Request for speakers list [ID: {request_id}]")
    start_time = time.time()
    try:
        speakers_data = await _voicevox_service.get_speakers()
        duration_ms = int((time.time() - start_time) * 1000)
        
        if speakers_data is not None: # Check if list is returned (even if empty)
             # Assuming speakers_data is already in the Pydantic model-compatible format from VoicevoxService
            return SpeakersResponse(
                success=True, 
                speakers=[SpeakerModel(**s) for s in speakers_data],
                request_id=request_id,
                duration_ms=duration_ms,
                message="Successfully retrieved speakers."
            )
        else:
            logger.error(f"Failed to retrieve speakers, service returned None [ID: {request_id}]")
            return SpeakersResponse(
                success=False, 
                speakers=[], 
                request_id=request_id, 
                duration_ms=duration_ms, 
                message="Failed to retrieve speakers from Voicevox engine."
            ) # Consider returning 503 if VV engine is unreachable

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.exception(f"Error fetching speakers [ID: {request_id}]: {e}")
        return SpeakersResponse(
            success=False, 
            speakers=[], 
            request_id=request_id, 
            duration_ms=duration_ms, 
            message=f"Server error fetching speakers: {str(e)}"
        ) # Consider 500 or 503

@router.get("/audio/{filename:path}", 
            name="serve_audio_file",
            summary="Serve Audio File",
            description="Serves a previously generated audio file. Access control via API key if configured.",
            dependencies=[Depends(verify_api_key)])
async def serve_audio_file(filename: str):
    request_id = str(uuid.uuid4())
    logger.info(f"Request to serve audio file: {filename} [ID: {request_id}]")
    try:
        # Construct the full path to the audio file
        # VoicevoxService.audio_storage_dir should be the absolute path to the storage
        file_path = _voicevox_service.audio_storage_dir / filename
        
        if not file_path.is_file():
            logger.warning(f"Audio file not found: {file_path} [ID: {request_id}]")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found.")
        
        # Determine media type based on file extension, default to wav
        media_type = "audio/wav"
        if filename.lower().endswith(".mp3"):
            media_type = "audio/mpeg"
        elif filename.lower().endswith(".ogg"):
            media_type = "audio/ogg"
        
        return FileResponse(file_path, media_type=media_type, filename=filename)
    except HTTPException: # Re-raise HTTPException if already one (like 404)
        raise
    except Exception as e:
        logger.exception(f"Error serving audio file {filename} [ID: {request_id}]: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error serving audio file.")


@router.get("/health", 
            response_model=HealthResponse, 
            summary="Health Check",
            description="Provides the health status of the service and its components.")
async def health_check():
    request_id = str(uuid.uuid4())
    logger.debug(f"Health check requested [ID: {request_id}]")
    start_time = time.time()
    components_health: Dict[str, ComponentHealth] = {}
    overall_healthy = True

    # Check Voicevox Engine
    vv_healthy = False
    if _voicevox_service.engine_url:
        try:
            # A lightweight check, like getting speakers or a version endpoint if available
            # For now, using the existing get_speakers as a proxy for health
            # A dedicated /version or /health endpoint on Voicevox itself would be better.
            speakers = await _voicevox_service.get_speakers() # This might be too heavy for a frequent health check
            # If Voicevox had a simple /version or /health:
            # async with httpx.AsyncClient(timeout=5) as client:
            #     resp = await client.get(f"{_voicevox_service.engine_url.rstrip('/')}/version") # or /health
            #     if resp.status_code == 200:
            #         vv_healthy = True
            if speakers is not None: # If get_speakers didn't error and returned a list (even empty)
                vv_healthy = True
        except Exception as e:
            logger.warning(f"Voicevox engine health check failed: {e} [ID: {request_id}]")
            overall_healthy = False 
    else:
        logger.warning("Voicevox engine URL not configured, marking as unhealthy. [ID: {request_id}]")
        overall_healthy = False # If not configured, it's not healthy for operations
    components_health["voicevox_engine"] = ComponentHealth(status=vv_healthy)

    # Check Translator Service (e.g., OpenAI API Key)
    translator_healthy = _translator_service.client is not None
    if not translator_healthy:
        logger.warning("Translator service (OpenAI client) not initialized, marking as unhealthy. [ID: {request_id}]")
        overall_healthy = False
    components_health["ai_translator"] = ComponentHealth(status=translator_healthy)
    
    current_status = "healthy" if overall_healthy else "degraded"
    # Could be 'unhealthy' if a critical component is down entirely

    duration_ms = int((time.time() - start_time) * 1000)
    return HealthResponse(
        overall_status=current_status,
        version=__version__,
        components=components_health,
        # success and message from BaseResponse are not used here directly but could be if needed
        # request_id=request_id, # Health checks usually don't need request_id in response
        # duration_ms=duration_ms
    ) 