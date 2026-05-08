# BrainBytes - AI-Powered Learning Platform

BrainBytes is a multi-container learning application that provides AI-powered tutoring across multiple subjects. Built with Node.js, Next.js, and MongoDB.

## Architecture

The application consists of three Docker containers:
- **Frontend** (Next.js) - User interface running on port 8080
- **Backend** (Express.js) - REST API running on port 3000
- **MongoDB** - Database running on port 27017

## Prerequisites

- Docker Desktop installed
- Git installed

## Running the Application

1. Clone the repository:
```bash
git clone https://github.com/Elocin-MMDC/Brainbytes-Multi-Container.git
cd Brainbytes-Multi-Container
```

2. Build and start the containers:
```bash
docker-compose up --build
```

3. Open your browser:
- Chat Interface: http://localhost:8080
- Profile Page: http://localhost:8080/profile
- Dashboard: http://localhost:8080/dashboard
- API: http://localhost:3000

4. To stop:
```bash
docker-compose down
```

## API Documentation

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Get all messages (optional `?subject=Math`) |
| POST | `/api/messages` | Create a message |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Send message to AI; returns response with subject, question type, and sentiment |

**Request body:**
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

**Request body for create/update:**
```json
{
  "name": "Sarah Nicole Hular",
  "email": "Sarah@example.com",
  "preferredSubjects": ["Math", "Science"]
}
```

### Learning Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/materials` | Create a new learning material |
| GET | `/api/materials` | Get all materials (optional `?subject=Math`) |
| GET | `/api/materials/:id` | Get a single material by ID |

**Request body for create:**
```json
{
  "subject": "Math",
  "topic": "Quadratic Equations",
  "content": "A quadratic equation is..."
}
```

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/recent` | Get recent activity, total messages, and subject counts |

## Database Schema Design

### Message Collection
Stores chat history between users and the AI tutor.
```javascript
{
  text: String,           // user's question
  response: String,       // AI's response
  subject: String,        // detected/selected subject
  questionType: String,   // definition | explanation | example | general
  sentiment: String,      // frustrated | confused | positive | neutral
  createdAt: Date
}
```

### UserProfile Collection
Stores user account information and learning preferences.
```javascript
{
  name: String,                    // required
  email: String,                   // required, unique
  preferredSubjects: [String],     // array of subject names
  createdAt: Date,
  updatedAt: Date
}
```

### LearningMaterial Collection
Stores reference learning content organized by subject and topic.
```javascript
{
  subject: String,    // required (Math, Science, etc.)
  topic: String,      // required (specific topic name)
  content: String,    // required (the learning content)
  createdAt: Date
}
```

## AI Implementation

### Approach: Simulated AI vs External API

As suggested by the activity instructions, this project uses a **simulated AI** approach with intelligent keyword-based responses. This was chosen for the following reasons:

#### Hugging Face Integration Attempt

We initially attempted to integrate the **Hugging Face Inference API** as recommended in the activity. The implementation included:
- API key management via `.env` file
- HTTP requests to Hugging Face endpoints using `node-fetch`
- Response parsing for various model formats

**Models tested:**
- `facebook/blenderbot-400M-distill`
- `mistralai/Mistral-7B-Instruct-v0.3`
- `HuggingFaceH4/zephyr-7b-beta`
- `google/flan-t5-base`

**Issues encountered:**
- "Model not supported by provider hf-inference" errors
- API endpoint URLs deprecated (404 Cannot POST errors)
- Free tier limitations on inference providers

**Decision:** Per the activity guidance ("you can simulate an AI response just to see how it runs"), we pivoted to a custom simulated AI that demonstrates all required AI capabilities while being reliable, fast, and cost-free.

### Simulated AI Features

#### 1. Expanded Knowledge Base
The AI has training data across multiple subjects:
- **Math**: algebra, geometry
- **Science**: photosynthesis, gravity, atoms
- **History**: Jose Rizal
- **English**: nouns, verbs

Each topic includes definition, explanation, and example responses.

#### 2. Question Type Detection
The AI detects three types of questions and responds accordingly:
- **Definition**: Triggered by phrases like "what is", "define", "meaning of"
- **Explanation**: Triggered by "how", "why", "explain", "describe"
- **Example**: Triggered by "example", "show me", "give me a sample"

#### 3. Sentiment Analysis
The AI detects user emotional state and adapts its response:
- **Frustrated**: Detects words like "frustrated", "hate", "stupid" - responds with empathy
- **Confused**: Detects "confused", "don't understand", "stuck" - offers clearer explanation
- **Positive**: Detects "thanks", "great", "love" - acknowledges positivity
- **Neutral**: Default response style

#### 4. Subject Classification
Messages are automatically classified into subjects (Math, Science, History, English, Filipino, General) based on keyword detection. This enables filtering and analytics.

#### 5. Math Expression Solver
Can evaluate basic math expressions like "what is 5 + 3" and return numeric answers.

## Frontend Features

### Chat Page (/)
- Real-time AI conversation
- Subject filter dropdown
- Displays detected subject, question type, and sentiment for each AI response

### Profile Page (/profile)
- Create user profiles with name, email, and preferred subjects
- View all existing profiles
- Edit and delete profiles
- Multi-select subject preferences

### Dashboard Page (/dashboard)
- Total conversation count
- Subject-wise breakdown
- Recent activity feed (last 10 conversations)
- Question type and sentiment indicators

## Project Structure

```
brainbytes-multi-container/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── pages/
│       ├── index.js          # Chat page
│       ├── profile.js        # Profile management
│       └── dashboard.js      # Activity dashboard
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Future Enhancements

- Re-attempt Hugging Face integration with newer/supported models
- Add user authentication (login/signup)
- Implement persistent chat history per user
- Add more advanced sentiment analysis using NLP libraries
- Expand knowledge base with more topics and subjects

## Team Members
- Mara Julienne Rose Cervantes
- Christine Joy Cortes
- Sarah Nicole Hular
- Michelle Joi Quesada
- Eldan Eunice Sinsuan 

## License
This project is for educational purposes as part of the DevOps course.
