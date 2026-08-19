import React, { useState, useRef, useEffect } from "react";
import { Exercise, AIFeedback } from "../types";
import {
  Sparkles,
  BookOpen,
  ArrowLeft,
  Wand2,
  Send,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Award,
  AlertCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";

interface WritingWorkspaceProps {
  exercise: Exercise;
  onBack: () => void;
  onSaveSubmission: (submissionData: {
    studentName: string;
    gradeLevel: string;
    exerciseId: string;
    exerciseTitle: string;
    category: string;
    text: string;
    feedback: AIFeedback | null;
  }) => Promise<void>;
}

export default function WritingWorkspace({
  exercise,
  onBack,
  onSaveSubmission,
}: WritingWorkspaceProps) {
  // Student Profile
  const [studentName, setStudentName] = useState(() => localStorage.getItem("wizard_student_name") || "");
  const [gradeLevel, setGradeLevel] = useState(() => localStorage.getItem("wizard_student_grade") || "Grade 2");
  const [profileSaved, setProfileSaved] = useState(() => !!localStorage.getItem("wizard_student_name"));

  // Writing state
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);

  // API Feedback & Status state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModelText, setShowModelText] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate word count
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === "") {
      setWordCount(0);
    } else {
      setWordCount(trimmed.split(/\s+/).length);
    }
  }, [text]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim()) {
      localStorage.setItem("wizard_student_name", studentName.trim());
      localStorage.setItem("wizard_student_grade", gradeLevel);
      setProfileSaved(true);
    }
  };

  const handleUseSentenceStarter = (starter: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const currentText = text;

    // Insert sentence starter at cursor, or append if not focused
    let newText = "";
    if (cursor === 0 && currentText.length === 0) {
      newText = starter + " ";
    } else {
      newText =
        currentText.slice(0, cursor) +
        (currentText.endsWith(" ") || cursor === 0 ? "" : " ") +
        starter +
        " " +
        currentText.slice(cursor);
    }

    setText(newText);
    textareaRef.current.focus();
    // Move cursor to end of inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = cursor + starter.length + 1;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleGetFeedback = async () => {
    if (!text.trim() || wordCount < 5) {
      setErrorMsg("Please write at least 5 words before getting teacher feedback!");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setFeedback(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          gradeLevel,
          category: exercise.category,
          exerciseTitle: exercise.title,
          text,
          description: exercise.description,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch feedback");
      }

      const data: AIFeedback = await res.json();
      setFeedback(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Teacher Gemini is exceptionally busy. Let's try checking your work one more time!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveSubmission({
        studentName,
        gradeLevel,
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        category: exercise.category,
        text,
        feedback,
      });
      setHasSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to send work to the teacher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fun visual progress calculations
  const progressPercent = Math.min((wordCount / exercise.targetWordCount) * 100, 100);
  const isGoalMet = wordCount >= exercise.targetWordCount;

  // Render setup profile if not saved yet
  if (!profileSaved) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border-4 border-amber-400 shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-block bg-amber-100 text-amber-600 p-4 rounded-full mb-3 text-4xl">
            ✍️
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Who is Writing Today?</h2>
          <p className="text-slate-500 text-sm mt-1">
            Let's enter your name and grade level so the Writing Wizard can give you personalized tips!
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div>
            <label className="block text-slate-700 font-bold text-sm mb-1.5">Your Name:</label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="E.g. Emily Smith"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-amber-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-sm mb-1.5">Your Grade Level:</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-amber-400 focus:outline-none font-medium bg-white"
            >
              <option value="Kindergarten">Kindergarten 🎈</option>
              <option value="Grade 1">Grade 1 🎨</option>
              <option value="Grade 2">Grade 2 ✏️</option>
              <option value="Grade 3">Grade 3 📖</option>
              <option value="Grade 4">Grade 4 💡</option>
              <option value="Grade 5">Grade 5 🚀</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-800 font-bold rounded-2xl shadow border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all text-lg"
          >
            Start Writing Quest! ✨
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 text-slate-600 hover:text-orange-500 font-semibold bg-white px-4 py-2 rounded-2xl border-2 border-slate-100 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Exercises
        </button>

        <div className="flex items-center gap-3 bg-white border-2 border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 flex items-center justify-center rounded-full text-xl font-bold font-display">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 leading-tight">{studentName}</h4>
            <p className="text-xs font-semibold text-orange-500">{gradeLevel}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("wizard_student_name");
              setProfileSaved(false);
            }}
            className="text-xs text-slate-400 hover:text-slate-600 underline font-medium ml-2"
          >
            Change
          </button>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Writing Arena (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border-4 border-slate-100 shadow-sm space-y-6">
            <div>
              {/* Category tag */}
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase mb-2">
                🎯 {exercise.category} prompt
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-800">
                {exercise.title}
              </h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                {exercise.description}
              </p>
            </div>

            {/* Writing Assistant: Sentence Starters */}
            {exercise.sentenceStarters && exercise.sentenceStarters.length > 0 && (
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
                <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5 mb-2.5">
                  💡 Stuck? Click a sentence starter to paste it!
                </h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.sentenceStarters.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUseSentenceStarter(starter)}
                      className="text-xs font-semibold bg-white hover:bg-amber-100 text-slate-700 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 shadow-sm transition active:scale-95 text-left"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Word Bank / Vocabulary Hints */}
            {exercise.vocabularyHints && exercise.vocabularyHints.length > 0 && (
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 mb-2.5">
                  🌟 Challenge: Try to include these Sparky Words!
                </h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.vocabularyHints.map((word, idx) => {
                    const isUsed = text.toLowerCase().includes(word.toLowerCase());
                    return (
                      <span
                        key={idx}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                          isUsed
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-bold"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        {isUsed ? "✅" : "✨"} {word}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Textarea Area */}
            <div className="space-y-2 relative">
              <label className="block text-slate-700 font-bold text-sm">Write your essay here:</label>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setErrorMsg("");
                }}
                disabled={hasSubmitted}
                placeholder="Let your imagination fly! Start typing..."
                className="w-full h-64 p-5 border-4 border-slate-100 focus:border-amber-300 rounded-2xl focus:outline-none text-slate-700 font-medium leading-relaxed resize-none text-base bg-slate-50/50 focus:bg-white transition"
              />

              {/* Character and word count display */}
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold px-1">
                <span>{text.length} characters</span>
                <span className={isGoalMet ? "text-emerald-600 font-bold" : "text-slate-500"}>
                  {wordCount} / {exercise.targetWordCount} words {isGoalMet && "🎉"}
                </span>
              </div>
            </div>

            {/* Kid Friendly Rocket Progress Bar */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>🚀 Space Flight Progress</span>
                <span>Goal: {exercise.targetWordCount} Words</span>
              </div>
              <div className="h-6 bg-slate-200 rounded-full overflow-hidden relative border border-slate-300 shadow-inner">
                {/* Rocket Icon following the progress */}
                <div
                  className="absolute top-0 bottom-0 flex items-center justify-end transition-all duration-300 pr-1 text-base z-10"
                  style={{ width: `${progressPercent}%` }}
                >
                  <span className="bounce-slow leading-none">🚀</span>
                </div>
                {/* Colored track bar */}
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isGoalMet
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                      : "bg-gradient-to-r from-amber-400 to-orange-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-center text-xs font-bold text-slate-500">
                {isGoalMet
                  ? "Outstanding! You've reached the star target! 🌟"
                  : `Write ${exercise.targetWordCount - wordCount} more words to land the rocket!`}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleGetFeedback}
                disabled={isLoading || wordCount < 5 || hasSubmitted}
                className={`flex-1 py-3.5 px-6 font-bold rounded-2xl shadow border-b-4 flex items-center justify-center gap-2 transition ${
                  wordCount < 5 || hasSubmitted
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed border-b-0"
                    : "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-800 border-orange-600 active:border-b-0 active:translate-y-1"
                }`}
              >
                <Wand2 className="w-5 h-5" />
                {isLoading ? "Analyzing..." : "Check My Writing! ✨"}
              </button>

              <button
                onClick={handleSubmitWork}
                disabled={isSubmitting || wordCount < 5 || hasSubmitted}
                className={`py-3.5 px-6 font-bold rounded-2xl shadow border-b-4 flex items-center justify-center gap-2 transition ${
                  wordCount < 5 || hasSubmitted
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed border-b-0"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700 active:border-b-0 active:translate-y-1"
                }`}
              >
                <Send className="w-5 h-5" />
                {hasSubmitted ? "Work Submitted! 🎉" : "Submit to Teacher 🍎"}
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-sm font-semibold p-4 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submission Successful banner */}
            {hasSubmitted && (
              <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl border-2 border-emerald-200 text-center space-y-2">
                <h4 className="text-lg font-bold flex items-center justify-center gap-1.5">
                  🎉 Hurrah! Submission Successful!
                </h4>
                <p className="text-sm font-medium">
                  Your essay and spelling feedback have been saved in the Teacher Panel. Your teacher can now read your story and celebrate your effort!
                </p>
              </div>
            )}

            {/* Model Text Toggle */}
            {exercise.exampleText && (
              <div className="pt-2">
                <button
                  onClick={() => setShowModelText(!showModelText)}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {showModelText ? "Hide Example Writing" : "Stuck? Show Example Writing"}
                </button>
                {showModelText && (
                  <div className="mt-3 bg-amber-50 p-5 rounded-2xl border border-amber-100 relative">
                    <span className="absolute top-2 right-3 text-xs font-bold bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full">
                      Teacher's Model Answer
                    </span>
                    <h5 className="font-bold text-slate-700 text-sm mb-1.5">Example essay for inspiration:</h5>
                    <p className="text-sm text-slate-600 italic whitespace-pre-wrap leading-relaxed">
                      "{exercise.exampleText}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Feedback Hub (5/12) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 border-4 border-purple-100 shadow-sm min-h-[500px] flex flex-col justify-between">
            {/* Header: AI Teacher Avatar */}
            <div className="flex items-center gap-3 pb-4 border-b border-purple-50">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl border-2 border-purple-300 shrink-0 bounce-slow">
                🦉
              </div>
              <div>
                <h3 className="font-bold text-purple-800 font-display text-lg">Teacher Gemini</h3>
                <span className="text-xs font-bold text-purple-400 bg-purple-50 px-2 py-0.5 rounded-md">
                  Real-time AI Coach
                </span>
              </div>
            </div>

            {/* AI Output Panels */}
            <div className="flex-1 py-6">
              {isLoading ? (
                /* Loading State */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 my-12">
                  <div className="text-5xl animate-spin">🪄</div>
                  <h4 className="text-lg font-bold text-purple-800 font-display">Reading with Magic Glasses...</h4>
                  <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                    Teacher Gemini is checking your grammar, identifying Sparky Words, and counting your beautiful sentences.
                  </p>
                </div>
              ) : feedback ? (
                /* Feedback Present State */
                <div className="space-y-6">
                  {/* Speech Bubble */}
                  <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100 relative">
                    <div className="absolute top-4 -left-2 w-4 h-4 bg-purple-50 border-l border-b border-purple-100 rotate-45" />
                    <p className="text-slate-700 text-sm font-medium leading-relaxed">
                      {feedback.encouragement}
                    </p>
                  </div>

                  {/* Stars and Badge */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center sm:text-left">
                    <div className="text-4xl">🏆</div>
                    <div>
                      <div className="flex justify-center sm:justify-start gap-1 text-xl text-yellow-400">
                        {Array.from({ length: feedback.starRating }).map((_, i) => (
                          <span key={i} className="drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.15)]">⭐</span>
                        ))}
                      </div>
                      <h4 className="font-bold text-slate-800 text-base mt-1 flex items-center gap-1 justify-center sm:justify-start">
                        Award: <span className="text-orange-500 font-display font-black">{feedback.badge}</span>
                      </h4>
                    </div>
                  </div>

                  {/* Structure checklist */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      📐 Writing Checklist
                    </h4>
                    <div className="space-y-2">
                      {feedback.structureCheck.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                            item.met
                              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                              : "bg-red-50 border-red-100 text-slate-700"
                          }`}
                        >
                          <span className="text-lg shrink-0 mt-0.5">{item.met ? "✅" : "❌"}</span>
                          <div>
                            <p className="text-xs font-bold leading-tight">{item.criteria}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.advice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Spelling & Grammar Tips */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-3">
                      ✏️ Friendly Writing Tips
                    </h4>
                    {feedback.grammarSpelling.length === 0 ? (
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <p className="text-xs font-bold text-emerald-800">Spelling & Grammar Champ!</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            Teacher Gemini didn't find any spelling or grammar mistakes. Truly amazing writing!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedback.grammarSpelling.map((tip, idx) => (
                          <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                            <div className="flex flex-wrap gap-2 items-center text-xs">
                              <span className="line-through text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md">
                                {tip.original}
                              </span>
                              <span className="text-slate-400 font-bold">➡️</span>
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                {tip.corrected}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-normal bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {tip.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vocabulary upgrades */}
                  {feedback.vocabularyUpgrades && feedback.vocabularyUpgrades.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-3">
                        ✨ Sparkly Word Upgrades!
                      </h4>
                      <div className="space-y-3">
                        {feedback.vocabularyUpgrades.map((upgrade, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-3.5 rounded-xl border border-blue-100 space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 font-semibold">Instead of: "{upgrade.simpleWord}"</span>
                              <span className="text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded-full text-xs">
                                Try: "{upgrade.juicierWord}" 🌟
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 italic">
                              <span className="font-bold">Example:</span> "{upgrade.exampleSentence}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Prompt Initial Welcoming State */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 my-12 px-4">
                  <div className="text-5xl bounce-slow">✨📖</div>
                  <h4 className="text-lg font-bold text-purple-800 font-display">Ready for Adventure, {studentName}?</h4>
                  <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                    Start writing your masterpiece on the left. You can use our sentence starters or challenge vocabulary words.
                  </p>
                  <p className="text-xs text-purple-500 font-bold bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
                    When you are ready, click "Check My Writing!" for magical feedback.
                  </p>
                </div>
              )}
            </div>

            {/* Footer notice */}
            <div className="pt-4 border-t border-purple-50 text-center">
              <p className="text-[10px] font-bold text-slate-400">
                Writing Wizard utilizes friendly Gemini AI instruction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
