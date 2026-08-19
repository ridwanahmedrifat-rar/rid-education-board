import React, { useState, useEffect } from "react";
import { Exercise, Submission, User, AuthUser } from "../types";
import {
  Plus,
  Trash2,
  Edit2,
  Lock,
  Users,
  BookOpen,
  Calendar,
  Award,
  Star,
  Check,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserPlus,
  Zap,
  GraduationCap,
  Crown
} from "lucide-react";

interface AdminPanelProps {
  exercises: Exercise[];
  onRefreshExercises: () => Promise<void>;
  onAddExercise: (exercise: Omit<Exercise, "id">) => Promise<void>;
  onUpdateExercise: (id: string, exercise: Partial<Exercise>) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
}

const PARAGRAPH_PRESETS = [
  {
    name: "My Best Friend (Paragraph)",
    title: "My Best Friend",
    category: "paragraph" as const,
    gradeTarget: "Grade 1 - Grade 3",
    targetWordCount: 40,
    description: "Write a paragraph about your best friend. What is their name? What do you like to play together, and why are they special to you?",
    sentenceStarters: [
      "My best friend is...",
      "We love to play...",
      "My friend is special because...",
      "When we are together, we always..."
    ],
    vocabularyHints: ["caring", "hilarious", "kindhearted", "fun-loving", "trustworthy"],
    exampleText: "My best friend is Leo. We have been friends since kindergarten! We love playing tag and building giant Lego castles together at recess. Leo is very kindhearted and always shares his snacks with me when I forget mine."
  },
  {
    name: "My School Playground (Paragraph)",
    title: "A Day at the Playground",
    category: "paragraph" as const,
    gradeTarget: "Grade 1 - Grade 4",
    targetWordCount: 45,
    description: "Describe what happens during recess on your school playground. What games do you play? What sounds and sights do you hear around you?",
    sentenceStarters: [
      "At recess time, the playground is full of...",
      "My favorite thing to play is...",
      "I can hear the sound of...",
      "After playing, I feel..."
    ],
    vocabularyHints: ["exciting", "energetic", "swings", "laughter", "joyful", "refreshing"],
    exampleText: "At recess time, our school playground is full of joyful energy. I love running over to the big metal swings and swinging high into the sky. I can hear children laughing and soccer balls bouncing across the field. Recess always makes me feel refreshed and happy!"
  },
  {
    name: "Letter to My Teacher (Letter)",
    title: "A Note to My Teacher",
    category: "letter" as const,
    gradeTarget: "Grade 2 - Grade 5",
    targetWordCount: 50,
    description: "Write a short, polite letter to your teacher telling them about your favorite subject in class and what you enjoy learning about most.",
    sentenceStarters: [
      "Dear [Teacher's Name],",
      "I am writing this letter to tell you that my favorite subject is...",
      "I really enjoyed when we learned about...",
      "Thank you for being such a wonderful teacher because...",
      "Sincerely, / From, [Your Name]"
    ],
    vocabularyHints: ["inspiring", "fascinating", "grateful", "curious", "encouraging"],
    exampleText: "Dear Mrs. Davis,\n\nI am writing this letter to tell you that my favorite subject is science! I really enjoyed when we created solar system models out of clay last Tuesday. Thank you for being such an encouraging teacher and making learning fun every day.\n\nSincerely,\nNoah"
  },
  {
    name: "The Flying Bicycle (Story)",
    title: "The Flying Bicycle Adventure",
    category: "story" as const,
    gradeTarget: "Grade 3 - Grade 5",
    targetWordCount: 65,
    description: "Imagine one morning you pressed a shiny red button on your bicycle handlebars, and it sprouted wings and flew into the clouds! Write an exciting story about your journey.",
    sentenceStarters: [
      "I hopped on my bicycle and pressed the strange red button on the handlebars...",
      "Suddenly, two silver wings popped out from the wheels...",
      "Up in the sky, I soared past fluffy white clouds and saw...",
      "Finally, I landed safely in..."
    ],
    vocabularyHints: ["soared", "breathtaking", "unbelievable", "magnificent", "floating", "windy"],
    exampleText: "I hopped on my bicycle and pressed the strange red button on the handlebars. Suddenly, two silver wings popped out from the wheels with a whirring sound! Up in the sky, I soared past fluffy white clouds and saw tiny houses down below. It was a breathtaking view. Finally, I landed safely in the middle of our neighborhood park."
  }
];

export default function AdminPanel({
  exercises,
  onRefreshExercises,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  isLoggedIn,
  setIsLoggedIn,
}: AdminPanelProps) {
  // Login & Current User State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("wizard_admin_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<"submissions" | "exercises" | "users">("submissions");

  // Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // Users / Teachers Management State
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "teacher">("teacher");
  const [userMsg, setUserMsg] = useState("");
  const [userError, setUserError] = useState("");

  // Exercise Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<"paragraph" | "letter" | "story" | "other">("paragraph");
  const [formDescription, setFormDescription] = useState("");
  const [formStarters, setFormStarters] = useState("");
  const [formHints, setFormHints] = useState("");
  const [formExample, setFormExample] = useState("");
  const [formTargetWords, setFormTargetWords] = useState(40);
  const [formAssignedBy, setFormAssignedBy] = useState("");
  const [formGradeTarget, setFormGradeTarget] = useState("Grade 1 - Grade 3");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Load submissions and users when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchSubmissions();
      fetchUsers();
    }
  }, [isLoggedIn]);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("wizard_admin_token", data.token);
          if (data.user) {
            localStorage.setItem("wizard_admin_user", JSON.stringify(data.user));
            setCurrentUser(data.user);
          }
          setIsLoggedIn(true);
        }
      } else {
        const err = await res.json();
        setLoginError(err.message || "Invalid login details");
      }
    } catch (error) {
      setLoginError("Failed to connect to the server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("wizard_admin_token");
    localStorage.removeItem("wizard_admin_user");
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  // User Management Handlers ("Admin make any one admin")
  const handlePromoteRole = async (userId: string, newRole: "admin" | "teacher") => {
    setUserMsg("");
    setUserError("");
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUserMsg(`Successfully updated user role to ${newRole.toUpperCase()}!`);
        await fetchUsers();
      } else {
        const err = await res.json();
        setUserError(err.error || "Failed to update user role");
      }
    } catch (err) {
      setUserError("Server error while updating role.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg("");
    setUserError("");

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      setUserError("Please fill out all fields for the new user account.");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          username: newUserUsername.trim(),
          password: newUserPassword.trim(),
          role: newUserRole,
        }),
      });

      if (res.ok) {
        setUserMsg(`New ${newUserRole.toUpperCase()} account created for ${newUserName}!`);
        setNewUserName("");
        setNewUserUsername("");
        setNewUserPassword("");
        await fetchUsers();
      } else {
        const err = await res.json();
        setUserError(err.error || "Failed to create account.");
      }
    } catch (err) {
      setUserError("Server error creating account.");
    }
  };

  const handleDeleteUser = async (userId: string, targetName: string) => {
    if (confirm(`Are you sure you want to delete the account for ${targetName}?`)) {
      setUserMsg("");
      setUserError("");
      try {
        const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
        if (res.ok) {
          setUserMsg(`User account deleted.`);
          await fetchUsers();
        } else {
          const err = await res.json();
          setUserError(err.error || "Could not delete user account.");
        }
      } catch (err) {
        setUserError("Failed to delete user.");
      }
    }
  };

  // Exercise Form Handlers
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormTitle("");
    setFormCategory("paragraph");
    setFormDescription("");
    setFormStarters("");
    setFormHints("");
    setFormExample("");
    setFormTargetWords(40);
    setFormAssignedBy(currentUser?.name || "Primary Admin");
    setFormGradeTarget("Grade 1 - Grade 3");
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const handleLoadPreset = (preset: typeof PARAGRAPH_PRESETS[0]) => {
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormGradeTarget(preset.gradeTarget);
    setFormTargetWords(preset.targetWordCount);
    setFormDescription(preset.description);
    setFormStarters(preset.sentenceStarters.join("\n"));
    setFormHints(preset.vocabularyHints.join("\n"));
    setFormExample(preset.exampleText);
    setFormAssignedBy(currentUser?.name || "Teacher / Admin");
  };

  const handleOpenEditForm = (ex: Exercise) => {
    setEditingId(ex.id);
    setFormTitle(ex.title);
    setFormCategory(ex.category);
    setFormDescription(ex.description);
    setFormStarters(ex.sentenceStarters.join("\n"));
    setFormHints(ex.vocabularyHints.join("\n"));
    setFormExample(ex.exampleText || "");
    setFormTargetWords(ex.targetWordCount);
    setFormAssignedBy(ex.assignedBy || currentUser?.name || "Primary Admin");
    setFormGradeTarget(ex.gradeTarget || "Grade 1 - Grade 3");
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formTitle.trim() || !formDescription.trim()) {
      setFormError("Please fill out the Exercise Title and Description!");
      return;
    }

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      description: formDescription.trim(),
      sentenceStarters: formStarters
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      vocabularyHints: formHints
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h.length > 0),
      exampleText: formExample.trim(),
      targetWordCount: Number(formTargetWords) || 40,
      assignedBy: formAssignedBy.trim() || currentUser?.name || "Admin",
      gradeTarget: formGradeTarget.trim() || "All Primary Grades",
    };

    try {
      if (editingId) {
        await onUpdateExercise(editingId, payload);
        setFormSuccess("Exercise updated successfully!");
      } else {
        await onAddExercise(payload);
        setFormSuccess("New Exercise given to students successfully!");
      }

      await onRefreshExercises();

      setTimeout(() => {
        setShowForm(false);
        setEditingId(null);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "Failed to save the exercise.");
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (confirm("Are you sure you want to delete this writing exercise?")) {
      try {
        await onDeleteExercise(id);
        await onRefreshExercises();
      } catch (err) {
        alert("Failed to delete exercise");
      }
    }
  };

  // Login Form View
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border-4 border-purple-200 shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-block bg-purple-100 text-purple-600 p-4 rounded-full mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Teacher & Admin Portal</h2>
          <p className="text-slate-500 text-sm mt-1">
            Log in to post paragraphs, assign exercises, and make users admins.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-700 font-bold text-sm mb-1.5">Username:</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ridparagraph or teacher1"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-purple-400 focus:outline-none font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-sm mb-1.5">Password:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. ridparagraph or teacher123"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-purple-400 focus:outline-none font-medium text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 transition-all text-lg"
          >
            Unlock Board 🔓
          </button>
        </form>

        {loginError && (
          <div className="mt-4 bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{loginError}</span>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500 font-semibold bg-purple-50 p-3 rounded-xl border border-purple-100 space-y-1">
          <p>🔑 <strong>Default Admin:</strong> username: <code className="bg-white px-1.5 py-0.5 rounded border">ridparagraph</code> | pass: <code className="bg-white px-1.5 py-0.5 rounded border">ridparagraph</code></p>
          <p>🍎 <strong>Teacher Account:</strong> username: <code className="bg-white px-1.5 py-0.5 rounded border">teacher1</code> | pass: <code className="bg-white px-1.5 py-0.5 rounded border">teacher123</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      {/* Control Board Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-purple-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <div className="bg-amber-400 text-purple-950 p-3.5 rounded-2xl shadow font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                Teacher & Admin Control Panel
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold uppercase bg-amber-400 text-purple-950 flex items-center gap-1">
                {currentUser?.role === "admin" ? <Crown className="w-3.5 h-3.5" /> : "🍎"}
                {currentUser?.role || "Admin"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-purple-200 font-medium mt-0.5">
              Logged in as <strong className="text-white">{currentUser?.name || "Administrator"}</strong> ({currentUser?.username || "admin"}). Post paragraphs, manage exercises & elevate users to Admin!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 self-start md:self-center">
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-purple-800 hover:bg-purple-700 text-purple-100 text-xs font-bold rounded-xl border border-purple-600 transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "submissions"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> Student Submissions ({submissions.length})
        </button>

        <button
          onClick={() => setActiveTab("exercises")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "exercises"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Give Paragraphs & Exercises ({exercises.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" /> Manage Admins & Teachers ({users.length})
        </button>
      </div>

      {/* TAB 1: Student Submissions */}
      {activeTab === "submissions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              📋 Student Essays & AI Feedback Logs
            </h3>
            <button
              onClick={fetchSubmissions}
              className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 px-3.5 py-2 rounded-xl border border-purple-200 transition"
            >
              Refresh List
            </button>
          </div>

          {loadingSubs ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 space-y-2">
              <div className="text-3xl animate-spin inline-block">⏳</div>
              <p className="text-sm font-bold text-slate-500">Loading student essays...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-4 border-dashed border-slate-200">
              <span className="text-5xl">🎒</span>
              <h4 className="text-lg font-bold text-slate-700 mt-3 font-display">No essays submitted yet</h4>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                Tell your students to select a writing prompt, write their paragraph, and click "Submit to Teacher".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const isExpanded = expandedSub === sub.id;
                const formattedDate = new Date(sub.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl border-2 border-slate-100 hover:border-purple-300 transition shadow-sm overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700 text-lg">
                          {sub.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-800 text-base">{sub.studentName}</h4>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                              {sub.gradeLevel}
                            </span>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-xs font-bold uppercase">
                              {sub.category}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formattedDate} • Topic: {sub.exerciseTitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        {sub.feedback && (
                          <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400 text-sm">
                              {Array.from({ length: sub.feedback.starRating || 3 }).map((_, i) => (
                                <span key={i}>⭐</span>
                              ))}
                            </div>
                            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                              🏆 {sub.feedback.badge}
                            </span>
                          </div>
                        )}

                        <button className="text-slate-400 hover:text-slate-600">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-6 border-t border-slate-100 bg-slate-50/50 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            📝 Written Essay
                          </h5>
                          <div className="bg-white p-5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-wrap min-h-[150px]">
                            "{sub.text}"
                          </div>
                          <div className="text-xs font-bold text-slate-400 px-1">
                            Word Count: {sub.text.split(/\s+/).filter(Boolean).length} words
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            🦉 Teacher Gemini Feedback Given
                          </h5>

                          {sub.feedback ? (
                            <div className="space-y-3 bg-white p-5 rounded-xl border border-purple-100 shadow-sm">
                              <div className="p-3 bg-purple-50 rounded-lg text-xs font-medium text-purple-800 leading-relaxed border border-purple-100">
                                <span className="font-bold">Praise:</span> "{sub.feedback.encouragement}"
                              </div>

                              {sub.feedback.grammarSpelling && sub.feedback.grammarSpelling.length > 0 && (
                                <div>
                                  <h6 className="text-[11px] font-bold text-slate-400 uppercase mb-1">Corrections:</h6>
                                  <div className="space-y-1">
                                    {sub.feedback.grammarSpelling.map((corr: any, i: number) => (
                                      <div key={i} className="text-xs flex items-center gap-2 flex-wrap bg-slate-50 p-2 rounded border border-slate-100">
                                        <span className="line-through text-red-500 font-bold">{corr.original}</span>
                                        <span>➡️</span>
                                        <span className="text-emerald-600 font-bold">{corr.corrected}</span>
                                        <span className="text-slate-400">({corr.explanation})</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-100 text-slate-500 rounded-xl text-center text-xs font-bold italic">
                              No AI Feedback was requested on this submission.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Give Paragraphs & Manage Prompts */}
      {activeTab === "exercises" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                📝 Give Paragraph & Writing Assignments
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Admins and Teachers can assign new paragraphs, letters, or stories to students.
              </p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Give New Paragraph / Exercise
            </button>
          </div>

          {/* Create/Edit Exercise Overlay */}
          {showForm && (
            <div className="bg-white rounded-3xl p-6 border-4 border-purple-400 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
                <div>
                  <h4 className="text-lg font-bold text-purple-900 font-display">
                    {editingId ? "✏️ Edit Paragraph Assignment" : "🚀 Assign New Paragraph / Writing Exercise"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Fill out the prompt details or click a preset below to instantly load a sample paragraph template.
                  </p>
                </div>

                {/* Preset Fast-Loader */}
                {!editingId && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Fast Presets:
                    </span>
                    {PARAGRAPH_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLoadPreset(preset)}
                        className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200 transition"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveExercise} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">Exercise / Paragraph Title:</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. My Favorite Summer Memory"
                      className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">Category Type:</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none bg-white"
                      >
                        <option value="paragraph">Paragraph 📝</option>
                        <option value="letter">Letter ✉️</option>
                        <option value="story">Story 📖</option>
                        <option value="other">Other 💡</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">Target Word Count:</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={formTargetWords}
                        onChange={(e) => setFormTargetWords(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">Assigned By (Name):</label>
                      <input
                        type="text"
                        value={formAssignedBy}
                        onChange={(e) => setFormAssignedBy(e.target.value)}
                        placeholder="e.g. Primary Admin / Teacher Sarah"
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1">Target Grade Level:</label>
                      <input
                        type="text"
                        value={formGradeTarget}
                        onChange={(e) => setFormGradeTarget(e.target.value)}
                        placeholder="e.g. Grade 1 - Grade 3"
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">Paragraph Prompt / Directions:</label>
                    <textarea
                      required
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Explain to the students what they should write about..."
                      className="w-full h-28 px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">
                      Sentence Starters (One per line):
                    </label>
                    <textarea
                      value={formStarters}
                      onChange={(e) => setFormStarters(e.target.value)}
                      placeholder="My favorite thing is...&#10;I love to play..."
                      className="w-full h-20 px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-purple-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">
                      Vocabulary Word Bank (One per line):
                    </label>
                    <textarea
                      value={formHints}
                      onChange={(e) => setFormHints(e.target.value)}
                      placeholder="playful&#10;cheerful&#10;awesome"
                      className="w-full h-20 px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-purple-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">
                      Sample Paragraph / Model Answer:
                    </label>
                    <textarea
                      value={formExample}
                      onChange={(e) => setFormExample(e.target.value)}
                      placeholder="Provide a sample paragraph to inspire kids if they need help..."
                      className="w-full h-20 px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-purple-400 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-between pt-4 border-t gap-4">
                  <div className="flex-1">
                    {formError && <p className="text-xs font-bold text-red-600">❌ {formError}</p>}
                    {formSuccess && <p className="text-xs font-bold text-emerald-600">✅ {formSuccess}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl border"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow"
                    >
                      {editingId ? "Save Changes" : "Post Paragraph Exercise"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* List of current exercises */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="bg-white p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-200 transition flex justify-between gap-4 items-start shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full uppercase">
                      {ex.category}
                    </span>
                    <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      🍎 {ex.assignedBy || "Admin"}
                    </span>
                    <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      🎓 {ex.gradeTarget || "Primary"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">{ex.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ex.description}</p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEditForm(ex)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    title="Edit Exercise"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(ex.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Manage Admins & Teachers ("Admin make any one admin") */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2 font-display">
                👑 User & Role Management Board
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Admins can make any teacher an Admin with 1 click, create new teacher accounts, or manage permissions.
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 px-3.5 py-2 rounded-xl border border-purple-200 transition self-start md:self-center"
            >
              Refresh Users List
            </button>
          </div>

          {userMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{userMsg}</span>
            </div>
          )}

          {userError && (
            <div className="bg-red-50 text-red-800 p-4 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{userError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create New User/Teacher Form */}
            <div className="bg-white p-6 rounded-3xl border-2 border-purple-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-purple-900 border-b pb-3">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-base font-display">Add Teacher or Admin</h4>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Teacher Sarah"
                    className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="e.g. tsarah"
                    className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">Password:</label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Set account password"
                    className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">Initial Role:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none bg-white"
                  >
                    <option value="teacher">Teacher 🍎</option>
                    <option value="admin">Administrator 👑</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create User Account
                </button>
              </form>
            </div>

            {/* List of Registered Admins and Teachers */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                Current Registered Users & Permissions ({users.length})
              </h4>

              {loadingUsers ? (
                <div className="text-center py-8 bg-white rounded-2xl border">Loading accounts...</div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => {
                    const isAdmin = u.role === "admin";
                    const isRootAdmin = u.username === "ridparagraph";

                    return (
                      <div
                        key={u.id}
                        className="bg-white p-4 rounded-2xl border-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-purple-200 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                              isAdmin ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {isAdmin ? "👑" : "🍎"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-800 text-base">{u.name}</h5>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                                  isAdmin ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-purple-50 text-purple-700 border border-purple-100"
                                }`}
                              >
                                {u.role}
                              </span>
                              {isRootAdmin && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Primary Root
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono">
                              Username: @{u.username}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons: Promote to Admin / Demote to Teacher / Delete */}
                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                          {!isAdmin ? (
                            <button
                              onClick={() => handlePromoteRole(u.id, "admin")}
                              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-purple-950 text-xs font-extrabold rounded-xl shadow-sm transition flex items-center gap-1"
                              title="Make this user an Admin"
                            >
                              <Crown className="w-3.5 h-3.5" /> Make Admin 👑
                            </button>
                          ) : (
                            !isRootAdmin && (
                              <button
                                onClick={() => handlePromoteRole(u.id, "teacher")}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                                title="Demote to Teacher role"
                              >
                                Change to Teacher 🍎
                              </button>
                            )
                          )}

                          {!isRootAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                              title="Delete account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
