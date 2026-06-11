import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/media", tags=["media"])

UPLOAD_DIR = Path("media")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_media(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """
    Simulates S3 media upload by storing the file locally in backend/media/ 
    and returning a static file path.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    new_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / new_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return the URL where the frontend can fetch the image
    # Assuming the backend will serve the media directory at /media/
    return {"url": f"http://localhost:8000/media/{new_filename}"}
