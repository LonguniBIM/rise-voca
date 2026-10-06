/** Compare saved results with current targets without rewriting historical evidence. */
export function currentLessonProgress(sessions, lesson) {
  const required = new Set(lesson.targets.map(target => target.itemId));
  const historical = sessions.filter(session => session.mode === 'lesson' && session.lessonIds.length === 1 && session.lessonIds[0] === lesson.id && session.status === 'completed');
  const current = historical.filter(session => {
    const recorded = session.questions.map(entry => entry.question.itemId);
    return recorded.length === required.size && new Set(recorded).size === recorded.length && recorded.every(id => required.has(id));
  });
  return {current, solved: current.filter(session => session.questions.every(entry => Boolean(entry.firstCorrect))), earlier: historical.length - current.length};
}
