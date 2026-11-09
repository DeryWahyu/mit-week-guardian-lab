"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { categorySchema } from "@/lib/validations/academy";
import styles from "./academy-catalog.module.css";
import { AcademyLessonCard } from "./academy-lesson-card";
import { type AcademyQuiz, academyTopics } from "./academy-presentation";

export function AcademyCatalog({ quizzes }: { quizzes: AcademyQuiz[] }) {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const parsed = categorySchema.safeParse(params.get("category"));
  const category = parsed.success ? parsed.data : "all";
  const status =
    params.get("status") === "todo" ? "todo" : params.get("status") === "done" ? "done" : "all";
  const needle = query.trim().toLocaleLowerCase("id-ID");
  const filtered = quizzes.filter(
    (quiz) =>
      (category === "all" || quiz.category === category) &&
      (status === "all" || (status === "done" ? quiz.isCompleted : !quiz.isCompleted)) &&
      `${quiz.title} ${quiz.description} ${academyTopics[quiz.category].label}`
        .toLocaleLowerCase("id-ID")
        .includes(needle),
  );
  const active = Boolean(query || category !== "all" || status !== "all");
  function change(name: "q" | "category" | "status", value: string) {
    const next = new URLSearchParams(window.location.search);
    if (!value || (name !== "q" && value === "all")) next.delete(name);
    else next.set(name, value);
    const url = `${PROTECTED_ROUTES.academy}${next.size ? `?${next}` : ""}${window.location.hash}`;
    if (name === "q") window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }
  function reset() {
    const next = new URLSearchParams(window.location.search);
    for (const key of ["q", "category", "status"]) next.delete(key);
    window.history.pushState(
      null,
      "",
      `${PROTECTED_ROUTES.academy}${next.size ? `?${next}` : ""}${window.location.hash}`,
    );
  }
  return (
    <section id="latihan" className={styles.catalog} aria-labelledby="academy-catalog-title">
      <div className={styles.catalogHeading} data-user-reveal>
        <div>
          <h2 id="academy-catalog-title">Bekal untuk dunia digitalmu.</h2>
          <p>Pilih topik, lalu coba latihanmu.</p>
        </div>
        <span>{quizzes.length} latihan</span>
      </div>
      <div className={styles.toolbar} data-user-reveal data-user-order="1">
        <label className={styles.search}>
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">Cari latihan</span>
          <input
            type="search"
            placeholder="Cari judul atau topik..."
            value={query}
            maxLength={200}
            onChange={(event) => change("q", event.target.value)}
          />
        </label>
        <label className={styles.statusFilter}>
          <SlidersHorizontal aria-hidden="true" size={16} />
          <span className="sr-only">Status latihan</span>
          <select value={status} onChange={(event) => change("status", event.target.value)}>
            <option value="all">Semua status</option>
            <option value="todo">Belum selesai</option>
            <option value="done">Sudah lulus</option>
          </select>
        </label>
      </div>
      <fieldset className={styles.topics} aria-label="Topik latihan">
        <button
          type="button"
          aria-pressed={category === "all"}
          onClick={() => change("category", "all")}
        >
          Semua topik
        </button>
        {categorySchema.options.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={category === key}
            onClick={() => change("category", key)}
          >
            {academyTopics[key].label}
          </button>
        ))}
      </fieldset>
      <div className={styles.catalogStatus}>
        <output>
          {filtered.length} dari {quizzes.length} latihan ditampilkan
        </output>
        {active && (
          <button type="button" onClick={reset}>
            <X aria-hidden="true" size={14} />
            Hapus filter
          </button>
        )}
      </div>
      {!quizzes.length ? (
        <div className={styles.empty}>
          <FeatureIcon name="quiz" size="large" muted />
          <h3>Latihan sedang dipersiapkan.</h3>
          <p>
            Belum ada latihan yang diterbitkan. Materi akan muncul setelah admin menerbitkannya.
          </p>
        </div>
      ) : !filtered.length ? (
        <div className={styles.empty}>
          <Search aria-hidden="true" size={28} />
          <h3>Belum ada latihan yang cocok.</h3>
          <p>Coba kata kunci lain atau hapus filter untuk melihat semua latihan.</p>
          <button type="button" onClick={reset}>
            Tampilkan semua latihan
          </button>
        </div>
      ) : (
        <div className={styles.lessonGrid}>
          {filtered.map((quiz) => (
            <AcademyLessonCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </section>
  );
}
