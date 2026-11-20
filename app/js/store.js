/* Leonida Legend - progress store.
   Persists earned trophies, numeric counters and the spoiler setting in
   localStorage, and handles export / import / reset of that save data. */

const LL_STORAGE_KEY = "leonida-legend-progress-v1";

function llEmptyState() {
  return { earned: {}, counters: {}, spoiler: false };
}

function llLoadState() {
  try {
    const raw = window.localStorage.getItem(LL_STORAGE_KEY);
    if (!raw) return llEmptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return llEmptyState();
    return {
      earned: parsed.earned && typeof parsed.earned === "object" ? parsed.earned : {},
      counters: parsed.counters && typeof parsed.counters === "object" ? parsed.counters : {},
      spoiler: parsed.spoiler === true
    };
  } catch (err) {
    return llEmptyState();
  }
}

function llSaveState(state) {
  try {
    window.localStorage.setItem(LL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    /* Storage can be unavailable (private mode, quota). The tracker keeps
       working in memory for the session in that case. */
  }
}

function llIsEarned(state, trophy) {
  if (state.earned[trophy.id]) return true;
  if (trophy.target !== null && trophy.target !== undefined) {
    return (state.counters[trophy.id] || 0) >= trophy.target;
  }
  return false;
}

function llToggleEarned(state, trophy) {
  if (llIsEarned(state, trophy) && !state.earned[trophy.id]) {
    /* Earned only because the counter reached its target: pin it off by
       dropping the counter just below the target. */
    state.counters[trophy.id] = Math.max(0, (trophy.target || 1) - 1);
    return;
  }
  if (state.earned[trophy.id]) {
    delete state.earned[trophy.id];
  } else {
    state.earned[trophy.id] = true;
    if (trophy.target !== null && trophy.target !== undefined) {
      state.counters[trophy.id] = trophy.target;
    }
  }
}

function llSetCounter(state, trophy, value) {
  const clean = Math.max(0, Math.floor(Number(value) || 0));
  state.counters[trophy.id] = clean;
  if (trophy.target !== null && trophy.target !== undefined && clean >= trophy.target) {
    state.earned[trophy.id] = true;
  } else if (state.earned[trophy.id] && trophy.target !== null && trophy.target !== undefined && clean < trophy.target) {
    delete state.earned[trophy.id];
  }
}

function llSummarise(state, trophies) {
  const summary = {
    earned: 0,
    total: trophies.length,
    percent: 0,
    byGrade: {}
  };
  for (const trophy of trophies) {
    if (!summary.byGrade[trophy.grade]) {
      summary.byGrade[trophy.grade] = { earned: 0, total: 0 };
    }
    summary.byGrade[trophy.grade].total += 1;
    if (llIsEarned(state, trophy)) {
      summary.earned += 1;
      summary.byGrade[trophy.grade].earned += 1;
    }
  }
  summary.percent = summary.total === 0 ? 0 : Math.round((summary.earned / summary.total) * 100);
  return summary;
}

function llExportJSON(state) {
  return JSON.stringify(
    {
      app: "leonida-legend",
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: state.earned,
      counters: state.counters,
      spoiler: state.spoiler
    },
    null,
    2
  );
}

function llImportJSON(text, trophies) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("That file is not a Leonida Legend progress export.");
  }
  const known = new Set(trophies.map((t) => t.id));
  const next = llEmptyState();
  if (parsed.earned && typeof parsed.earned === "object") {
    for (const id of Object.keys(parsed.earned)) {
      if (known.has(id) && parsed.earned[id]) next.earned[id] = true;
    }
  }
  if (parsed.counters && typeof parsed.counters === "object") {
    for (const id of Object.keys(parsed.counters)) {
      const value = Number(parsed.counters[id]);
      if (known.has(id) && Number.isFinite(value) && value > 0) {
        next.counters[id] = Math.floor(value);
      }
    }
  }
  next.spoiler = parsed.spoiler === true;
  /* A counter at or past its target also marks the trophy earned. */
  for (const trophy of trophies) {
    if (trophy.target !== null && trophy.target !== undefined && (next.counters[trophy.id] || 0) >= trophy.target) {
      next.earned[trophy.id] = true;
    }
  }
  return next;
}
