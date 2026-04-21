# ⚡ AETHER v2: Wire Harness Intelligence

> **AI-Powered 2D Blueprint to 3D Digital Twin Digitization**

AETHER is a next-generation engineering platform designed to bridge the gap between static 2D wiring schematics and interactive 3D digital environments. By leveraging Google Gemini's multimodal capabilities, AETHER transforms complex wiring diagrams into interactive 3D spatial netlists, allowing engineers to visualize, analyze, and manage wire harness architectures with unprecedented speed.

---

## ✨ Key Features

*   **🤖 AI Netlist Extraction:** Upload a 2D wiring schematic (PDF, PNG, JPG) and AETHER's AI engine automatically extracts components, pins, and wire connections.
*   **🌐 3D Digital Twin Generation:** Instantly maps extracted 2D data into a hardware-accelerated 3D environment for spatial routing visualization.
*   **📊 Interactive 2D Schematic:** A high-performance 2D canvas for reviewing extracted schematics with real-time syncing between 2D and 3D views.
*   **📦 3D Model Integration:** Upload and associate `.glb` or `.gltf` models with harness components for a complete digital twin experience.
*   **🗄️ Project Management:** Save, load, and manage extracted netlists via a built-in SQLite database.
*   **🔍 Advanced Spatial Routing:** Automated 3D coordinate assignment based on logical physical topology.

---

## 🛠️ Tech Stack

### **Frontend**
*   **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **3D Rendering:** [Three.js](https://threejs.org/) using [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) & [@react-three/drei](https://github.com/pmndrs/drei)
*   **2D Graphics:** [Konva.js](https://konvajs.org/) via [react-konva](https://github.com/konvajs/react-konva)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) + [Lucide Icons](https://lucide.dev/)

### **Backend**
*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **AI Engine:** [Google Gemini API](https://ai.google.dev/) (Flash/Pro Models)
*   **Database:** [SQLAlchemy](https://www.sqlalchemy.org/) + [SQLite](https://sqlite.org/)
*   **Image Processing:** [OpenCV](https://opencv.org/) + [Pillow](https://python-pillow.org/)
*   **PDF Parsing:** [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/en/latest/)

---

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18+)
*   [Python](https://www.python.org/) (v3.9+)
*   [Gemini API Key](https://aistudio.google.com/)

### 1. Backend Setup
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a `.env` file and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    *(Note: If `requirements.txt` is missing, use: `pip install fastapi uvicorn google-generativeai opencv-python Pillow pymupdf sqlalchemy python-dotenv python-multipart`)*
4.  Run the FastAPI server:
    ```bash
    python main.py
    ```
    The server will start on `http://localhost:8000`.

### 2. Frontend Setup
1.  In a new terminal, navigate to the project root:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 📂 Project Structure

```text
├── backend/
│   ├── main.py          # FastAPI application & AI logic
│   ├── aether.db        # SQLite database
│   └── static/          # CDN for 3D assets & uploads
├── src/
│   ├── components/      # UI components (2D/3D views, HUD)
│   ├── store/           # Zustand state management
│   ├── lib/             # Utility functions
│   └── App.tsx          # Main application orchestration
├── public/              # Static assets (3D models, textures)
└── README.md            # You are here
```

---

## 🛡️ Security & Privacy
AETHER processes blueprints through Google Gemini. Ensure you have the necessary permissions to share proprietary wiring diagrams with AI services before uploading sensitive data.

---

*Built with precision for the future of Industrial Engineering.*


