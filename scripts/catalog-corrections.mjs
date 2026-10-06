/** Build-time, versioned corrections authorized by the parent. Never touches learner storage. */
import {validateLibrary} from '../src/core.js';
const copy = value => structuredClone(value);
const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
const editable = new Set(['theme', 'topicId', 'name', 'song', 'sourceNotes', 'sourceQuestions', 'sourceAnswers', 'reading']);
const sourceFields = ['classId', 'theme', 'topicId', 'name', 'date', 'lessonNumber', 'song', 'targets', 'sourceCoreWords', 'sourceKeyWords', 'sourceQuestions', 'sourceAnswers', 'sourceNotes', 'reading'];

export function applyCatalogCorrections(input, specification, provenance) {
  requireThat(specification?.schemaVersion === 1 && typeof specification.authority === 'string' && specification.authority.trim(), 'Corrections need an explicit authority');
  requireThat(Array.isArray(specification.operations) && provenance?.file && provenance?.version, 'Corrections need operations and versioned provenance');
  const library = copy(input.library), registry = copy(input.registry);
  const items = new Map(library.items.map(item => [item.id, item]));
  const lessons = new Map(library.lessons.map(lesson => [lesson.id, lesson]));
  const touched = new Set();
  const stamp = {file: provenance.file, contentVersion: provenance.version, authority: specification.authority};
  const lessonFor = id => { const lesson = lessons.get(id); requireThat(lesson, 'Unknown correction lesson: ' + id); return lesson; };
  const touch = (lesson, code) => {
    if (!lesson.originalSource) lesson.originalSource = Object.fromEntries(sourceFields.filter(key => key in lesson).map(key => [key, copy(lesson[key])]));
    lesson.appliedCorrections ||= [];
    if (!lesson.appliedCorrections.some(entry => entry.code === code && entry.file === stamp.file)) lesson.appliedCorrections.push({...stamp, code});
    touched.add(lesson.id);
  };
  const setTargets = (lesson, role, ids) => {
    requireThat(['core', 'key'].includes(role) && Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length, 'Invalid corrected target list');
    for (const id of ids) requireThat(items.get(id)?.status === 'ready' && items.get(id)?.recordType !== 'source-gap', 'Correction references an unready target: ' + id);
    const other = lesson.targets.filter(target => target.role !== role);
    const next = ids.map(itemId => ({itemId, role}));
    lesson.targets = role === 'core' ? [...next, ...other] : [...other, ...next];
    requireThat(new Set(lesson.targets.map(target => target.itemId)).size === lesson.targets.length, 'Corrected lesson has duplicate targets: ' + lesson.id);
  };
  for (const operation of specification.operations) {
    requireThat(typeof operation.code === 'string' && operation.code.trim(), 'Correction needs an issue code');
    const {code, type} = operation;
    if (type === 'lesson') {
      const lesson = lessonFor(operation.lessonId);
      for (const [key, value] of Object.entries(operation.expect || {})) requireThat(lesson[key] === value, 'Stale correction precondition: ' + lesson.id + '.' + key);
      for (const key of Object.keys(operation.fields || {})) requireThat(editable.has(key), 'Unsupported lesson correction field: ' + key);
      touch(lesson, code);
      Object.assign(lesson, copy(operation.fields || {}));
      requireThat(library.topics.some(topic => topic.id === lesson.topicId), 'Correction uses an unknown topic');
      if (operation.resolveMetadataIssue) library.ambiguities = library.ambiguities.filter(issue => issue.lessonId !== lesson.id);
    } else if (type === 'set-targets') {
      const lesson = lessonFor(operation.lessonId); touch(lesson, code);
      setTargets(lesson, operation.role, operation.itemIds);
    } else if (type === 'review-union') {
      const lesson = lessonFor(operation.lessonId);
      requireThat(['core', 'key'].includes(operation.role) && Number.isInteger(operation.from) && Number.isInteger(operation.to) && operation.from >= 1 && operation.to >= operation.from, 'Invalid review range');
      const sources = [];
      for (let number = operation.from; number <= operation.to; number++) {
        const matches = library.lessons.filter(source => source.classId === lesson.classId && source.topicId === lesson.topicId && source.lessonNumber === number && source.id !== lesson.id);
        requireThat(matches.length === 1, 'Review source missing or ambiguous: ' + lesson.id + ' / ' + number);
        sources.push(matches[0]);
      }
      const inherited = sources.flatMap(source => source.targets.filter(target => target.role === operation.role).map(target => target.itemId));
      for (const id of inherited) requireThat(items.get(id)?.status === 'ready' && items.get(id)?.recordType !== 'source-gap', 'Review source remains unresolved: ' + id);
      const explicit = operation.keepExplicit ? lesson.targets.filter(target => target.role === operation.role && items.get(target.itemId)?.recordType !== 'source-gap').map(target => target.itemId) : [];
      touch(lesson, code);
      setTargets(lesson, operation.role, [...new Set([...inherited, ...explicit])]);
      lesson.reviewDefinition = {role: operation.role, sourceLessonIds: sources.map(source => source.id), fromLesson: operation.from, toLesson: operation.to, retainedExplicitItemIds: explicit.filter(id => !inherited.includes(id)), ...stamp};
    } else if (type === 'copy-speaking') {
      const lesson = lessonFor(operation.lessonId), source = lessonFor(operation.fromLessonId); touch(lesson, code);
      lesson.sourceQuestions = copy(source.sourceQuestions); lesson.sourceAnswers = copy(source.sourceAnswers);
      lesson.speakingReference = {fromLessonId: source.id, ...stamp};
    } else if (type === 'split-item') {
      requireThat(items.has(operation.itemId) && Array.isArray(operation.into) && operation.into.length > 1 && new Set(operation.into).size === operation.into.length, 'Invalid item split');
      operation.into.forEach(id => requireThat(items.get(id)?.status === 'ready', 'Split target missing: ' + id));
      const affected = library.lessons.filter(lesson => lesson.targets.some(target => target.itemId === operation.itemId));
      requireThat(affected.length > 0, 'Split has no active lesson references');
      for (const lesson of affected) {
        touch(lesson, code);
        lesson.targets = lesson.targets.flatMap(target => target.itemId === operation.itemId ? operation.into.map(itemId => ({itemId, role: target.role})) : [target]);
      }
      for (const resolution of library.resolutions || []) if (resolution.itemId === operation.itemId && !resolution.supersededBy) resolution.supersededBy = {code, replacementItemIds: copy(operation.into), ...stamp};
    } else if (type === 'archive-items') {
      for (const id of operation.itemIds || []) {
        const item = items.get(id); requireThat(item, 'Cannot archive unknown item: ' + id);
        requireThat(!library.lessons.some(lesson => lesson.targets.some(target => target.itemId === id)), 'Cannot archive referenced item: ' + id);
        (library.archivedItems ||= []).push({item: copy(item), reason: operation.reason, ...stamp});
        const illustration = registry.records.find(record => record.itemId === id);
        if (illustration) (registry.archivedRecords ||= []).push({record: copy(illustration), reason: operation.reason, ...stamp});
        library.items = library.items.filter(value => value.id !== id); registry.records = registry.records.filter(value => value.itemId !== id); items.delete(id);
        library.ambiguities = library.ambiguities.filter(issue => issue.itemId !== id);
      }
    } else throw new Error('Unsupported correction operation: ' + type);
  }
  for (const id of touched) {
    const lesson = lessonFor(id), source = library.sources.find(value => value.id === lesson.sourceId);
    requireThat(source, 'Corrected lesson source missing: ' + id);
    for (const role of ['core', 'key']) lesson[role === 'core' ? 'sourceCoreWords' : 'sourceKeyWords'] = lesson.targets.filter(target => target.role === role).map(target => items.get(target.itemId).word);
    source.effectiveMetadata = {classId: lesson.classId, theme: lesson.theme, topicId: lesson.topicId, lessonNumber: lesson.lessonNumber, name: lesson.name, date: lesson.date, song: lesson.song || '', ...stamp};
    for (const target of lesson.targets) {
      const item = items.get(target.itemId); item.sourceRefs ||= [];
      if (!item.sourceRefs.includes(lesson.sourceId)) item.sourceRefs.push(lesson.sourceId);
    }
  }
  (library.correctionHistory ||= []).push({...stamp, codes: [...new Set(specification.operations.map(operation => operation.code))], lessonIds: [...touched]});
  validateLibrary(library);
  requireThat(registry.records.length === library.items.length && new Set(registry.records.map(record => record.itemId)).size === library.items.length && registry.records.every(record => items.has(record.itemId)), 'Corrected illustration registry is inconsistent');
  return {library, registry};
}
