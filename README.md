# BrainBytes AI Tutoring Platform

## Project Overview

BrainBytes is an AI-powered tutoring platform designed to provide accessible academic assistance to Filipino students. This project implements the platform using modern DevOps practices and containerization. It provides intelligent tutoring across multiple subjects including Math, Science, History, English, and Filipino.

## Team Members

- **Eldan Eunice Sinsuan** - Team Lead [eldan.sinsuan@mmdc.mcl.edu.ph]
- **Sarah Nicole Hular** - Frontend Developer [sarah.hular@mmdc.mcl.edu.ph]
- **Mara Julienne Rose Cervantes** - Frontend Developer [mara.cervantes@mmdc.mcl.edu.ph]
- **Christine Joy Cortes** - Backend Developer [christine.cortes@mmdc.mcl.edu.ph]
- **Michelle Joi Quesada** - DevOps Engineer [michelle.quesada@mmdc.mcl.edu.ph]

## Project Goals

- Implement a containerized multi-container application with proper networking
- Integrate AI-powered tutoring using Hugging Face Inference API
- Create a database-driven application with MongoDB for storing user profiles, learning materials, and chat history
- Apply MVC architecture for clean and maintainable backend code
- Deploy using Docker Compose with frontend, backend, and database containers

## Technology Stack

- **Frontend**: Next.js (React)
- **Backend**: Node.js with Express.js (MVC Architecture)
- **Database**: MongoDB
- **AI Integration**: Hugging Face Inference API with intelligent fallback
- **Containerization**: Docker & Docker Compose
- **Architecture**: Multi-container setup with 3 services

## Architecture

The application consists of three Docker containers:
- **Frontend** (Next.js) - User interface running on port 8080
- **Backend** (Express.js) - REST API running on port 3000
- **MongoDB** - Database running on port 27017

Initial architecture diagram: [View Diagram](https://drive.google.com/file/d/1d3Y6QBUCd5a3VxOU8m44NdSBQ9p6MlWa/view?usp=sharing)

## Prerequisites

- Docker Desktop installed
- Git installed
- Hugging Face account with API token (free)

## Setup & Running the Application

### 1. Clone the repository
```bash
git clone https://github.com/Elocin-MMDC/Brainbytes-Multi-Container.git
cd Brainbytes-Multi-Container
```

### 2. Set up your Hugging Face token

Create a `.env` file in the project root:
```
HUGGINGFACE_TOKEN=your_hugging_face_token_here
```

To get a free token:
1. Sign up at https://huggingface.co
2. Click your avatar → Access Tokens
3. Create a fine-grained token with **Inference** permissions:
   - Make calls to inference providers
   - Make calls to Inference Endpoints
4. Copy the token into your `.env` file

### 3. Build and start the containers
```bash
docker-compose up --build
```

### 4. Open your browser
- Chat Interface: http://localhost:8080
- Profile Page: http://localhost:8080/profile
- Dashboard: http://localhost:8080/dashboard
- API: http://localhost:3000

### 5. To stop the application
```bash
docker-compose down
```

## How to Use

### Getting Started
1. Go to **http://localhost:8080/profile**
2. Create a profile with your name, email, and preferred subjects
3. Click **"Use this profile"** to set it as active
4. Go to **http://localhost:8080** to start chatting
5. Your name and preferred subjects will appear in the chat!

### Testing the AI Features

**Question Type Detection (same topic, different responses):**
```
What is photosynthesis?              → definition response
Explain photosynthesis               → explanation response
Give me an example of photosynthesis → example response
```

**Sentiment Analysis:**
```
I'm so frustrated!         → empathetic response
I'm confused about gravity → clearer explanation
Thank you, this is great!  → positive acknowledgment
```

**Math Solver:**
```
What is 5 + 3?  → The answer is 8
What is 1+1?    → The answer to 1+1 is 2
```

**Other topics:**
```
What is algebra?
Who is Jose Rizal?
What is an atom?
Define noun
Explain verb
What is the capital of the Philippines?
```

## API Documentation

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Send message; returns AI response with subject, question type, and sentiment |

**Request:**
```json
{ "message": "What is algebra?", "subject": "Math" }
```

**Response:**
```json
{
  "userMessage": "What is algebra?",
  "aiResponse": "Algebra is a branch of mathematics...",
  "subject": "Math",
  "questionType": "definition",
  "sentiment": "neutral"
}
```

### User Profiles (CRUD)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a new user profile |
| GET | `/api/users` | Get all user profiles |
| GET | `/api/users/:id` | Get a single user by ID |
| PUT | `/api/users/:id` | Update a user profile |
| DELETE | `/api/users/:id` | Delete a user profile |

**Request body:**
```json
{
  "name": "Sarah Nicole Hular",
  "email": "sarah@example.com",
  "preferredSubjects": ["Math", "Science"]
}
```

### Learning Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/materials` | Create a new learning material |
| GET | `/api/materials` | Get all materials (optional `?subject=Math`) |
| GET | `/api/materials/:id` | Get a single material by ID |

**Request body:**
```json
{
  "subject": "Math",
  "topic": "Quadratic Equations",
  "content": "A quadratic equation is..."
}
```

### Messages & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Get chat history (optional `?subject=Math`) |
| GET | `/api/dashboard/recent` | Get recent activity, total messages, and subject counts |

## Database Schema Design

### Message Collection
Stores all chat conversations with AI metadata.
```javascript
{
  text: String,           // user's question
  response: String,       // AI's answer
  subject: String,        // detected/selected subject (Math, Science, History, English, Filipino, General)
  questionType: String,   // definition | explanation | example | general
  sentiment: String,      // frustrated | confused | positive | neutral
  createdAt: Date
}
```

### UserProfile Collection
Stores user account information and learning preferences.
```javascript
{
  name: String,                  // required
  email: String,                 // required, unique
  preferredSubjects: [String],   // array of preferred subjects
  createdAt: Date,
  updatedAt: Date
}
```

### LearningMaterial Collection
Stores learning content organized by subject and topic.
```javascript
{
  subject: String,    // required (Math, Science, History, English, Filipino)
  topic: String,      // required (specific topic name)
  content: String,    // required (the learning content)
  createdAt: Date
}
```

## AI Implementation

### Hybrid Approach (Hugging Face API + Intelligent Fallback)

The AI uses a **hybrid approach**:
1. **Primary**: Calls Hugging Face Inference API (`facebook/bart-large-cnn`) for AI-generated responses
2. **Fallback**: Uses local intelligent responses when API is unavailable or rate-limited

The AI logic is in `services/aiService.js` which exports:
- `initializeAI()` - validates environment and token
- `generateResponse(question)` - main hybrid logic
- `detectQuestionType(question)` - detects definition/explanation/example/general
- `detectSentiment(question)` - detects frustrated/confused/positive/neutral

### Note on Node.js Compatibility
The backend uses Node.js 14. `AbortController` is not natively available in Node.js 14, so the API timeout handling was adjusted for compatibility. The fallback system ensures the app always responds.

### AI Features

#### 1. Expanded Knowledge Base
Each topic has three response variants (definition, explanation, example):
- **Math**: algebra, geometry
- **Science**: photosynthesis, gravity, atoms, evaporation, precipitation
- **History**: Jose Rizal, Philippines
- **English**: nouns, verbs

#### 2. Question Type Detection
- **Definition**: triggered by "what is", "define", "meaning of"
- **Explanation**: triggered by "how", "why", "explain", "describe"
- **Example**: triggered by "example", "show me", "give me a sample"
- **General**: default for other questions

#### 3. Sentiment Analysis
- **Frustrated** ("frustrated", "frustrating", "hate", "stupid", "ugh") → empathetic prefix
- **Confused** ("confused", "don't understand", "lost", "stuck") → clearer explanation prefix
- **Positive** ("thanks", "great", "love", "helpful") → positive acknowledgment
- **Neutral** → default response style

#### 4. Subject Auto-Classification
Auto-classifies messages into Math, Science, History, English, Filipino, or General for filtering and analytics.

#### 5. Math Expression Solver
Evaluates expressions like "What is 5 + 3?" and returns direct numeric answers.

## Frontend Features

### Chat Page (/)
- AI conversation with typing indicator
- **Subject filter dropdown** (All, Math, Science, History, English, Filipino, General)
- **Quick subject buttons** based on active user's preferred subjects
- **Active user banner** showing name and preferred subjects
- Each AI response shows Subject, Question Type, and Sentiment labels
- Personalized welcome message and username in chat

### Profile Page (/profile)
- Create profiles with name, email, and preferred subjects
- **"Use this profile"** button to set active user
- Active profile highlighted with green border and checkmark
- Edit and delete profiles
- Logout button to switch users
- Active profile preferences sync to Chat page

### Dashboard Page (/dashboard)
- Total conversation count
- Per-subject conversation breakdown
- Recent activity feed (last 10 conversations)
- Question Type and Sentiment per conversation

## Project Structure

```
brainbytes-multi-container/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── materialController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── LearningMaterial.js
│   │   ├── Message.js
│   │   └── UserProfile.js
│   ├── routes/
│   │   ├── materialRoutes.js
│   │   ├── messageRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── aiService.js       # Hugging Face + fallback AI
│   ├── Dockerfile
│   ├── package.json
│   └── server.js              # Entry point
├── frontend/
│   ├── pages/
│   │   ├── index.js           # Chat page
│   │   ├── profile.js         # Profile management
│   │   └── dashboard.js       # Activity dashboard
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env                       # Hugging Face token (gitignored)
├── .gitignore
└── README.md
```

## License
This project is for educational purposes as part of the DevOps course at MMDC.
