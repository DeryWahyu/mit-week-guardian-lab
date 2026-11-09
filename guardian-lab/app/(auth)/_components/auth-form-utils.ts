type FormIssue = { path: readonly PropertyKey[]; message: string };

export function collectFormErrors(issues: readonly FormIssue[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export function focusFormField(form: HTMLFormElement | null, field: string | undefined) {
  const input = field ? form?.elements.namedItem(field) : null;
  if (input instanceof HTMLElement) input.focus();
}
