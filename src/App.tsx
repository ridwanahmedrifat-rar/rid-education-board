import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ExerciseCard from "./components/ExerciseCard";
import WritingWorkspace from "./components/WritingWorkspace";
import AdminPanel from "./components/AdminPanel";
import SeeExerciseModal from "./components/SeeExerciseModal";
import { Exercise, AIFeedback } from "./types";
import { BookOpen, Sparkles, AlertCircle, FileText, PlusCircle } from "lucide-react";

export default function App() {
  // Navigation & View States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [seeingExercise, setSeeingExercise] = useState<Exercise | null>(null);

  // Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return !!localStorage.getItem("wizard_admin_token");
  });

  // Data States
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch exercises from the server
  const fetchExercises = async () => {
    setLoadingExercises(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/exercises");
      if (!res.ok) {
        throw new Error("Could not load exercises from server.");
      }
      const data = await res.json();
      setExercises(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to communicate with the educational backend server. Please refresh or try again!");
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleLogoutAdmin = () => {
    localStorage.removeItem("wizard_admin_token");
    setIsAdminLoggedIn(false);
    setIsAdminMode(false);
  };

  // Student Actions
  const handleSelectExercise = (exercise: Exercise) => {
    setActiveExercise(exercise);
  };

  const handleSaveSubmission = async (submissionData: {
    studentName: string;
    gradeLevel: string;
    exerciseId: string;
    exerciseTitle: string;
    category: string;
    text: string;
    feedback: AIFeedback | null;
  }) => {
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        throw new Error("Failed to submit writing exercise.");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Admin Actions
  const handleAddExercise = async (newEx: Omit<Exercise, "id">) => {
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEx),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create exercise");
    }
  };

  const handleUpdateExercise = async (id: string, updatedFields: Partial<Exercise>) => {
    const res = await fetch(`/api/exercises/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update exercise");
    }
  };

  const handleDeleteExercise = async (id: string) => {
    const res = await fetch(`/api/exercises/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete exercise");
    }
  };

  // Filter exercises by category, grade, and search query
  const filteredExercises = exercises.filter((ex) => {
    // Category check
    if (selectedCategory !== "all" && ex.category !== selectedCategory) {
      return false;
    }

    // Grade/Class check
    if (selectedGrade !== "all") {
      const gTarget = (ex.gradeTarget || "").toLowerCase();
      if (selectedGrade === "class-1-2" && !gTarget.includes("class 1") && !gTarget.includes("class 2") && !gTarget.includes("grade 1") && !gTarget.includes("grade 2")) return false;
      if (selectedGrade === "class-3-4" && !gTarget.includes("class 3") && !gTarget.includes("class 4") && !gTarget.includes("grade 3") && !gTarget.includes("grade 4")) return false;
      if (selectedGrade === "class-5-6" && !gTarget.includes("class 5") && !gTarget.includes("class 6") && !gTarget.includes("grade 5") && !gTarget.includes("grade 6")) return false;
      if (selectedGrade === "class-7-8" && !gTarget.includes("class 7") && !gTarget.includes("class 8") && !gTarget.includes("grade 7") && !gTarget.includes("grade 8")) return false;
    }

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = ex.title.toLowerCase().includes(q);
      const matchDesc = ex.description.toLowerCase().includes(q);
      const matchCat = ex.category.toLowerCase().includes(q);
      const matchGrade = (ex.gradeTarget || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat && !matchGrade) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf7]">
      {/* Universal Wizard Header */}
      <Header
        isAdminMode={isAdminMode}
        setIsAdminMode={(mode) => {
          setIsAdminMode(mode);
          setActiveExercise(null); // Return to home list when toggling modes
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Primary Area Container */}
      <main className="flex-grow">
        {isAdminMode ? (
          /* Render Admin Panel */
          <AdminPanel
            exercises={exercises}
            onRefreshExercises={fetchExercises}
            onAddExercise={handleAddExercise}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
            isLoggedIn={isAdminLoggedIn}
            setIsLoggedIn={setIsAdminLoggedIn}
          />
        ) : activeExercise ? (
          /* Render Active Writing Arena */
          <WritingWorkspace
            exercise={activeExercise}
            onBack={() => setActiveExercise(null)}
            onSaveSubmission={handleSaveSubmission}
          />
        ) : (
          /* Render Student Dashboard selection */
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
            {/* Professional ridparagraph Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 border-b-4 border-amber-400 text-white shadow-xl flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-3 text-center md:text-left z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 font-extrabold rounded-full text-xs">
                  <span>✨ Welcome to ridparagraph</span>
                  <span>•</span>
                  <span>Class 1 to Class 8 Paragraphs</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black font-display tracking-tight text-white drop-shadow-sm">
                  Master Writing Paragraphs, Letters & Stories!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                  Click <span className="font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">See Paragraph 👁️</span> to preview any prompt, or click <span className="font-bold text-slate-950 bg-amber-400 px-2 py-0.5 rounded">Let's Write! ✍️</span> to write your response and receive instant AI teacher feedback!
                </p>

                {/* Quick Stats Badges */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
                  <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-sm">
                    📚 {exercises.length} Exercises
                  </span>
                  <span className="px-3 py-1 bg-slate-800/90 text-slate-200 rounded-xl text-xs font-bold border border-slate-700">
                    🎓 Classes 1, 2, 3, 4, 5, 6, 7 & 8
                  </span>
                  <span className="px-3 py-1 bg-slate-800/90 text-slate-200 rounded-xl text-xs font-bold border border-slate-700">
                    🦉 Instant AI Teacher Feedback
                  </span>
                </div>
              </div>

              <div className="text-6xl md:text-8xl bounce-slow shrink-0 select-none z-10 filter drop-shadow">
                🦉📝
              </div>
            </div>

            {/* Filter controls & Search */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Search paragraphs, letters, stories or class..."
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-400 mr-1 hidden sm:inline uppercase tracking-wider">Type:</span>
                  {[
                    { value: "all", label: "All Types 🌈" },
                    { value: "paragraph", label: "Paragraphs 📝" },
                    { value: "letter", label: "Letters ✉️" },
                    { value: "story", label: "Stories 📖" },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                        selectedCategory === cat.value
                          ? "bg-slate-900 text-amber-400 shadow"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200/60"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Level filters */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  🎓 Class Level:
                </span>
                {[
                  { value: "all", label: "All Classes" },
                  { value: "class-1-2", label: "Class 1 - 2" },
                  { value: "class-3-4", label: "Class 3 - 4" },
                  { value: "class-5-6", label: "Class 5 - 6" },
                  { value: "class-7-8", label: "Class 7 - 8" },
                ].map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setSelectedGrade(g.value)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                      selectedGrade === g.value
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 border border-indigo-200/60"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading / Error states */}
            {loadingExercises ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl animate-spin">🪄</div>
                <p className="font-bold text-slate-500 text-sm">Loading ridparagraph exercises...</p>
              </div>
            ) : errorMsg ? (
              <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-200 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <span className="font-semibold text-sm">{errorMsg}</span>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <span className="text-4xl">📚</span>
                <p className="font-bold text-slate-600 text-base mt-2 font-display">No paragraphs found for your filter</p>
                <p className="text-xs text-slate-400 mt-1">Try switching class levels or clearing your search term.</p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedGrade("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Exercise Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onSelect={handleSelectExercise}
                    onSee={(ex) => setSeeingExercise(ex)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* See Prompt Modal */}
      {seeingExercise && (
        <SeeExerciseModal
          exercise={seeingExercise}
          onClose={() => setSeeingExercise(null)}
          onStartWriting={(ex) => {
            setSeeingExercise(null);
            setActiveExercise(ex);
          }}
        />
      )}

      {/* Universal App Footer */}
      <footer className="bg-slate-100 py-6 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500 font-bold">
          © 2026 ridparagraph • Paragraph, Letter & Story Writing Platform for All School Classes!
        </p>
      </footer>
    </div>
  );
}
