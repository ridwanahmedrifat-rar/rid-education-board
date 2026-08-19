import React from "react";
import { Exercise } from "../types";
import { HelpCircle, Star, PenTool, ClipboardList, Eye } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect: (exercise: Exercise) => void;
  onSee: (exercise: Exercise) => void;
}

export default function ExerciseCard({ exercise, onSelect, onSee }: ExerciseCardProps) {
  const getCategoryDetails = (category: string) => {
    switch (category) {
      case "paragraph":
        return {
          emoji: "📝",
          label: "Paragraph Writer",
          bgColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          badgeColor: "bg-emerald-500",
          seeText: "See Paragraph 👁️",
        };
      case "letter":
        return {
          emoji: "✉️",
          label: "Letter Writer",
          bgColor: "bg-blue-50 text-blue-800 border-blue-200",
          badgeColor: "bg-blue-500",
          seeText: "See Letter 👁️",
        };
      case "story":
        return {
          emoji: "📖",
          label: "Story Starter",
          bgColor: "bg-purple-50 text-purple-800 border-purple-200",
          badgeColor: "bg-purple-500",
          seeText: "See Story 👁️",
        };
      default:
        return {
          emoji: "💡",
          label: "Writing Practice",
          bgColor: "bg-amber-50 text-amber-800 border-amber-200",
          badgeColor: "bg-amber-500",
          seeText: "See Exercise 👁️",
        };
    }
  };

  const details = getCategoryDetails(exercise.category);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-amber-400 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between h-full group relative overflow-hidden">
      {/* Subtle top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${details.badgeColor}`} />

      <div>
        {/* Category Badge & Word count */}
        <div className="flex items-center justify-between mb-4 pt-1">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${details.bgColor}`}>
            <span>{details.emoji}</span> {details.label}
          </span>
          <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
            🎯 {exercise.targetWordCount}+ words
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-slate-900 font-display mb-2 group-hover:text-amber-600 transition-colors">
          {exercise.title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed font-medium">
          {exercise.description}
        </p>

        {/* Assigned By & Grade Level Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {exercise.assignedBy && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
              🍎 Given by: <strong className="text-slate-900">{exercise.assignedBy}</strong>
            </span>
          )}
          {exercise.gradeTarget && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200/80">
              🎓 {exercise.gradeTarget}
            </span>
          )}
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {exercise.sentenceStarters && exercise.sentenceStarters.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
              {exercise.sentenceStarters.length} Starters
            </span>
          )}
          {exercise.vocabularyHints && exercise.vocabularyHints.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              {exercise.vocabularyHints.length} Word Hints
            </span>
          )}
        </div>
      </div>

      {/* Dual action buttons: See Prompt & Let's Write */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => onSee(exercise)}
          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl border border-slate-200 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
        >
          <Eye className="w-4 h-4 text-indigo-600" />
          {details.seeText}
        </button>

        <button
          onClick={() => onSelect(exercise)}
          className="py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-2xl shadow-sm border-b-2 border-amber-600 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
        >
          <PenTool className="w-4 h-4 text-slate-900" />
          Let's Write! ✍️
        </button>
      </div>
    </div>
  );
}

