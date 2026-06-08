# RepoMap Analyzer - Project Overview

## 1. Introduction
**RepoMap Analyzer** is an interactive, full-stack visualization tool designed to help developers quickly understand the architecture, health, and history of their codebases. By parsing a local Git repository, it generates an interactive Node-based graph (using React Flow) representing the folder structure and files, alongside deep codebase analytics and LLM-powered semantic summaries.

## 2. Core Features
- **Architectural Graph Visualization**: Files and folders are recursively parsed and displayed as interconnected nodes on a customizable 2D canvas.
- **AI-Powered Code Summaries**: Leveraging Google's Gemini models via `litellm`, the application can instantly generate natural-language explanations of any selected source file.
- **Git Repository Analytics**: Evaluates Git commit history (`git log`) using a custom subprocess pipeline to generate a time-series growth history and contributor heatmap, displayed visually via `recharts`.
- **Advanced Code Metrics**:
  - Automatically identifies circular imports in Python projects.
  - Flags "monolithic" files (large size + high complexity) that may require refactoring.
  - Calculates component coupling and language distributions.

## 3. Technology Stack
### Backend (Python/FastAPI)
- **Framework**: FastAPI + Uvicorn
- **AI Integration**: `litellm` (Google Gemini)
- **Analysis Engine**: Custom Python AST parsing and regex heuristics for control-flow complexity.
- **Git Engine**: Subprocess execution for extracting `git log` and `git numstat` metadata.

### Frontend (React/TypeScript)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (`useGraphStore.ts`)
- **Graph Engine**: React Flow
- **Data Visualization**: Recharts (PieChart, AreaChart)
- **Icons**: Lucide React

## 4. Architecture Data Flow
1. **User Input**: User enters an absolute path to a local repository in the Frontend header.
2. **Scan Request**: Frontend makes a `POST /api/scan` request with the `target_path`.
3. **Backend Crawl**: FastAPI crawls the directory, ignoring `.git` and virtual environments.
4. **Metrics Calculation**: Python services compute file complexity, file sizes, syntax rules, and run `subprocess.run` to pull local Git logs.
5. **Response Delivery**: Backend compiles `nodes`, `edges`, `statistics`, and `violations` into a comprehensive JSON payload.
6. **Frontend Render**: Zustand store receives the payload, initializing React Flow nodes and populating the Recharts Codebase Dashboard.
7. **Semantic Summary**: When a user clicks a file node, a secondary request is sent to `POST /api/analyze-node`, prompting the LLM for a functional summary.
