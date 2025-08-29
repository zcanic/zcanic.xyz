"""
Voicevox Service for interacting with a Voicevox engine.
"""
import os
import uuid
import time
from typing import Optional, Tuple, List, Dict, Any
from pathlib import Path

import httpx
from loguru import logger

from voice_app.utils.config_manager import get_config, BASE_DIR as APP_BASE_DIR # App base for resolving paths

class VoicevoxService:
    def __init__(self):
        config_all = get_config()
        self.service_config = config_all.get("voicevox", {})
        self.server_config = config_all.get("server", {})

        self.engine_url = self.service_config.get("engine_url")
        self.default_speaker_id = int(self.service_config.get("default_speaker_id", 1))
        self.timeout_seconds = int(self.service_config.get("timeout_seconds", 30))
        
        audio_params_cfg = self.service_config.get("audio_parameters", {})
        self.speed_scale = float(audio_params_cfg.get("speed_scale", 1.0))
        self.pitch_scale = float(audio_params_cfg.get("pitch_scale", 0.0))
        self.intonation_scale = float(audio_params_cfg.get("intonation_scale", 1.0))
        self.volume_scale = float(audio_params_cfg.get("volume_scale", 1.0))
        self.output_format = audio_params_cfg.get("output_format", "wav").lower()

        raw_storage_path = self.server_config.get("audio_storage_path", "./audio_storage")
        self.audio_storage_dir = Path(raw_storage_path)
        if not self.audio_storage_dir.is_absolute():
            self.audio_storage_dir = APP_BASE_DIR / raw_storage_path
        
        try:
            self.audio_storage_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Audio storage directory ensured: {self.audio_storage_dir}")
        except OSError as e:
            logger.critical(f"Failed to create audio storage directory {self.audio_storage_dir}: {e}", exc_info=True)
            # This could be a fatal error for the service's operation.
            # Depending on requirements, might raise an exception or try to operate without saving files.

        if not self.engine_url:
            logger.error("Voicevox engine URL is not configured. Voice synthesis will fail.")
            # raise ValueError("VOICEVOX_ENGINE_URL must be set for VoicevoxService")

        logger.info(f"VoicevoxService initialized. Engine URL: {self.engine_url}")

    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        is_stream: bool = False
    ) -> httpx.Response:
        if not self.engine_url:
            raise ConnectionError("Voicevox engine URL not configured.")

        url = f"{self.engine_url.rstrip('/')}/{endpoint.lstrip('/')}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.request(method, url, params=params, json=json_data)
                response.raise_for_status() # Raise HTTPStatusError for 4xx/5xx responses
                return response
        except httpx.TimeoutException as e:
            logger.error(f"Voicevox request timeout for {method} {url}: {e}")
            raise
        except httpx.RequestError as e: # Catches ConnectError, ReadTimeout, etc.
            logger.error(f"Voicevox request error for {method} {url}: {e}")
            raise
        except httpx.HTTPStatusError as e: # Already logged by raise_for_status, but good to be explicit
            logger.error(f"Voicevox HTTP error for {method} {url}: {e.response.status_code} - {e.response.text}")
            raise

    async def get_speakers(self) -> List[Dict[str, Any]]:
        try:
            response = await self._make_request("GET", "speakers")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get Voicevox speakers: {e}")
            return []

    async def generate_speech(
        self, 
        text: str, 
        speaker_id: Optional[int] = None,
        request_id: Optional[str] = None
    ) -> Optional[Tuple[bytes, str]]:
        """Generates speech and saves it to a file. Returns audio data and filename."""
        if not text:
            logger.warning(f"Empty text for speech synthesis. [ID: {request_id}]")
            return None
        
        speaker_to_use = speaker_id if speaker_id is not None else self.default_speaker_id
        log_id = request_id or str(uuid.uuid4())

        logger.debug(f"Requesting audio_query for speaker {speaker_to_use}. [ID: {log_id}]")
        try:
            # 1. Get audio query
            query_params = {"text": text, "speaker": speaker_to_use}
            query_response = await self._make_request("POST", "audio_query", params=query_params)
            audio_query_data = query_response.json()

            # Apply local audio parameters if any are different from Voicevox defaults
            audio_query_data["speedScale"] = self.speed_scale
            audio_query_data["pitchScale"] = self.pitch_scale
            audio_query_data["intonationScale"] = self.intonation_scale
            audio_query_data["volumeScale"] = self.volume_scale
            audio_query_data["outputStereo"] = False # Or make configurable
            audio_query_data["outputSamplingRate"] = audio_query_data.get("outputSamplingRate", 24000) # Keep original or set default

            logger.debug(f"Requesting synthesis for speaker {speaker_to_use}. [ID: {log_id}]")
            # 2. Synthesize audio
            synthesis_params = {"speaker": speaker_to_use}
            synthesis_response = await self._make_request(
                "POST", "synthesis", params=synthesis_params, json_data=audio_query_data, is_stream=True
            )
            audio_data = synthesis_response.content

            # 3. Save audio
            file_name = f"voice_{log_id}.{self.output_format}"
            file_path = self.audio_storage_dir / file_name
            with open(file_path, 'wb') as f:
                f.write(audio_data)
            logger.info(f"Speech audio saved to {file_path}. Size: {len(audio_data) / 1024:.2f} KB. [ID: {log_id}]")
            return audio_data, file_name

        except Exception as e:
            logger.error(f"Voicevox speech generation failed for [ID: {log_id}]: {e}", exc_info=True)
            return None

    def get_audio_file_url(self, file_path: Path) -> str:
        """Constructs a URL relative to the audio_storage mount point."""
        # Assumes audio_storage_dir is like /path/to/voice_app/audio_storage
        # And file_path is /path/to/voice_app/audio_storage/somefile.wav
        # We want /audio_storage/somefile.wav
        # This needs to align with how StaticFiles is mounted in main.py
        # THIS METHOD IS CURRENTLY NOT DIRECTLY USED FOR CLIENT URLs if orchestrator changes are made.
        relative_to_storage_root = file_path.relative_to(self.audio_storage_dir.parent) # audio_storage/filename.wav
        return f"/{relative_to_storage_root.as_posix()}" 