function csvEscape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function exportResultsCsv(
  outcomes: {
    balloonNumber: number;
    questionId: string;
    category: string;
    correct: boolean;
    points: number;
    bonus: boolean;
    answeredAt: number;
  }[],
): string {
  const lines = [
    "balloonNumber,challengeId,game,result,points,bonusPoint,answeredAt",
  ];
  outcomes.forEach((o) => {
    lines.push(
      [
        String(o.balloonNumber),
        o.questionId,
        csvEscape(o.category),
        o.correct ? "correct" : "not-quite",
        String(o.points),
        o.bonus ? "yes" : "no",
        new Date(o.answeredAt).toISOString(),
      ].join(","),
    );
  });
  return lines.join("\n");
}

export function downloadFile(
  filename: string,
  content: string,
  mime = "text/csv",
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
