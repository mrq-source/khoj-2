import json
import os
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from uuid import uuid4

import timm
import torch
import torch.nn as nn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from .preprocessing import build_metadata_vector


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = Path(os.getenv("MODEL_PATH", PROJECT_ROOT / "fus_clean_fold0.pt"))
MODEL_INFO_PATH = Path(os.getenv("MODEL_INFO_PATH", PROJECT_ROOT / "meta_info.json"))
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000

with MODEL_INFO_PATH.open(encoding="utf-8") as metadata_file:
    MODEL_INFO = json.load(metadata_file)

CLASSES = MODEL_INFO["classes"]
FEATURE_COLUMNS = MODEL_INFO["columns"]

app = FastAPI(title="Khoj skin image model API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

image_transform = transforms.Compose(
    [
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)


class FusionModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.bb = timm.create_model("efficientnet_b0", pretrained=False, num_classes=0)
        self.mm = nn.Sequential(nn.Linear(len(FEATURE_COLUMNS), 64), nn.ReLU(), nn.Dropout(0.3))
        self.head = nn.Linear(self.bb.num_features + 64, len(CLASSES))

    def forward(self, image, metadata):
        return self.head(torch.cat([self.bb(image), self.mm(metadata)], dim=1))


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model checkpoint not found: {MODEL_PATH}")

    model = FusionModel()
    state_dict = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    return model


def decode_image(contents: bytes) -> torch.Tensor:
    try:
        with Image.open(BytesIO(contents)) as image:
            if image.format not in {"JPEG", "PNG", "WEBP"}:
                raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WEBP photo.")
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise HTTPException(status_code=413, detail="Image dimensions are too large.")
            resized = image.convert("RGB").resize((256, 256), Image.Resampling.BICUBIC)
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.") from error
    return image_transform(resized).unsqueeze(0)


def severity_label(severity: int) -> str:
    if severity >= 9:
        return "Critical"
    if severity >= 7:
        return "High"
    if severity >= 4:
        return "Medium"
    return "Low"


@app.get("/api/health")
def health():
    load_model()
    return {"status": "ready", "classes": CLASSES}


@app.post("/api/ai/analyze")
async def analyze(
    image: UploadFile = File(...),
    metadata: str = Form("{}"),
    severity: int = Form(4, ge=1, le=10),
):
    contents = await image.read(MAX_IMAGE_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="Upload a skin photo to continue.")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller.")
    if len(metadata) > 4096:
        raise HTTPException(status_code=413, detail="Model metadata is too large.")

    try:
        metadata_values = json.loads(metadata)
        if not isinstance(metadata_values, dict):
            raise ValueError("metadata must be a JSON object.")
        metadata_vector = build_metadata_vector(metadata_values, MODEL_INFO)
    except (json.JSONDecodeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    image_tensor = decode_image(contents)
    metadata_tensor = torch.tensor([metadata_vector], dtype=torch.float32)
    model = load_model()
    with torch.inference_mode():
        probabilities = torch.softmax(model(image_tensor, metadata_tensor), dim=1)[0]

    best_index = int(torch.argmax(probabilities))
    best_score = float(probabilities[best_index])
    prediction = {
        "label": CLASSES[best_index],
        "score": best_score,
        "scores": {
            label: float(probabilities[index])
            for index, label in enumerate(CLASSES)
        },
    }

    return {
        "id": uuid4().hex,
        "severity": severity_label(severity),
        "summary": (
            f"The image model's top category is {prediction['label']}. "
            "This research classifier is not a diagnosis, and its score is not a calibrated probability."
        ),
        "prediction": prediction,
        "nextSteps": [
            "Have a qualified healthcare professional assess any new, changing, bleeding, or painful lesion.",
            "Do not use this model output to start, stop, or delay treatment.",
            "Seek urgent care if symptoms are severe or rapidly worsening.",
        ],
    }
