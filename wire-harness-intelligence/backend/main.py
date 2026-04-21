from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # <-- NEW: For serving 3D models
import google.generativeai as genai
import cv2
import numpy as np
from PIL import Image
import io
import os
import json
import re
import datetime
import shutil # <-- NEW: For saving uploaded files
from dotenv import load_dotenv
import fitz  
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. SETUP ENVIRONMENT & AI
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# --- NEW: SETUP LOCAL 3D ASSET CDN ---
# Create a directory to store 3D models if it doesn't exist
os.makedirs("static/models", exist_ok=True)
# Mount the static directory so the frontend can access files via URL
app.mount("/static", StaticFiles(directory="static"), name="static")

# 3. DATABASE SETUP
DATABASE_URL = "sqlite:///./aether.db" 
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Netlist(Base):
    __tablename__ = "netlists"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String) 
    name = Column(String)
    data = Column(JSON) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

def extract_json_from_text(text):
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    raise ValueError("No JSON found in AI response")

def convert_to_png(raw_bytes, filename):
    ext = filename.lower().split('.')[-1]
    if ext == 'pdf':
        doc = fitz.open(stream=raw_bytes, filetype="pdf")
        matrix = fitz.Matrix(2.0, 2.0) 
        pix = doc[0].get_pixmap(matrix=matrix)
        return pix.tobytes("png")
    elif ext == 'svg':
        raise ValueError("SVG not supported yet")
    return raw_bytes

def preprocess_image_for_ai(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("OpenCV failed to decode the image. The file might be corrupted.")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    return Image.fromarray(thresh)


def build_adjacency(netlist: dict) -> dict:
    nodes       = netlist.get("nodes", [])
    connections = netlist.get("connections", [])

    node_map: dict = {n["id"]: n for n in nodes}

    for node in nodes:
        node["connected_to"] = []

    for conn in connections:
        src_id = conn.get("source")
        tgt_id = conn.get("target")
        if not src_id or not tgt_id:
            continue

        wire_meta = {
            "wire_color": conn.get("wire_color", "Unknown"),
            "confidence": conn.get("confidence", 0),
        }

        if src_id in node_map:
            already = [c["id"] for c in node_map[src_id]["connected_to"]]
            if tgt_id not in already:
                node_map[src_id]["connected_to"].append({"id": tgt_id, **wire_meta})

        if tgt_id in node_map:
            already = [c["id"] for c in node_map[tgt_id]["connected_to"]]
            if src_id not in already:
                node_map[tgt_id]["connected_to"].append({"id": src_id, **wire_meta})

    netlist["nodes"] = list(node_map.values())
    return netlist

# --- NEW: 3D ASSET UPLOAD ENDPOINT ---
@app.post("/api/upload-model")
async def upload_3d_model(file: UploadFile = File(...)):
    """
    Receives a .glb or .gltf file from the frontend, saves it to the local 
    static CDN folder, and returns the URL for <model-viewer> to consume.
    """
    try:
        ext = file.filename.split('.')[-1].lower()
        if ext not in ['glb', 'gltf']:
            return {"error": "INVALID_FORMAT: Only .glb and .gltf 3D models are supported."}

        # Add timestamp to prevent overwriting assets with the same name
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join("static", "models", safe_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Build the exact URL the frontend will use to fetch the asset
        file_url = f"http://localhost:8000/static/models/{safe_filename}"
        
        return {
            "status": "success", 
            "url": file_url, 
            "filename": safe_filename
        }
    except Exception as e:
        print(f"Model Upload Error: {e}")
        return {"error": f"UPLOAD_FAILED: Could not save the 3D asset. {str(e)}"}


@app.post("/api/save")
async def save_netlist(payload: dict):
    db = SessionLocal()
    try:
        new_entry = Netlist(
            user_id="demo_user",
            name=payload.get("name", f"Project_{datetime.datetime.now().strftime('%M%S')}"),
            data=payload.get("data")
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return {"status": "saved", "id": new_entry.id}
    finally:
        db.close() 

@app.get("/api/projects")
async def get_projects():
    db = SessionLocal()
    try:
        projects = db.query(Netlist).all()
        return projects
    finally:
        db.close()

@app.post("/api/extract")
async def extract_netlist(file: UploadFile = File(...)):
    try:
        try:
            raw_bytes = await file.read()
            png_bytes = convert_to_png(raw_bytes, file.filename)
            clean_image = preprocess_image_for_ai(png_bytes)
        except ValueError as ve:
            print(f"OpenCV Error: {ve}")
            return {"error": f"IMAGE_ERROR: The uploaded file could not be read. Details: {str(ve)}"}
        except Exception as img_e:
            print(f"Format Error: {img_e}")
            return {"error": "IMAGE_ERROR: Failed to process the image format. Please ensure it is a valid JPG, PNG, PDF, or SVG."}
        
        print("Running Stage 1.5: Validating Image Type...")
        try:
            validation_prompt = """
            Look at this image. Is it an electrical schematic, wire harness diagram, or circuit diagram?
            Answer strictly with a single word: YES or NO.
            """
            validation_response = model.generate_content([clean_image, validation_prompt])
            
            if "NO" in validation_response.text.upper():
                return {"error": "VALIDATION_REJECTED: The uploaded image does not appear to be a wire harness or electrical schematic. Please upload a valid circuit diagram."}
        except Exception as val_e:
            print(f"Validation Error: {val_e}")
            return {"error": f"AI_API_ERROR: Failed to validate the image with AI. Details: {str(val_e)}"}

        json_schema = """
        {
          "nodes": [
            {
              "id": "BATTERY_1",
              "label": "12V Battery",
              "coordinates_3d": {"x": 0, "y": 0, "z": 0},
              "connected_to": [
                {
                  "id": "FUSE_1",
                  "wire_color": "Red",
                  "confidence": 95
                }
              ]
            }
          ],
          "connections": [
            {
              "source": "BATTERY_1",
              "target": "FUSE_1",
              "wire_color": "Red",
              "confidence": 95
            }
          ]
        }
        """

        prompt_1 = f"""
        You are an expert electrical engineer and CAD spatial architect. Analyze this circuit diagram.
        Extract a complete netlist of ALL components and ALL wires visible in the image.

        CRITICAL 3D SPATIAL & PLANAR ROUTING INSTRUCTIONS:
        Assign logical (x, y, z) coordinates to EVERY node based on the physical topology.
        1. You have NO scale restrictions. Use whatever coordinate numbers accurately represent
           the relative distances between components.
        2. Route the graph to reflect electrical flow. Place directly connected components adjacently.
        3. The main power source goes near the origin (0, 0, 0).
        4. Spread components cleanly across the X and Z axes.
        5. Use the Y-axis to separate overlapping wire layers.

        ADJACENCY INSTRUCTIONS — connected_to field (REQUIRED on every node):
        For every node, list ALL components that are directly connected to it by a wire.
        - "id"         : exact id of the neighbouring component
        - "wire_color" : colour of the wire on that specific connection
        - "confidence" : your confidence (0-100) that this connection exists
        Rules:
        • Do NOT leave connected_to empty if the component has any connections.
        • Every pair (A→B) in "connections" MUST also appear as B in A's connected_to,
          and A in B's connected_to.
        • A component with no connections at all may have an empty connected_to array.

        You MUST return ONLY valid JSON matching this schema exactly: {json_schema}
        Do not include any markdown, code fences, or explanatory text — raw JSON only.
        """
        
        try:
            print("Running Stage 2: Extraction with Adjacency Mapping...")
            response_1 = model.generate_content([clean_image, prompt_1])
        except Exception as ai_e:
            print(f"Gemini API Error: {ai_e}")
            error_str = str(ai_e).lower()
            if "429" in error_str or "quota" in error_str:
                return {"error": "AI_QUOTA_ERROR: Google Gemini rate limit exceeded. Please wait 60 seconds and try again."}
            return {"error": f"AI_API_ERROR: Failed to communicate with Google Gemini. Details: {str(ai_e)}"}

        try:
            draft_json_text = extract_json_from_text(response_1.text)
            parsed = json.loads(draft_json_text)

            print("Running Stage 3: Server-side adjacency enrichment...")
            enriched = build_adjacency(parsed)
            return enriched

        except ValueError as parse_ve:
            print(f"JSON Extraction Error: {parse_ve}")
            return {"error": "AI_PARSING_ERROR: The AI failed to generate a valid schematic layout. Please try extracting again."}
        except json.JSONDecodeError as json_e:
            print(f"JSON Decode Error: {json_e}")
            return {"error": "AI_PARSING_ERROR: The AI generated malformed JSON data. Please try extracting again."}

    except Exception as e:
        print(f"System Error: {e}")
        return {"error": f"SYSTEM_ERROR: An unexpected backend error occurred: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)