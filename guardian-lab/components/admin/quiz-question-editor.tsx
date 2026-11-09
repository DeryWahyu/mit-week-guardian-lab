"use client";
import { learningControl } from "@/components/academy/learning-ui";
import type { QuizInput } from "@/lib/validations/academy";

type Question = QuizInput["questions"][number];
export function QuizQuestionEditor({
  q,
  index,
  change,
  remove,
  removable,
}: {
  q: Question;
  index: number;
  change: (q: Question) => void;
  remove: () => void;
  removable: boolean;
}) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-xl border border-slate-200 p-4">
      <legend className="px-1 font-semibold">Soal {index + 1}</legend>
      <label className="block text-sm">
        Pertanyaan <span className="text-rose-600">*</span>
        <textarea
          required
          minLength={5}
          maxLength={3000}
          placeholder="Tulis studi kasus dan pertanyaan"
          value={q.questionText}
          onChange={(e) => change({ ...q, questionText: e.target.value })}
          className={`${learningControl} mt-1 block w-full`}
        />
      </label>
      <label className="block text-sm">
        Jenis soal <span className="text-rose-600">*</span>
        <select
          className={`${learningControl} mt-1 block w-full`}
          value={q.questionType}
          onChange={(e) => {
            const binary = e.target.value === "TRUE_FALSE";
            change({
              ...q,
              questionType: binary ? "TRUE_FALSE" : "MULTIPLE_CHOICE",
              options: binary ? q.options.slice(0, 2) : q.options,
              correctAnswers: binary ? [q.options[0].id] : q.correctAnswers,
            });
          }}
        >
          <option value="MULTIPLE_CHOICE">Pilihan tunggal / jamak</option>
          <option value="TRUE_FALSE">Benar / salah</option>
        </select>
      </label>
      <p className="text-xs text-slate-500">
        Tandai kunci jawaban yang benar. Pilihan jamak dinilai sebagai satu set lengkap.
      </p>
      {q.options.map((o, oi) => (
        <div key={o.id} className="flex items-center gap-3">
          <label className="flex shrink-0 items-center gap-1 text-xs">
            <input
              type={q.questionType === "TRUE_FALSE" ? "radio" : "checkbox"}
              name={`key-${index}`}
              aria-label={`Kunci soal ${index + 1} pilihan ${oi + 1}`}
              checked={q.correctAnswers.includes(o.id)}
              onChange={(e) =>
                change({
                  ...q,
                  correctAnswers:
                    q.questionType === "TRUE_FALSE"
                      ? [o.id]
                      : e.target.checked
                        ? [...q.correctAnswers, o.id]
                        : q.correctAnswers.filter((id) => id !== o.id),
                })
              }
            />
            Benar
          </label>
          <input
            required
            maxLength={500}
            aria-label={`Soal ${index + 1} pilihan ${oi + 1}`}
            placeholder={`Isi pilihan ${oi + 1}`}
            className={`${learningControl} min-w-0 flex-1`}
            value={o.text}
            onChange={(e) =>
              change({
                ...q,
                options: q.options.map((old) =>
                  old.id === o.id ? { ...old, text: e.target.value } : old,
                ),
              })
            }
          />
          <button
            type="button"
            aria-label={`Hapus pilihan ${oi + 1} soal ${index + 1}`}
            disabled={q.options.length <= 2}
            className="min-h-11 px-2 text-sm text-rose-700 disabled:opacity-40"
            onClick={() =>
              change({
                ...q,
                options: q.options.filter((old) => old.id !== o.id),
                correctAnswers: q.correctAnswers.filter((id) => id !== o.id),
              })
            }
          >
            Hapus
          </button>
        </div>
      ))}
      <button
        type="button"
        className={learningControl}
        disabled={q.options.length >= 6 || q.questionType === "TRUE_FALSE"}
        onClick={() =>
          change({ ...q, options: [...q.options, { id: crypto.randomUUID(), text: "" }] })
        }
      >
        Tambah pilihan
      </button>
      <label className="block text-sm">
        Pembahasan <span className="text-rose-600">*</span>
        <textarea
          required
          minLength={5}
          maxLength={3000}
          placeholder="Jelaskan alasan jawaban yang benar"
          value={q.explanation}
          onChange={(e) => change({ ...q, explanation: e.target.value })}
          className={`${learningControl} mt-1 block w-full`}
        />
      </label>
      <button
        type="button"
        disabled={!removable}
        className="min-h-11 text-sm text-rose-700 disabled:opacity-40"
        onClick={remove}
      >
        Hapus soal ini
      </button>
    </fieldset>
  );
}
