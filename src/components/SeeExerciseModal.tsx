import React from "react";
import { Exercise } from "../types";
import { X, ClipboardList, Star, BookOpen, PenTool, Award, Sparkles, CheckCircle2 } from "lucide-react";

interface SeeExerciseModalProps {
  exercise: Exercise;
  onClose: () => void;
  onStartWriting: (exercise: Exercise) => void;
}

export default function SeeExerciseModal({
  exercise,
  onClose,
  onStartWriting,
}: SeeExerciseModalProps) {
  const getCategoryDetails = (category: string) => {
    switch (category) {
      case "paragraph":
        return {
          emoji: "📝",
          label: "Paragraph Assignment",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
          headerBg: "bg-emerald-600 text-white",
        };
      case "letter":
        return {
          emoji: "✉️",
          label: "Letter Writing Assignment",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
          headerBg: "bg-blue-600 text-white",
        };
      case "story":
        return {
          emoji: "📖",
          label: "Story Writing Prompt",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
          headerBg: "bg-purple-600 text-white",
        };
      default:
        return {
          emoji: "💡",
          label: "Writing Practice",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
          headerBg: "bg-amber-500 text-white",
        };
    }
  };

  const details = getCategoryDetails(exercise.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between relative border-b-4 border-amber-400">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${details.badgeColor}`}>
                {details.emoji} {details.label}
              </span>
              {exercise.assignedBy && (
                <span className="px-3 py-1 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-700">
                  🍎 Given by: {exercise.assignedBy}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
              {exercise.title}
            </h2>
            <div className="flex items-center gap-3 text-xs font-bold text-amber-300 mt-2">
              <span>🎯 Target: {exercise.targetWordCount}+ Words</span>
              <span>•</span>
              <span>🎓 {exercise.gradeTarget || "Primary Grade"}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Assignment Details */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Main Prompt Instructions */}
          <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80">
            <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-700" /> Assignment Instructions & Prompt:
            </h3>
            <p className="text-slate-800 text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap">
              {exercise.description}
            </p>
          </div>

          {/* Sentence Starters */}
          {exercise.sentenceStarters && exercise.sentenceStarters.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-purple-600" /> Helpful Sentence Starters:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exercise.sentenceStarters.map((starter, i) => (
                  <div
                    key={i}
                    className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-slate-700 font-medium text-xs flex items-center gap-2"
                  >
                    <span className="text-purple-500 font-bold">✨</span>
                    <span>"{starter}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocabulary Word Bank */}
          {exercise.vocabularyHints && exercise.vocabularyHints.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" /> Sparky Word Bank:
              </h4>
              <div className="flex flex-wrap gap-2">
                {exercise.vocabularyHints.map((hint, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl text-xs font-bold shadow-sm"
                  >
                    ⭐ {hint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sample Model Answer */}
          {exercise.exampleText && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Model / Sample Answer:
              </h4>
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-indigo-950 font-medium text-xs leading-relaxed italic whitespace-pre-wrap">
                "{exercise.exampleText}"
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with the prominent Let's Write button after seeing */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-2xl transition"
          >
            Close Preview
          </button>

          <button
            onClick={() => {
              onClose();
              onStartWriting(exercise);
            }}
            className="flex-1 py-3.5 px-6 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl shadow border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 text-base"
          >
            <PenTool className="w-5 h-5 text-amber-900" />
            Let's Write! ✍️
          </button>
        </div>
      </div>
    </div>
  );
}
