/* Leonida Legend - views.
   Renders the header progress, the tracker (filters, list, detail pane),
   the roadmap, the missables page and the save-data page. */

function llEsc(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function llIsSpoilerHidden(ctx, trophy) {
  return ctx.state.spoiler && trophy.kind === "story" && !llIsEarned(ctx.state, trophy);
}

function llBadges(trophy, earned) {
  const parts = [];
  parts.push('<span class="badge grade-' + llEsc(trophy.grade) + '">' + llEsc(trophy.grade) + "</span>");
  parts.push('<span class="badge">' + llEsc(llKindLabel(trophy.kind)) + "</span>");
  if (trophy.hidden) parts.push('<span class="badge hidden">Hidden on PSN</span>');
  if (trophy.missable) parts.push('<span class="badge missable">Missable</span>');
  parts.push('<span class="badge">Stage ' + trophy.stage + "</span>");
  if (earned) parts.push('<span class="badge earned">Earned</span>');
  return parts.join("");
}

/* ---------------- header ---------------- */

function llRenderHeader(ctx) {
  const summary = llSummarise(ctx.state, ctx.data.trophies);
  const gradeOrder = ["platinum", "gold", "silver", "bronze"];
  const gradeHtml = gradeOrder
    .map(function (grade) {
      const g = summary.byGrade[grade] || { earned: 0, total: 0 };
      return '<span><span class="dot ' + grade + '"></span>' + grade + " " + g.earned + "/" + g.total + "</span>";
    })
    .join("");
  ctx.els.headerProgress.innerHTML =
    '<div class="progress-numbers"><span><strong>' +
    summary.earned + " / " + summary.total + "</strong> trophies earned</span><span>" +
    summary.percent + "% to platinum</span></div>" +
    '<div class="progress-bar"><div class="progress-fill" style="width:' + summary.percent + '%"></div></div>' +
    '<div class="grade-counts">' + gradeHtml + "</div>";
}

/* ---------------- toolbar ---------------- */

function llChipRow(name, options, current) {
  return options
    .map(function ([key, label]) {
      const cls = "chip" + (name === "grade" && key !== "all" ? " grade-" + key : "") + (current === key ? " is-on" : "");
      return '<button type="button" class="' + cls + '" data-filter="' + name + '" data-value="' + llEsc(key) + '">' + llEsc(label) + "</button>";
    })
    .join("");
}

function llRenderToolbar(ctx) {
  const f = ctx.filters;
  ctx.els.toolbar.innerHTML =
    '<div class="field"><label for="search-input">Search trophies</label>' +
    '<input class="search-input" id="search-input" type="search" placeholder="Search name, description, guide..." value="' + llEsc(f.search) + '"></div>' +
    '<div class="field"><label>Grade</label><div class="chip-row">' + llChipRow("grade", LL_GRADES, f.grade) + "</div></div>" +
    '<div class="field"><label>Kind</label><div class="chip-row">' + llChipRow("kind", LL_KINDS, f.kind) + "</div></div>" +
    '<div class="field"><label>Filters</label><div class="chip-row">' +
    '<button type="button" class="chip' + (f.missableOnly ? " is-on" : "") + '" data-filter="missableOnly" data-value="toggle">Missable only</button>' +
    '<button type="button" class="chip' + (f.hideEarned ? " is-on" : "") + '" data-filter="hideEarned" data-value="toggle">Hide earned</button>' +
    "</div></div>" +
    '<div class="field"><label>Spoiler mode</label>' +
    '<label class="toggle"><input type="checkbox" id="spoiler-toggle"' + (ctx.state.spoiler ? " checked" : "") + "> Hide story trophies until earned</label></div>";

  ctx.els.toolbar.querySelector("#search-input").addEventListener("input", function (event) {
    ctx.filters.search = event.target.value;
    llRenderList(ctx);
  });
  ctx.els.toolbar.querySelectorAll("[data-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const name = btn.getAttribute("data-filter");
      const value = btn.getAttribute("data-value");
      if (name === "grade") ctx.filters.grade = value;
      if (name === "kind") ctx.filters.kind = value;
      if (name === "missableOnly") ctx.filters.missableOnly = !ctx.filters.missableOnly;
      if (name === "hideEarned") ctx.filters.hideEarned = !ctx.filters.hideEarned;
      llRenderToolbar(ctx);
      llRenderList(ctx);
    });
  });
  ctx.els.toolbar.querySelector("#spoiler-toggle").addEventListener("change", function (event) {
    ctx.state.spoiler = event.target.checked;
    llSaveState(ctx.state);
    llRenderList(ctx);
    llRenderDetail(ctx);
  });
}

/* ---------------- tracker list ---------------- */

function llFilteredTrophies(ctx) {
  const f = ctx.filters;
  const needle = f.search.trim().toLowerCase();
  return ctx.data.trophies.filter(function (trophy) {
    if (f.grade !== "all" && trophy.grade !== f.grade) return false;
    if (f.kind !== "all" && trophy.kind !== f.kind) return false;
    if (f.missableOnly && !trophy.missable) return false;
    if (f.hideEarned && llIsEarned(ctx.state, trophy)) return false;
    if (needle) {
      const haystack = (trophy.name + " " + trophy.description + " " + trophy.guide + " " + llKindLabel(trophy.kind)).toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

function llRenderList(ctx) {
  const trophies = llFilteredTrophies(ctx);
  const summary = llSummarise(ctx.state, ctx.data.trophies);
  ctx.els.listSummary.textContent =
    "Showing " + trophies.length + " of " + ctx.data.trophies.length + " trophies - " +
    summary.earned + " earned overall. Click a trophy to open its guide, then tick it off or set its counter in the detail pane. Progress saves automatically in this browser.";

  ctx.els.list.innerHTML = trophies
    .map(function (trophy) {
      const earned = llIsEarned(ctx.state, trophy);
      const hidden = llIsSpoilerHidden(ctx, trophy);
      const name = hidden ? "Hidden story trophy" : trophy.name;
      const desc = hidden ? "Spoiler mode is on: finish the story or earn this trophy to reveal it." : trophy.description;
      let progress = "";
      if (trophy.target !== null && trophy.target !== undefined) {
        const current = Math.min(ctx.state.counters[trophy.id] || 0, trophy.target);
        progress = '<div class="row-progress"><strong>' + llFormatNumber(current) + " / " + llFormatNumber(trophy.target) + "</strong>" + llEsc(trophy.unit || "") + "</div>";
      } else {
        progress = '<div class="row-progress"><strong>' + (earned ? "Done" : "Open") + "</strong></div>";
      }
      const badges = hidden
        ? '<span class="badge spoiler">Spoiler hidden</span><span class="badge grade-' + llEsc(trophy.grade) + '">' + llEsc(trophy.grade) + "</span>"
        : llBadges(trophy, earned);
      return (
        '<li><button type="button" class="trophy-row grade-' + llEsc(trophy.grade) +
        (earned ? " is-earned" : "") + (ctx.selectedId === trophy.id ? " is-selected" : "") +
        '" data-select="' + llEsc(trophy.id) + '">' +
        '<span class="row-check">' + (earned ? "&#10003;" : "") + "</span>" +
        '<span class="row-main"><span class="row-name">' + llEsc(name) + "</span>" +
        '<span class="row-desc">' + llEsc(desc) + "</span>" +
        '<span class="row-meta">' + badges + "</span></span>" +
        progress +
        "</button></li>"
      );
    })
    .join("");

  ctx.els.list.querySelectorAll("[data-select]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      ctx.selectedId = btn.getAttribute("data-select");
      llRenderList(ctx);
      llRenderDetail(ctx);
    });
  });
}

/* ---------------- detail pane ---------------- */

function llRenderDetail(ctx) {
  const pane = ctx.els.detail;
  const trophy = ctx.data.trophies.find((t) => t.id === ctx.selectedId);
  if (!trophy) {
    pane.innerHTML = '<p class="detail-empty">Select a trophy from the list to read its full guide: what to do, when it unlocks, the steps that matter, and the sources the guide is built on. Your progress is saved in this browser automatically.</p>';
    return;
  }
  const earned = llIsEarned(ctx.state, trophy);
  const hidden = llIsSpoilerHidden(ctx, trophy);

  if (hidden) {
    pane.innerHTML =
      "<h2>Spoiler-protected story trophy</h2>" +
      '<p class="detail-desc">This is a ' + llEsc(trophy.grade) + " story trophy.</p>" +
      '<div class="detail-badges"><span class="badge spoiler">Spoiler hidden</span>' + llBadges(trophy, earned) + "</div>" +
      '<p class="detail-guide">Spoiler mode is on, so the name, description and guide for this story trophy stay hidden until you earn it. Turn spoiler mode off in the toolbar if you want to read ahead.</p>' +
      '<div class="detail-actions"><button type="button" class="btn' + (earned ? " earned-btn" : " primary") + '" id="detail-toggle">' +
      (earned ? "Earned - tap to undo" : "Mark as earned") + "</button></div>";
  } else {
    const steps = trophy.steps.map((s) => "<li>" + llEsc(s) + "</li>").join("");
    const sources = trophy.sources
      .map((s) => '<li><a href="' + llEsc(s.url) + '" target="_blank" rel="noopener noreferrer">' + llEsc(s.label) + "</a></li>")
      .join("");
    let counter = "";
    if (trophy.target !== null && trophy.target !== undefined) {
      const current = ctx.state.counters[trophy.id] || 0;
      counter =
        '<h3>Progress counter</h3><div class="counter-box">' +
        '<button type="button" class="counter-btn" id="counter-minus" aria-label="Decrease counter">-</button>' +
        '<span class="count">' + llFormatNumber(current) + " <small>/ " + llFormatNumber(trophy.target) + " " + llEsc(trophy.unit || "") + "</small></span>" +
        '<button type="button" class="counter-btn" id="counter-plus" aria-label="Increase counter">+</button>' +
        '<input class="counter-input" id="counter-input" type="number" min="0" value="' + current + '" aria-label="Set counter value">' +
        "</div>";
    }
    pane.innerHTML =
      "<h2>" + llEsc(trophy.name) + "</h2>" +
      '<p class="detail-desc">&ldquo;' + llEsc(trophy.description) + "&rdquo;</p>" +
      '<div class="detail-badges">' + llBadges(trophy, earned) + "</div>" +
      "<h3>Guide</h3>" +
      '<p class="detail-guide">' + llEsc(trophy.guide) + "</p>" +
      "<h3>Steps</h3>" +
      '<ol class="detail-steps">' + steps + "</ol>" +
      counter +
      "<h3>Sources for this guide</h3>" +
      '<ul class="source-list">' + sources + "</ul>" +
      '<div class="detail-actions"><button type="button" class="btn' + (earned ? " earned-btn" : " primary") + '" id="detail-toggle">' +
      (earned ? "Earned - tap to undo" : "Mark as earned") + "</button></div>";
  }

  const toggleBtn = pane.querySelector("#detail-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      llToggleEarned(ctx.state, trophy);
      llSaveState(ctx.state);
      llRenderHeader(ctx);
      llRenderList(ctx);
      llRenderDetail(ctx);
    });
  }
  const minus = pane.querySelector("#counter-minus");
  const plus = pane.querySelector("#counter-plus");
  const input = pane.querySelector("#counter-input");
  if (minus && plus && input) {
    minus.addEventListener("click", function () {
      llSetCounter(ctx.state, trophy, (ctx.state.counters[trophy.id] || 0) - llCounterStep(trophy));
      llSaveState(ctx.state);
      llRenderHeader(ctx); llRenderList(ctx); llRenderDetail(ctx);
    });
    plus.addEventListener("click", function () {
      llSetCounter(ctx.state, trophy, (ctx.state.counters[trophy.id] || 0) + llCounterStep(trophy));
      llSaveState(ctx.state);
      llRenderHeader(ctx); llRenderList(ctx); llRenderDetail(ctx);
    });
    input.addEventListener("change", function () {
      llSetCounter(ctx.state, trophy, Number(input.value));
      llSaveState(ctx.state);
      llRenderHeader(ctx); llRenderList(ctx); llRenderDetail(ctx);
    });
  }
}

function llCounterStep(trophy) {
  if (trophy.target && trophy.target >= 10000) return 500;
  if (trophy.target && trophy.target >= 1000) return 10;
  return 1;
}

/* ---------------- roadmap ---------------- */

function llRenderRoadmap(ctx) {
  const facts =
    '<div class="fact-strip">' +
    '<div class="fact-card"><div class="fact-value">' + llEsc(ctx.data.meta.difficulty) + '</div><div class="fact-label">Difficulty</div></div>' +
    '<div class="fact-card"><div class="fact-value">' + llEsc(ctx.data.meta.estimatedHours) + '</div><div class="fact-label">Estimated time</div></div>' +
    '<div class="fact-card"><div class="fact-value">1</div><div class="fact-label">Playthrough needed</div></div>' +
    '<div class="fact-card"><div class="fact-value">1</div><div class="fact-label">Potentially missable trophy</div></div>' +
    '<div class="fact-card"><div class="fact-value">55</div><div class="fact-label">Trophies (1P / 2G / 6S / 46B)</div></div>' +
    "</div>";

  const stages = LL_ROADMAP.map(function (stage) {
    const inStage = ctx.data.trophies.filter((t) => t.stage === stage.stage);
    const done = inStage.filter((t) => llIsEarned(ctx.state, t)).length;
    const chips = inStage
      .map(function (t) {
        const isDone = llIsEarned(ctx.state, t);
        return '<button type="button" class="stage-trophy-chip' + (isDone ? " done" : "") + '" data-goto-trophy="' + llEsc(t.id) + '">' + llEsc(t.name) + (t.missable ? " (missable)" : "") + "</button>";
      })
      .join("");
    const tips = stage.tips.map((tip) => "<p>- " + llEsc(tip) + "</p>").join("");
    return (
      '<article class="stage-card"><h3>' + llEsc(stage.title) + '<span class="stage-hours">' + llEsc(stage.hours) + "</span></h3>" +
      '<div class="stage-progress">' + done + " of " + inStage.length + " trophies in this stage earned</div>" +
      "<p>" + llEsc(stage.body) + "</p>" + tips +
      '<div class="stage-trophies">' + chips + "</div></article>"
    );
  }).join("");

  ctx.els.roadmap.innerHTML =
    '<div class="page-intro"><h2>Roadmap to Platinum</h2>' +
    "<p>One playthrough, four stages. The story comes first because the whole map, the partner system and the money loop open up as it progresses; the 100% Completion checklist is the long middle; character lines and odd jobs are the cleanup. Estimates follow the roadmap sources cited across this app (PowerPyx rates the platinum 4/10 difficulty at roughly 200 hours).</p></div>" +
    facts + stages;

  ctx.els.roadmap.querySelectorAll("[data-goto-trophy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      ctx.selectedId = btn.getAttribute("data-goto-trophy");
      llShowView(ctx, "tracker");
      llRenderList(ctx);
      llRenderDetail(ctx);
    });
  });
}

/* ---------------- missables ---------------- */

function llRenderMissables(ctx) {
  const missables = ctx.data.trophies.filter((t) => t.missable);
  const cards = missables
    .map(function (t) {
      return (
        '<article class="warning-card"><h3>' + llEsc(t.name) + ' <span class="badge missable">Missable</span></h3>' +
        '<p><em>&ldquo;' + llEsc(t.description) + '&rdquo;</em></p>' +
        '<p>' + llEsc(t.guide) + "</p>" +
        '<button type="button" class="btn small" data-goto-trophy="' + llEsc(t.id) + '">Open the full guide</button></article>'
      );
    })
    .join("");

  const safe = LL_SAFE_NOTES.map(function (note) {
    return "<li><strong>" + llEsc(note.title) + ":</strong> " + llEsc(note.body) + "</li>";
  }).join("");

  ctx.els.missables.innerHTML =
    '<div class="page-intro"><h2>Missables &amp; Warnings</h2><p>' + llEsc(LL_MISSABLE_INTRO) + "</p></div>" +
    cards +
    '<article class="safe-card"><h3>Confirmed safe - do not stress about these</h3><ul>' + safe + "</ul></article>";

  ctx.els.missables.querySelectorAll("[data-goto-trophy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      ctx.selectedId = btn.getAttribute("data-goto-trophy");
      llShowView(ctx, "tracker");
      llRenderList(ctx);
      llRenderDetail(ctx);
    });
  });
}

/* ---------------- save data ---------------- */

function llRenderSave(ctx) {
  ctx.els.save.innerHTML =
    '<div class="page-intro"><h2>Save Data</h2>' +
    "<p>Your tracker progress (earned trophies, counters and the spoiler setting) is stored in this browser's local storage and never leaves your device. Use export to back it up or move it to another browser, import to restore it, and reset to start over.</p></div>" +
    '<div class="save-grid">' +
    '<article class="save-card"><h3>Export progress</h3>' +
    "<p>Copy this JSON somewhere safe. It contains only your tracker progress, nothing else.</p>" +
    '<textarea id="export-box" readonly>' + llEsc(llExportJSON(ctx.state)) + "</textarea>" +
    '<div class="detail-actions"><button type="button" class="btn primary" id="export-refresh">Refresh export</button>' +
    '<button type="button" class="btn" id="export-download">Download .json</button></div>' +
    '<p class="save-status" id="export-status"></p></article>' +
    '<article class="save-card"><h3>Import progress</h3>' +
    "<p>Paste a previously exported Leonida Legend JSON below and import it. This replaces the progress currently stored in this browser.</p>" +
    '<textarea id="import-box" placeholder="Paste exported progress JSON here"></textarea>' +
    '<div class="detail-actions"><button type="button" class="btn primary" id="import-run">Import progress</button></div>' +
    '<p class="save-status" id="import-status"></p></article>' +
    '<article class="save-card"><h3>Reset</h3>' +
    "<p>Clear every earned mark and counter in this browser and start the hunt from zero. This cannot be undone unless you exported first.</p>" +
    '<div class="detail-actions"><button type="button" class="btn danger" id="reset-run">Reset all progress</button></div>' +
    '<p class="save-status" id="reset-status"></p></article>' +
    "</div>";

  ctx.els.save.querySelector("#export-refresh").addEventListener("click", function () {
    ctx.els.save.querySelector("#export-box").value = llExportJSON(ctx.state);
    ctx.els.save.querySelector("#export-status").textContent = "Export refreshed with your latest progress.";
  });
  ctx.els.save.querySelector("#export-download").addEventListener("click", function () {
    const blob = new Blob([llExportJSON(ctx.state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leonida-legend-progress.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    ctx.els.save.querySelector("#export-status").textContent = "Progress file downloaded.";
  });
  ctx.els.save.querySelector("#import-run").addEventListener("click", function () {
    const status = ctx.els.save.querySelector("#import-status");
    try {
      const text = ctx.els.save.querySelector("#import-box").value;
      ctx.state = llImportJSON(text, ctx.data.trophies);
      llSaveState(ctx.state);
      status.textContent = "Import complete. Your tracker now shows the imported progress.";
      status.classList.remove("error");
      llRenderHeader(ctx); llRenderToolbar(ctx); llRenderList(ctx); llRenderDetail(ctx); llRenderRoadmap(ctx); llRenderMissables(ctx);
    } catch (err) {
      status.textContent = "Import failed: " + err.message;
      status.classList.add("error");
    }
  });
  ctx.els.save.querySelector("#reset-run").addEventListener("click", function () {
    ctx.state = llEmptyState();
    llSaveState(ctx.state);
    ctx.els.save.querySelector("#reset-status").textContent = "All progress cleared. Fresh start, future Legend.";
    llRenderHeader(ctx); llRenderToolbar(ctx); llRenderList(ctx); llRenderDetail(ctx); llRenderRoadmap(ctx); llRenderMissables(ctx); llRenderSaveRefreshExport(ctx);
  });
}

function llRenderSaveRefreshExport(ctx) {
  const box = ctx.els.save.querySelector("#export-box");
  if (box) box.value = llExportJSON(ctx.state);
}

/* ---------------- footer ---------------- */

function llRenderFooterSources(ctx) {
  const links = ctx.data.meta.sources
    .map((s) => '<a href="' + llEsc(s.url) + '" target="_blank" rel="noopener noreferrer">' + llEsc(s.label) + "</a>")
    .join(" &middot; ");
  ctx.els.footerSources.innerHTML = "Guide sources: " + links;
}
