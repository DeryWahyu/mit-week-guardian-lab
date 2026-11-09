"use client";
import { learningControl } from "@/components/academy/learning-ui";
import type { QuizInput } from "@/lib/validations/academy";
import { QuizQuestionEditor } from "./quiz-question-editor";
import { QuizThumbnailField } from "./quiz-thumbnail-field";
export function blankQuestion(): QuizInput["questions"][number] {
  return {
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
    ],
    correctAnswers: ["a"],
    explanation: "",
  };
}
export function QuizEditor({
  value,
  change,
  pending,
  save,
  cancel,
  error,
  thumbnailUrl,
  thumbnail,
  changeThumbnail,
}: {
  value: QuizInput;
  change: (q: QuizInput) => void;
  pending: boolean;
  save: () => void;
  cancel: () => void;
  error: string | null;
  thumbnailUrl?: string | null;
  thumbnail: File | null | undefined;
  changeThumbnail: (file: File | null | undefined) => void;
}) {
  return (
    <form
      aria-label="Editor kuis"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <fieldset disabled={pending} className="min-w-0 space-y-4">
        <legend className="text-xl font-semibold">Materi dan soal kuis</legend>
        <label className="block text-sm">
          Judul <span className="text-rose-600">*</span>
          <input
            required
            minLength={5}
            maxLength={150}
            placeholder="Contoh: Mengenali tautan tiruan"
            className={`${learningControl} mt-1 block w-full`}
            value={value.title}
            onChange={(e) => change({ ...value, title: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Deskripsi <span className="text-rose-600">*</span>
          <textarea
            required
            minLength={10}
            maxLength={2000}
            placeholder="Jelaskan hal yang akan dipelajari"
            className={`${learningControl} mt-1 block w-full`}
            value={value.description}
            onChange={(e) => change({ ...value, description: e.target.value })}
          />
        </label>
        <QuizThumbnailField
          category={value.category}
          savedUrl={thumbnailUrl}
          file={thumbnail}
          change={changeThumbnail}
          disabled={pending}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            Kategori <span className="text-rose-600">*</span>
            <select
              className={`${learningControl} mt-1 block w-full`}
              value={value.category}
              onChange={(e) =>
                change({ ...value, category: e.target.value as QuizInput["category"] })
              }
            >
              <option value="SPOT_THE_PHISH">Tautan palsu</option>
              <option value="SOCIAL_ENGINEERING">Manipulasi psikologis</option>
              <option value="DANGEROUS_PERMISSIONS">Izin Android</option>
            </select>
          </label>
          <label className="text-sm">
            Kesulitan <span className="text-rose-600">*</span>
            <select
              className={`${learningControl} mt-1 block w-full`}
              value={value.difficulty}
              onChange={(e) =>
                change({ ...value, difficulty: e.target.value as QuizInput["difficulty"] })
              }
            >
              <option value="EASY">Dasar</option>
              <option value="MEDIUM">Menengah</option>
              <option value="HARD">Lanjutan</option>
            </select>
          </label>
          <label className="text-sm">
            EXP kelulusan <span className="text-rose-600">*</span>
            <input
              required
              type="number"
              min={0}
              max={500}
              className={`${learningControl} mt-1 block w-full`}
              value={value.expReward}
              onChange={(e) => change({ ...value, expReward: Number(e.target.value) })}
            />
          </label>
        </div>
        {value.questions.map((q, index) => (
          <QuizQuestionEditor
            key={`question-${index + 1}`}
            q={q}
            index={index}
            change={(question) =>
              change({
                ...value,
                questions: value.questions.map((old, i) => (i === index ? question : old)),
              })
            }
            removable={value.questions.length > 1}
            remove={() =>
              change({ ...value, questions: value.questions.filter((_, i) => i !== index) })
            }
          />
        ))}
        <button
          type="button"
          className={learningControl}
          disabled={value.questions.length >= 30}
          onClick={() => change({ ...value, questions: [...value.questions, blankQuestion()] })}
        >
          Tambah soal
        </button>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.published}
            onChange={(e) => change({ ...value, published: e.target.checked })}
            className="mt-1"
          />
          <span>Terbitkan agar pengguna dapat mengerjakan kuis ini. Semua soal wajib lengkap.</span>
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={pending}
          type="submit"
          className="bg-brand-600 min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Menyimpan kuis…" : "Simpan kuis"}
        </button>
        <button disabled={pending} className={learningControl} type="button" onClick={cancel}>
          Tutup editor
        </button>
      </div>
    </form>
  );
}
