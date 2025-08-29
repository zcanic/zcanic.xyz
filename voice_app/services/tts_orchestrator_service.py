"""
TTS Orchestrator Service

Coordinates translation and voice synthesis services.
"""
import time
import uuid
from typing import Optional, Dict, Any
from pathlib import Path

from loguru import logger

from .translator_service import TranslatorService
from .voicevox_service import VoicevoxService
from voice_app.utils.config_manager import get_config # For any orchestrator-specific configs if needed

class TTSOrchestratorService:
    def __init__(self, translator: TranslatorService, voicevox: VoicevoxService):
        self.translator = translator
        self.voicevox = voicevox
        # Caching can be implemented here if desired, or rely on individual service caches
        # For simplicity, we'll assume individual services handle their own caching for now.
        logger.info("TTSOrchestratorService initialized.")

    async def process_text_to_speech(
        self,
        original_text: str,
        target_language: str = "Japanese", # Assuming target is always Japanese for now
        speaker_id: Optional[int] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes text through translation and speech synthesis.

        Returns a dictionary with success status, messages, translated text, and audio filename.
        """
        if not request_id:
            request_id = str(uuid.uuid4())
        
        start_total_time = time.time()
        response: Dict[str, Any] = {
            "success": False,
            "message": "An unexpected error occurred.",
            "original_text": original_text,
            "translated_text": None,
            "audio_filename": None,
            "duration_ms": 0,
            "request_id": request_id
        }

        if not original_text:
            response["message"] = "Input text cannot be empty."
            response["duration_ms"] = int((time.time() - start_total_time) * 1000)
            logger.warning(f"Empty input text for TTS. [ID: {request_id}]")
            return response

        # 1. Translate Text
        logger.info(f"Starting translation for [ID: {request_id}]. Text: '{original_text[:50]}...'")
        translated_text = await self.translator.translate(original_text, request_id=request_id)
        
        if translated_text is None: # Indicates translation failure
            response["message"] = "Failed to translate text."
            response["duration_ms"] = int((time.time() - start_total_time) * 1000)
            logger.error(f"Translation failed for [ID: {request_id}].")
            return response
        
        if not translated_text: # Empty string from translation, but not a failure from service
             response["message"] = "Translation resulted in empty text."
             response["translated_text"] = ""
             response["duration_ms"] = int((time.time() - start_total_time) * 1000)
             logger.warning(f"Translation resulted in empty text for [ID: {request_id}].")
             # Depending on requirements, might still try to synthesize empty string or just return.
             # For now, returning as potentially not an error, but no audio to generate.
             response["success"] = True # Or False if this is considered an error state
             return response

        response["translated_text"] = translated_text
        logger.info(f"Translation successful for [ID: {request_id}]. Translated: '{translated_text[:50]}...'")

        # 2. Synthesize Speech from translated text
        logger.info(f"Starting speech synthesis for [ID: {request_id}]. Text: '{translated_text[:50]}...'")
        speech_result = await self.voicevox.generate_speech(
            text=translated_text,
            speaker_id=speaker_id,
            request_id=request_id
        )

        if speech_result is None:
            response["message"] = "Failed to synthesize speech from translated text."
            response["duration_ms"] = int((time.time() - start_total_time) * 1000)
            logger.error(f"Speech synthesis failed for [ID: {request_id}].")
            return response
        
        _audio_data, audio_filename = speech_result
        response["audio_filename"] = audio_filename
        response["success"] = True
        response["message"] = "TTS process completed successfully."
        response["duration_ms"] = int((time.time() - start_total_time) * 1000)
        logger.info(f"TTS process completed successfully for [ID: {request_id}]. Audio filename: {audio_filename}")
        
        return response 