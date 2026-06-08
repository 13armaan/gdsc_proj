# RepoMap Analyzer

RepoMap Analyzer is a powerful visualization and architectural analysis tool for your codebases. 
It statically analyzes local repositories, generating an interactive Node graph of files and folders using React Flow. It surfaces advanced metrics like language distribution, monolithic components, cyclic dependencies, component coupling, repository growth via Git history, and leverages LLMs to generate high-level semantic summaries of your source files.

## Features

- **Interactive Architecture Map**: Explore your codebase as a beautiful React Flow graph.
- **Git Analytics Dashboard**: Visualizes file sizes, codebase complexity, repository growth history, and contributor heatmaps using Recharts.
- **Semantic Code Summaries**: Select any file to generate an LLM-powered summary of its purpose and functionality using `litellm` and Google Gemini.
- **Codebase Health Metrics**: Instantly detects monolithic files, circular imports, and complex control-flow files.
- **Security Scrubber**: Safely sanitizes the environment so API keys never leak to version control.

---

## Prerequisites

Before setting up, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Git**

---

## Setup Instructions

### 1. Backend Setup (FastAPI)

The backend handles static analysis, Git repository parsing, and AI integrations.

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
3. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the Environment Variables:
   - Create a `.env` file in the `backend` directory.
   - Add your API key for the AI summary service. Currently, the project is configured to use Gemini via `litellm`:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
     *(Note: This file is intentionally `.gitignore`'d to protect your credentials).*

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will start at `http://localhost:8000`.

### 2. Frontend Setup (React / Vite)

The frontend renders the interactive UI and dashboards.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173`.

---

## Usage Guide

1. Open `http://localhost:5173` in your browser.
2. In the top right header, enter the **absolute path** of a local git repository on your machine (e.g., `C:/Users/name/projects/my-repo`).
3. Click **Scan Repo**.
4. Use your mouse to zoom, pan, and explore the generated graph.
5. Click on **Insights** to view Circular Imports, Monolithic Components, and Unused Dependencies.
6. Click on **Dashboard** to view the Recharts Git visualizer (including codebase growth and complexity distributions).
7. Click any individual File Node to trigger an LLM-powered summary of the file's contents in the right-hand panel.

## Testing

To run the backend test suite:
```bash
cd backend
pytest tests/ -v
```
