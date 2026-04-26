# NoteAI — Handwritten Notebook Generator

NoteAI is a powerful, AI-driven study tool that generates beautiful, highly customizable handwritten notebook pages from any topic. Powered by Groq for ultra-fast generation and Next.js for a seamless frontend experience.

## ✨ Features
*   **AI Content Generation**: Generates study notes using 6 different Groq LLMs (Llama 3, Mixtral, Gemma).
*   **Dynamic Pagination**: Automatically sizes and splits AI content so it perfectly rests on the ruled lines without ever bleeding into the header.
*   **Target Pages Control**: Control exactly how many physical notebook pages you want generated (up to 50 pages).
*   **Detail Levels**: Generates content from simple bullet points (Level 1) to full academic research paper depth (Level 5).
*   **Bring Your Own Key**: Securely accepts a user's free Groq API key via a startup popup (stored in local storage).
*   **Diagrams Integration**: Generates Mermaid.js code that is reliably rendered into beautiful technical diagrams using Kroki.io.
*   **Customization**: Change handwriting fonts, page sizes, paper textures, line spacing, and themes.
*   **Zip Export**: Download the generated notebook as a zip folder of high-resolution images.

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SauravDnj/Notebook-Generator.git
    cd Notebook-Generator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser. The app will prompt you for a free Groq API key.

## 🛠 Tech Stack
*   **Framework**: Next.js (React)
*   **Language**: TypeScript
*   **Styling**: Vanilla CSS with modern Glassmorphism UI
*   **AI Provider**: Groq SDK
*   **Diagrams**: Mermaid.js via Kroki.io API
*   **Image Export**: JSZip

## 📄 License
This project is free to use and modify.
