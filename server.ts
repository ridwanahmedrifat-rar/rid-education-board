import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini SDK with telemetry user-agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON DB setup
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: "admin" | "teacher";
  createdAt: string;
}

interface Exercise {
  id: string;
  title: string;
  category: "paragraph" | "letter" | "story" | "other";
  description: string;
  sentenceStarters: string[];
  vocabularyHints: string[];
  exampleText?: string;
  targetWordCount: number;
  assignedBy?: string;
  gradeTarget?: string;
}

interface Submission {
  id: string;
  studentName: string;
  gradeLevel: string;
  exerciseId: string;
  exerciseTitle: string;
  category: string;
  text: string;
  timestamp: string;
  feedback: any;
}

const DEFAULT_USERS: User[] = [
  {
    id: "usr-admin",
    username: "ridparagraph",
    password: "ridparagraph",
    name: "Primary Admin",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-teacher1",
    username: "teacher1",
    password: "teacher123",
    name: "Teacher Sarah",
    role: "teacher",
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: "ex-1",
    title: "My Favorite Pet / Animal",
    category: "paragraph",
    description: "Write a short, colorful paragraph about your favorite pet or animal. Tell us what they look like, what they love to eat, and why they make you happy!",
    sentenceStarters: [
      "My favorite animal is a...",
      "It looks very...",
      "For food, it loves to eat...",
      "I think this animal is special because..."
    ],
    vocabularyHints: ["furry", "playful", "gentle", "energetic", "loyal", "adorable"],
    exampleText: "My favorite animal is a golden retriever dog named Buster. He has soft, golden fur and a happy tail that never stops wagging. Buster loves to eat crunchy dog treats and run after yellow tennis balls in our yard. I love him because he always greets me with a friendly lick when I come home from school.",
    targetWordCount: 40,
    assignedBy: "Primary Admin",
    gradeTarget: "Class 1 - Class 2",
  },
  {
    id: "ex-2",
    title: "My School (Class 1-3 Paragraph)",
    category: "paragraph",
    description: "Describe your school in a clear paragraph. What is the name of your school? What does your classroom look like, and what do you enjoy doing during recess?",
    sentenceStarters: [
      "The name of my school is...",
      "My school building is very...",
      "In my classroom, we have...",
      "During recess, my friends and I love to..."
    ],
    vocabularyHints: ["clean", "spacious", "playground", "friendly", "learning", "books"],
    exampleText: "The name of my school is Sunshine Elementary School. It is a large, colorful building with a big grassy playground. In my classroom, we have bright posters on the walls and lots of fun storybooks. During recess, my friends and I love to play tag. I feel very happy coming to school every day.",
    targetWordCount: 45,
    assignedBy: "Teacher Sarah",
    gradeTarget: "Class 1 - Class 3",
  },
  {
    id: "ex-3",
    title: "A Rainy Day (Class 3-5 Paragraph)",
    category: "paragraph",
    description: "Write a vivid paragraph describing a rainy day. What do you see out your window? What sounds do the raindrops make, and how does the cool weather make you feel?",
    sentenceStarters: [
      "On a rainy day, dark clouds cover the sky and...",
      "I love sitting near the window listening to...",
      "The trees and flowers look so...",
      "Rainy days always make me feel..."
    ],
    vocabularyHints: ["pitter-patter", "refreshing", "drizzling", "cozy", "puddles", "fragrant"],
    exampleText: "On a rainy day, dark gray clouds cover the sky and cool breezes blow through the trees. I love sitting near my bedroom window listening to the pitter-patter sound of raindrops falling on the tin roof. The leaves on the trees look so fresh and green after being washed by the rain. Rainy days always make me feel calm, cozy, and refreshed.",
    targetWordCount: 50,
    assignedBy: "Primary Admin",
    gradeTarget: "Class 3 - Class 5",
  },
  {
    id: "ex-4",
    title: "Importance of Reading Books (Class 5-6 Paragraph)",
    category: "paragraph",
    description: "Explain why reading books is a fantastic habit. How do books broaden our knowledge, improve our vocabulary, and spark our imagination?",
    sentenceStarters: [
      "Reading books is one of the most rewarding habits because...",
      "When we read, we travel to different worlds and...",
      "Books help us learn new vocabulary words such as...",
      "Therefore, everyone should spend at least 20 minutes reading..."
    ],
    vocabularyHints: ["knowledgeable", "imagination", "inspiring", "vocabulary", "wisdom", "enlightening"],
    exampleText: "Reading books is one of the most rewarding habits a student can develop. Books act as gateways to new worlds, allowing us to travel through history, explore outer space, and understand different cultures without leaving our seats. Regular reading expands our vocabulary, sharpens our memory, and improves our writing skills. Therefore, every student should make reading books a daily joy.",
    targetWordCount: 60,
    assignedBy: "Teacher Sarah",
    gradeTarget: "Class 5 - Class 6",
  },
  {
    id: "ex-5",
    title: "Tree Plantation & Environment (Class 6-8 Paragraph)",
    category: "paragraph",
    description: "Write an informative paragraph on the importance of tree plantation. How do trees protect our environment, provide oxygen, and prevent air pollution?",
    sentenceStarters: [
      "Tree plantation is essential for preserving our planet because...",
      "Trees absorb harmful carbon dioxide and produce fresh...",
      "Without trees, our environment would suffer from...",
      "To protect our future, every person should plant at least..."
    ],
    vocabularyHints: ["ecosystem", "oxygen", "deforestation", "environment", "essential", "flourishing"],
    exampleText: "Tree plantation is essential for preserving the health of our planet and sustaining human life. Trees act as the green lungs of Earth by absorbing carbon dioxide and releasing vital oxygen into the atmosphere. They prevent soil erosion, regulate temperatures, and provide shelter to countless species of animals and birds. To combat climate change, we must actively plant more trees and protect our forests.",
    targetWordCount: 70,
    assignedBy: "Primary Admin",
    gradeTarget: "Class 6 - Class 8",
  },
  {
    id: "ex-6",
    title: "A Thank-You Letter to Someone Special",
    category: "letter",
    description: "Write a polite thank-you letter to someone who did something kind for you. Express your sincere gratitude and tell them why their gesture was meaningful.",
    sentenceStarters: [
      "Dear [Name],",
      "I am writing this letter to say thank you for...",
      "It made me feel so...",
      "You are a wonderful friend/teacher/parent because...",
      "Your friend, / Love, [Your Name]"
    ],
    vocabularyHints: ["helpful", "thoughtful", "generous", "appreciate", "kindness", "cheerful"],
    exampleText: "Dear Aunt Sarah,\n\nThank you so much for the colorful painting kit you sent me for my birthday! I spent the whole afternoon painting a beautiful sunset with the new watercolors. It made me feel incredibly happy and creative. You are always so thoughtful and generous.\n\nLove,\nEmily",
    targetWordCount: 50,
    assignedBy: "Teacher Sarah",
    gradeTarget: "Class 2 - Class 5",
  },
  {
    id: "ex-7",
    title: "The Flying Bicycle Adventure",
    category: "story",
    description: "Imagine one morning you pressed a shiny red button on your bicycle handlebars, and it sprouted wings and flew into the clouds! Write an exciting story about your journey.",
    sentenceStarters: [
      "I hopped on my bicycle and pressed the strange red button on the handlebars...",
      "Suddenly, two silver wings popped out from the wheels...",
      "Up in the sky, I soared past fluffy white clouds and saw...",
      "Finally, I landed safely in..."
    ],
    vocabularyHints: ["soared", "breathtaking", "unbelievable", "magnificent", "floating", "windy"],
    exampleText: "I hopped on my bicycle and pressed the strange red button on the handlebars. Suddenly, two silver wings popped out from the wheels with a whirring sound! Up in the sky, I soared past fluffy white clouds and saw tiny houses down below. It was a breathtaking view. Finally, I landed safely in the middle of our neighborhood park.",
    targetWordCount: 65,
    assignedBy: "Primary Admin",
    gradeTarget: "Class 3 - Class 6",
  }
];

function initDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: DEFAULT_USERS, exercises: DEFAULT_EXERCISES, submissions: [] }, null, 2)
    );
  }
}

function readDB() {
  initDB();
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      parsed.users = DEFAULT_USERS;
      writeDB(parsed);
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file, returning empty structure", error);
    return { users: DEFAULT_USERS, exercises: DEFAULT_EXERCISES, submissions: [] };
  }
}

function writeDB(data: any) {
  initDB();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Middleware
app.use(express.json());

// API: User Auth & Login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();

  const user = db.users.find(
    (u: User) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );

  if (user) {
    const { password: _, ...userWithoutPass } = user;
    res.json({
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      user: userWithoutPass,
    });
  } else if (username === "ridparagraph" && password === "ridparagraph") {
    res.json({
      success: true,
      token: "ridparagraph-admin-token",
      user: { id: "usr-admin", username: "ridparagraph", name: "Primary Admin", role: "admin" },
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid username or password" });
  }
});

// API: Manage Users (Admin only features)
app.get("/api/users", (req, res) => {
  const db = readDB();
  const safeUsers = db.users.map((u: User) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  }));
  res.json(safeUsers);
});

app.post("/api/users", (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: "Username, password, and full name are required." });
  }

  const db = readDB();
  if (db.users.some((u: User) => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(400).json({ error: "Username already taken! Please choose another." });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    username: username.trim(),
    password: password.trim(),
    name: name.trim(),
    role: role === "admin" ? "admin" : "teacher",
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...userWithoutPass } = newUser;
  res.json({ success: true, user: userWithoutPass });
});

// Make any user Admin or Teacher ("Admin make any one admin")
app.put("/api/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "teacher") {
    return res.status(400).json({ error: "Role must be 'admin' or 'teacher'" });
  }

  const db = readDB();
  const index = db.users.findIndex((u: User) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[index].role = role;
  writeDB(db);

  res.json({ success: true, user: { id: db.users[index].id, name: db.users[index].name, role: db.users[index].role } });
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const user = db.users.find((u: User) => u.id === id);
  if (user && user.username === "ridparagraph") {
    return res.status(400).json({ error: "Cannot delete the primary root admin account." });
  }

  const initialLength = db.users.length;
  db.users = db.users.filter((u: User) => u.id !== id);

  if (db.users.length === initialLength) {
    return res.status(404).json({ error: "User not found" });
  }

  writeDB(db);
  res.json({ success: true });
});

// API: Exercises
app.get("/api/exercises", (req, res) => {
  const db = readDB();
  res.json(db.exercises);
});

app.post("/api/exercises", (req, res) => {
  const { title, category, description, sentenceStarters, vocabularyHints, exampleText, targetWordCount, assignedBy, gradeTarget } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = readDB();
  const newExercise: Exercise = {
    id: `ex-${Date.now()}`,
    title,
    category,
    description,
    sentenceStarters: sentenceStarters || [],
    vocabularyHints: vocabularyHints || [],
    exampleText: exampleText || "",
    targetWordCount: Number(targetWordCount) || 40,
    assignedBy: assignedBy || "Teacher / Admin",
    gradeTarget: gradeTarget || "All Primary Grades",
  };

  db.exercises.push(newExercise);
  writeDB(db);
  res.json({ success: true, exercise: newExercise });
});

app.put("/api/exercises/:id", (req, res) => {
  const { id } = req.params;
  const { title, category, description, sentenceStarters, vocabularyHints, exampleText, targetWordCount, assignedBy, gradeTarget } = req.body;

  const db = readDB();
  const index = db.exercises.findIndex((e: any) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  db.exercises[index] = {
    ...db.exercises[index],
    title: title || db.exercises[index].title,
    category: category || db.exercises[index].category,
    description: description || db.exercises[index].description,
    sentenceStarters: sentenceStarters || db.exercises[index].sentenceStarters,
    vocabularyHints: vocabularyHints || db.exercises[index].vocabularyHints,
    exampleText: exampleText !== undefined ? exampleText : db.exercises[index].exampleText,
    targetWordCount: targetWordCount !== undefined ? Number(targetWordCount) : db.exercises[index].targetWordCount,
    assignedBy: assignedBy || db.exercises[index].assignedBy,
    gradeTarget: gradeTarget || db.exercises[index].gradeTarget,
  };

  writeDB(db);
  res.json({ success: true, exercise: db.exercises[index] });
});

app.delete("/api/exercises/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = db.exercises.length;
  db.exercises = db.exercises.filter((e: any) => e.id !== id);

  if (db.exercises.length === initialLength) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  writeDB(db);
  res.json({ success: true });
});

// API: Submissions
app.get("/api/submissions", (req, res) => {
  const db = readDB();
  res.json(db.submissions);
});

app.post("/api/submissions", (req, res) => {
  const { studentName, gradeLevel, exerciseId, exerciseTitle, category, text, feedback } = req.body;
  if (!studentName || !text || !exerciseId) {
    return res.status(400).json({ error: "Missing required submission fields" });
  }

  const db = readDB();
  const newSubmission: Submission = {
    id: `sub-${Date.now()}`,
    studentName,
    gradeLevel: gradeLevel || "Grade 2",
    exerciseId,
    exerciseTitle: exerciseTitle || "Writing Practice",
    category: category || "paragraph",
    text,
    timestamp: new Date().toISOString(),
    feedback: feedback || null,
  };

  db.submissions.unshift(newSubmission); // Show newest first
  writeDB(db);
  res.json({ success: true, submission: newSubmission });
});

// API: AI Real-Time Feedback from Gemini
app.post("/api/feedback", async (req, res) => {
  const { studentName, gradeLevel, category, exerciseTitle, text, description } = req.body;

  if (!text || text.trim().length < 5) {
    return res.status(400).json({ error: "Your writing is a bit too short! Try writing a full sentence." });
  }

  try {
    const prompt = `
You are a warm, kind, and incredibly encouraging elementary school teacher grading writing practice.
A student named "${studentName}" in ${gradeLevel} has written an exercise for the topic "${exerciseTitle}" (${category} exercise).
The task description was: "${description}"

Here is the student's writing:
"
${text}
"

Analyze their writing and generate a structured JSON feedback block tailored to a young primary school child.
Be incredibly friendly, use playful wording, celebrate their hard work, and suggest gentle corrections or additions.

Analyze the following aspects:
1. "encouragement": A warm, personalized greeting praising the student by name and celebrating what they did well. Highlight the creative details of their writing. Use exclamation marks and kid-friendly compliments!
2. "grammarSpelling": Find spelling, punctuation, or grammar mistakes. Frame them as "gentle tips" rather than errors. Make sure not to be pedantic—only correct things suitable for elementary grade level. If there are none, return an empty array, and mention that their spelling was flawless!
3. "structureCheck": Check if the child structured their writing correctly based on the exercise type:
   - For 'paragraph': Check if they have a clear starting idea (topic sentence), some details, and a closing thought.
   - For 'letter': Check if they included a greeting (e.g., Dear...), the message, and a friendly sign-off (e.g., Love, From...).
   - For 'story': Check if there is a fun beginning, middle, and ending action.
   Return a list of specific structural criteria, whether they did it (true/false), and a helpful friendly hint.
4. "vocabularyUpgrades": Suggest 2-3 "Sparkly Words" (juicy or advanced vocabulary words) they could use next time to make their writing even more awesome (e.g., instead of "happy", try "thrilled"; instead of "nice", try "marvelous").
5. "starRating": An encouraging star rating from 3 to 5 stars (never give lower than 3 stars to keep primary school students motivated!).
6. "badge": A colorful title badge they earned, such as "Creative Spark", "Structure Superhero", "Spelling Champ", "Brilliant Builder", or "Word Wizard".

Respond ONLY with a valid JSON object matching the requested schema. Do not wrap in markdown blocks other than json.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["encouragement", "grammarSpelling", "structureCheck", "vocabularyUpgrades", "starRating", "badge"],
          properties: {
            encouragement: {
              type: Type.STRING,
              description: "A highly encouraging greeting and praise paragraph, mentioning the child by name.",
            },
            grammarSpelling: {
              type: Type.ARRAY,
              description: "List of gentle grammar or spelling corrections.",
              items: {
                type: Type.OBJECT,
                required: ["original", "corrected", "explanation"],
                properties: {
                  original: {
                    type: Type.STRING,
                    description: "The original incorrect phrase or word from the student's text.",
                  },
                  corrected: {
                    type: Type.STRING,
                    description: "The corrected friendly spelling or phrasing.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A short, sweet explanation of why we change it (e.g. 'Remember, we capitalize the letter I when we talk about ourselves!').",
                  },
                },
              },
            },
            structureCheck: {
              type: Type.ARRAY,
              description: "Structural checklist elements suitable for the category.",
              items: {
                type: Type.OBJECT,
                required: ["criteria", "met", "advice"],
                properties: {
                  criteria: {
                    type: Type.STRING,
                    description: "The checklist item, e.g. 'Has a friendly greeting like Dear Uncle'",
                  },
                  met: {
                    type: Type.BOOLEAN,
                    description: "Whether the criteria is met in the student's writing.",
                  },
                  advice: {
                    type: Type.STRING,
                    description: "Friendly suggestion on how to add this structure element if missing or praise if present.",
                  },
                },
              },
            },
            vocabularyUpgrades: {
              type: Type.ARRAY,
              description: "Fun, sparky words to teach the student new vocabulary.",
              items: {
                type: Type.OBJECT,
                required: ["simpleWord", "juicierWord", "exampleSentence"],
                properties: {
                  simpleWord: {
                    type: Type.STRING,
                    description: "The simple word used in their text (e.g. 'big').",
                  },
                  juicierWord: {
                    type: Type.STRING,
                    description: "The upgraded sparkly word they can use next time (e.g. 'gigantic' or 'enormous').",
                  },
                  exampleSentence: {
                    type: Type.STRING,
                    description: "A fun example sentence showing how to use the sparkly word.",
                  },
                },
              },
            },
            starRating: {
              type: Type.INTEGER,
              description: "An encouraging rating from 3 to 5 stars.",
            },
            badge: {
              type: Type.STRING,
              description: "A fun, inspiring badge name awarded to the child.",
            },
          },
        },
      },
    });

    const resultText = response.text || "{}";
    const parsedFeedback = JSON.parse(resultText);
    res.json(parsedFeedback);
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Teacher Gemini is thinking very hard right now! Please try clicking 'Get Feedback' again." });
  }
});

// Configure Vite or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
