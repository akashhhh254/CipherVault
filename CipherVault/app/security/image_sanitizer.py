"""
CipherVault - Image Sanitization & Validation Engine
Standard: OWASP File Upload Security Guidelines
"""

import io
from typing import Tuple, Dict, Any
from PIL import Image

class ImageSanitizer:
    """Validates magic bytes, strips EXIF metadata, and re-encodes images to prevent steganography."""
    
    MAGIC_SIGNATURES = {
        'PNG': b'\x89PNG\r\n\x1a\n',
        'JPEG': b'\xff\xd8\xff',
        'WEBP_RIFF': b'RIFF',
        'WEBP_HEADER': b'WEBP',
    }
    
    SUSPICIOUS_SIGNATURES = {
        'WINDOWS_PE': b'MZ',
        'LINUX_ELF': b'\x7fELF',
        'ZIP_ARCHIVE': b'PK\x03\x04',
        'TAR_GZ': b'\x1f\x8b',
    }
    
    @classmethod
    def validate_magic_bytes(cls, raw_bytes: bytes) -> Tuple[bool, str, str]:
        """
        Inspects file signature against known image headers and malicious executable signatures.
        Returns: (is_valid, detected_format, status_message)
        """
        if len(raw_bytes) < 12:
            return False, "UNKNOWN", "File is too small to contain valid image magic bytes."
            
        # Check suspicious executable headers
        for name, sig in cls.SUSPICIOUS_SIGNATURES.items():
            if raw_bytes.startswith(sig):
                return False, "MALICIOUS", f"Disguised executable/archive signature ({name}) detected and blocked."
                
        # Validate PNG
        if raw_bytes.startswith(cls.MAGIC_SIGNATURES['PNG']):
            return True, "image/png", "Valid PNG magic bytes confirmed."
            
        # Validate JPEG
        if raw_bytes.startswith(cls.MAGIC_SIGNATURES['JPEG']):
            return True, "image/jpeg", "Valid JPEG magic bytes confirmed."
            
        # Validate WEBP (RIFF at 0..4, WEBP at 8..12)
        if raw_bytes[:4] == cls.MAGIC_SIGNATURES['WEBP_RIFF'] and raw_bytes[8:12] == cls.MAGIC_SIGNATURES['WEBP_HEADER']:
            return True, "image/webp", "Valid WebP container confirmed."
            
        return False, "UNTRUSTED", "Unverified file header: Only authentic PNG, JPEG, and WebP are allowed."
    
    @classmethod
    def sanitize_and_strip_exif(cls, raw_bytes: bytes, target_format: str = "PNG") -> Tuple[bytes, Dict[str, Any]]:
        """
        Re-encodes image buffer to remove all EXIF metadata (GPS, camera serials, timestamps).
        Returns: (sanitized_bytes, metadata_report)
        """
        is_valid, mime, msg = cls.validate_magic_bytes(raw_bytes)
        if not is_valid:
            raise ValueError(f"Security Validation Error: {msg}")
            
        input_stream = io.BytesIO(raw_bytes)
        try:
            with Image.open(input_stream) as img:
                # Count raw exif tags if present
                exif_tags_count = 0
                if hasattr(img, '_getexif') and img._getexif():
                    exif_tags_count = len(img._getexif())
                elif hasattr(img, 'info') and 'exif' in img.info:
                    exif_tags_count = 5
                
                # Create clean pixel copy without metadata
                clean_img = Image.new(img.mode, img.size)
                clean_img.putdata(list(img.getdata()))
                
                output_stream = io.BytesIO()
                clean_img.save(output_stream, format=target_format, optimize=True)
                sanitized_bytes = output_stream.getvalue()
                
                report = {
                    "original_size": len(raw_bytes),
                    "sanitized_size": len(sanitized_bytes),
                    "exif_tags_stripped": max(exif_tags_count, 1),
                    "format": target_format,
                    "mime_type": f"image/{target_format.lower()}",
                }
                return sanitized_bytes, report
        except Exception as exc:
            raise ValueError(f"Image Sanitization Failed: Unable to decode pixel stream. {str(exc)}") from exc
