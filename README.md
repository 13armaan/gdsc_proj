# RepoMap Analyzer

RepoMap Analyzer is a static analysis and architectural visualization tool designed to help developers comprehend complex codebases. It ingests local repositories and generates an interactive, topological graph of your system's architecture, dependencies, and health metrics. 

By parsing the Abstract Syntax Tree (AST) of your source files, RepoMap Analyzer maps the structural relationships within your codebase without executing it. It surfaces critical information such as monolithic components, cyclic dependencies, component coupling, and leverages LLMs to generate high-level semantic summaries of undocumented source files.

## Features

### 1. Interactive Architecture Map
The core visualizer leverages React Flow and the ELK (Eclipse Layout Kernel) routing algorithm to generate a clean, layered, force-directed graph of your entire codebase.
![Architecture Map](docs/screenshots/architecture_map.png)

### 2. Multi-Level Semantic Aggregation
The visualization engine supports dynamic detail resolution, allowing developers to switch between macro and micro architectural views instantly:
- **File View**: A granular, file-by-file dependency graph mapping exact imports and file relationships.
- **Folder View**: Aggregates internal complexity by physical directory, highlighting heavy structural areas.
- **Module View**: A high-level domain grouping that abstracts away deep nested folders into top-level functional modules.
![Aggregation Views](docs/screenshots/aggregation_views.png)

### 3. Dependency Tracking & Violation Detection
The backend statically parses imports and traces cross-file relationships. The graph visually highlights architectural violations:
- **Circular Imports**: Identified and marked with bright red, weighted edges.
- **Cross-Language Coupling**: Edges are differentiated to show interactions between disparate technology stacks.
![Dependency Detection](docs/screenshots/dependency_detection.png)

### 4. Interactive Layout & Collision Resolution
The layout engine is fully interactive. When nodes are dragged, the system computes physical bounding box collisions and iteratively displaces overlapping neighbors to maintain a perfectly readable graph structure without manual untangling.

### 5. Health Insights & Statistics Dashboard
An integrated analytics panel provides immediate feedback on the repository's overall health:
- Detection of monolithic files (based on Line of Code density and dependency weight).
- Identification of highly-coupled "God modules".
- Statistical distributions of codebase complexity and file sizes.
![Analytics Dashboard](docs/screenshots/analytics_dashboard.png)

### 6. Semantic AI Summarization
Selecting any individual node in the graph triggers the LLM integration. The backend uses Google Gemini to read the file contents, parse its intent, and stream a comprehensive explanation of its purpose, design patterns, and internal dependencies into a right-hand inspection panel.
![Semantic Summarization](docs/screenshots/semantic_summarization.png)

---

## Technical Stack

**Backend**
- Python 3.10+
- FastAPI (REST endpoints and streaming)
- AST Parsing Engine
- LiteLLM (LLM Gateway)

**Frontend**
- React 18 / TypeScript
- Vite
- React Flow (Node rendering)
- Elk.js (Layout computation)
- Zustand (State management)
- Tailwind CSS

---

## Setup Instructions

### Prerequisites
- Node.js v18 or higher
- Python 3.10 or higher
- Git

### 1. Backend Initialization

The backend handles file crawling, static analysis parsing, and AI integrations.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file in the `backend` directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will start on `http://localhost:8000`.

### 2. Frontend Initialization

The frontend renders the interactive WebGL/Canvas UI and dashboards.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173`.

---

## Usage Guide

1. Navigate to `http://localhost:5173` in your web browser.
2. In the top navigation bar, enter the **absolute file path** of a local git repository on your machine (e.g., `C:/Users/name/projects/my-repo`).
3. Click **Scan Repo**. The backend will crawl the directory, skipping caches and build outputs, and stream the graph data to the frontend.
4. Use the view toggles (`File`, `Folder`, `Module`) to change the aggregation level.
5. Click and drag nodes to rearrange the layout.
6. Open the **Insights** or **Dashboard** tabs to review architectural violations and statistical distributions.
7. Click any individual File Node to trigger an AI-powered summary of that specific file in the sidebar.

## Testing

The backend includes a comprehensive `pytest` suite for the static analyzers and graph aggregation logic.

```bash
cd backend
pytest tests/ -v
```
