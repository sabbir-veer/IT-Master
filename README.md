# Bangladesh Government IT Job Preparation — Smart Quiz & Analytics

A simple, modern, responsive web application engineered for candidates preparing for Bangladesh Government IT recruitment tests (such as **Bangladesh Bank Assistant Director (IT)**, **BPSC IT Officer / Senior Officer**, **Ministry of ICT**, and state bank IT Officer exams).

---

## 🎯 Features

### 1. Smart Quiz
- **Dynamic Multi-Subject & Multi-Folder Dataset Discovery**: Automatically scans and loads any JSON file located anywhere in the `data/` directory (e.g. `data/database/`, `data/networking/`, `data/swe/`, `data/computer_architecture/`).
- **Zod Dataset Validation**: Validates questions, options, topics, and correct answer bounds before loading.
- **Granular Filter Controls**:
  - Filter by Subject (or full combined mock test across all subjects)
  - Filter by Dataset / Topic file
  - Multi-select specific topics with "Select All" / "Clear All"
  - Filter by Difficulty (`easy`, `medium`, `hard`, or `all`)
  - Configurable question count (with automatic bounds check and friendly warning for smaller pools)
- **Interactive Quiz Taking Experience**:
  - One question at a time with 4 distinct options (A, B, C, D)
  - Option to change or clear answers before submission
  - Real-time progress bar & timer tracking
  - Visual Question Palette (quick jump grid with Answered, Unanswered, and Current status indicators)
  - Submission confirmation modal with unanswered questions warnings
- **Comprehensive Results & Answer Review**:
  - Score percentage, accuracy status, time taken
  - Topic-wise accuracy breakdown for the quiz
  - Filter review by `All`, `Incorrect`, `Correct`, or `Skipped`
  - In-depth technical explanations for every question to reinforce concepts

### 2. Quiz Analytics Dashboard
- **Offline Local Storage**: Completed attempts are stored safely in browser `localStorage`.
- **Performance Overview**:
  - Total quizzes attempted & total questions answered
  - Overall accuracy percentage & average score percentage
  - Cumulative practice time spent
- **Visual Performance Trend**:
  - Interactive trend chart showing score progression across previous quiz attempts
- **Identified Weak Topics**:
  - Automatically identifies topics with accuracy < 60% or high error counts
  - Direct "Practice This Topic" link to jump immediately into a targeted practice quiz
- **Topic-Wise Accuracy Breakdown**:
  - Progress bars displaying accuracy percentages across all attempted topics
- **Individual Attempt History Table**:
  - Date & time, exam name, score badge, questions answered, completion time
  - Review button to reload past question breakdowns & explanations
  - Ability to delete individual attempts or clear all history

---

## 📁 Adding New Subjects and Topics

The system is designed for seamless expansion. Whenever you add new folders and JSON files to `data/`, the app detects and validates them dynamically without code changes!

### Folder Structure Convention:
```text
data/
├── database/
│   ├── db-keys.json          # (Existing: 30 questions)
│   └── normalization.json    # (Add more database topics)
├── networking/
│   ├── osi-tcp.json          # (Networking topics)
│   └── subnetting.json
├── swe/
│   ├── oop-design.json       # (Software engineering topics)
│   └── agile-testing.json
└── computer_architecture/
    └── cache-memory.json
```

### JSON Schema Requirement:
Each JSON file must adhere to this structure:
```json
{
  "dataset_id": "unique_dataset_identifier",
  "title": "Human-Readable Title",
  "topics": {
    "topic_key_1": "Topic Display Label 1",
    "topic_key_2": "Topic Display Label 2"
  },
  "questions": [
    {
      "id": "Q001",
      "topic": "topic_key_1",
      "question": "Question text here?",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "answer": 0,
      "explanation": "Detailed explanation for why option A is correct.",
      "difficulty": "medium",
      "tags": ["topic_tag", "exam_tag"],
      "time_seconds": 60
    }
  ]
}
```

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom glassmorphism and modern dark theme
- **Schema Validation**: Zod
- **Unit Testing**: Vitest
- **Icons**: Lucide React
- **Storage**: Browser `localStorage` (SSR-safe)

---

## 🚀 Running the Project

### Development Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Unit Tests:
```bash
npm test
```
Runs 17 comprehensive unit tests verifying dataset validation, dynamic multi-folder scanning, quiz generation, scoring, and analytics calculations.

### Production Build:
```bash
npm run build
npm start
```
