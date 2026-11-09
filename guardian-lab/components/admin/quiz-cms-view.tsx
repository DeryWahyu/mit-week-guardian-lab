"use client";
import { AcademyTopicArt } from "@/components/academy/academy-topic-art";
import { landingTypography } from "@/components/landing/landing-font";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ADMIN_ROUTES } from "@/lib/routes";
import styles from "./admin.module.css";
import { AdminBadge, AdminEmpty, AdminHeader, AdminLoading, AdminProblem } from "./admin-ui";
import { QuizEditor } from "./quiz-editor";
import thumbnailStyles from "./quiz-thumbnail.module.css";
import { useQuizCms } from "./use-quiz-cms";
export function QuizCmsView({ scope }: { scope: string }) {
  const cms = useQuizCms(scope),
    list = cms.list;
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Rawat bekal belajar Guardian."
        description="Susun materi, soal dan pembahasan. Publikasi serta arsip tetap menjaga riwayat belajar."
        actions={
          <button
            type="button"
            className={styles.primary}
            disabled={cms.pending || Boolean(list.problem) || Boolean(cms.editor)}
            onClick={cms.create}
          >
            Buat kuis
          </button>
        }
      />
      {list.loading ? (
        <AdminLoading />
      ) : list.problem || !list.data ? (
        list.problem ? (
          <AdminProblem problem={list.problem} retry={list.retry} reset={ADMIN_ROUTES.quizzes} />
        ) : null
      ) : (
        <>
          {cms.editor && (
            <QuizEditor
              value={cms.editor.value}
              change={(value) => cms.setEditor({ ...cms.editor, value })}
              pending={cms.pending}
              save={() => void cms.mutate()}
              cancel={() => cms.setEditor(null)}
              error={cms.error}
              thumbnailUrl={cms.editor.thumbnailUrl}
              thumbnail={cms.editor.thumbnail}
              changeThumbnail={(thumbnail) =>
                cms.setEditor((current) => (current ? { ...current, thumbnail } : null))
              }
            />
          )}
          <section className={styles.panel}>
            {!list.data.length ? (
              <>
                <AdminEmpty
                  title={cms.page > 1 ? "Halaman bank soal kosong." : "Belum ada kuis."}
                  description={
                    cms.page > 1
                      ? "Kembali ke halaman pertama untuk melihat materi yang tersedia."
                      : "Buat materi dan soal pertama untuk Academy."
                  }
                />
                {cms.page > 1 && (
                  <button type="button" className={styles.secondary} onClick={() => cms.setPage(1)}>
                    Halaman pertama
                  </button>
                )}
              </>
            ) : (
              <ul className={styles.activity}>
                {list.data.map((quiz) => (
                  <li key={quiz.id} className={thumbnailStyles.quizRow}>
                    <div className={thumbnailStyles.listSummary}>
                      <div className={thumbnailStyles.listCover}>
                        <AcademyTopicArt
                          category={quiz.category}
                          thumbnailUrl={quiz.thumbnailUrl}
                          sizes="96px"
                        />
                      </div>
                      <div>
                        <strong>{quiz.title}</strong>
                        <small>
                          {quiz.questions.length} soal · {quiz.expReward} EXP · {quiz.difficulty}
                        </small>
                        <AdminBadge tone={quiz.published ? "good" : "neutral"}>
                          {quiz.published ? "Terbit" : "Draf / arsip"}
                        </AdminBadge>
                      </div>
                    </div>
                    <div className={styles.inline}>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={cms.pending || Boolean(cms.editor)}
                        onClick={() => {
                          cms.setError(null);
                          cms.setEditor({
                            id: quiz.id,
                            revision: quiz.updatedAt,
                            value: quiz,
                            thumbnailUrl: quiz.thumbnailUrl,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={cms.pending || !quiz.published}
                        onClick={() => {
                          cms.setError(null);
                          cms.setArchive(quiz.id);
                        }}
                      >
                        Arsipkan
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <nav aria-label="Halaman bank soal" className={styles.pagination}>
        <span>Halaman {cms.page} · 10 kuis per halaman</span>
        <div>
          <button
            type="button"
            className={styles.secondary}
            disabled={cms.page <= 1 || cms.pending || Boolean(cms.editor) || list.loading}
            onClick={() => cms.setPage(cms.page - 1)}
          >
            Sebelumnya
          </button>
          <button
            type="button"
            className={styles.secondary}
            disabled={
              !list.data ||
              list.data.length < 10 ||
              cms.pending ||
              Boolean(cms.editor) ||
              list.loading
            }
            onClick={() => cms.setPage(cms.page + 1)}
          >
            Berikutnya
          </button>
        </div>
      </nav>
      <ConfirmDialog
        open={Boolean(cms.archive)}
        onOpenChange={(open) => {
          if (!open) cms.setArchive(null);
        }}
        title="Arsipkan kuis?"
        description="Kuis akan disembunyikan dari pengguna. Riwayat latihan dan EXP tetap tersimpan."
        pending={cms.pending}
        error={cms.error}
        confirmLabel="Arsipkan kuis"
        onConfirm={() => void cms.mutate(true)}
        className={landingTypography}
      />
    </div>
  );
}
