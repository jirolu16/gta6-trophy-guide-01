/* Leonida Legend - app boot and view navigation. */

const llCtx = {
  data: null,
  state: llLoadState(),
  filters: { search: "", grade: "all", kind: "all", missableOnly: false, hideEarned: false },
  selectedId: null,
  els: {}
};

function llShowView(ctx, name) {
  document.querySelectorAll(".main-nav .nav-btn").forEach(function (btn) {
    btn.classList.toggle("is-active", btn.getAttribute("data-view") === name);
  });
  document.querySelectorAll(".view").forEach(function (section) {
    section.classList.toggle("is-active", section.id === "view-" + name);
  });
  if (name === "roadmap") llRenderRoadmap(ctx);
  if (name === "missables") llRenderMissables(ctx);
  if (name === "save") llRenderSave(ctx);
  window.scrollTo({ top: 0 });
}

function llInitEls() {
  llCtx.els = {
    headerProgress: document.getElementById("header-progress"),
    toolbar: document.getElementById("toolbar"),
    listSummary: document.getElementById("list-summary"),
    list: document.getElementById("trophy-list"),
    detail: document.getElementById("detail-pane"),
    roadmap: document.getElementById("view-roadmap"),
    missables: document.getElementById("view-missables"),
    save: document.getElementById("view-save"),
    footerSources: document.getElementById("footer-sources")
  };
}

async function llBoot() {
  llInitEls();
  document.querySelectorAll(".main-nav .nav-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      llShowView(llCtx, btn.getAttribute("data-view"));
    });
  });
  try {
    llCtx.data = await llLoadData();
    /* Open the guide on the one missable trophy: it shows off the guide
       format (steps, counter, sources) the moment the app loads. */
    const missable = llCtx.data.trophies.find((t) => t.missable);
    llCtx.selectedId = missable ? missable.id : llCtx.data.trophies[0].id;
    llRenderHeader(llCtx);
    llRenderToolbar(llCtx);
    llRenderList(llCtx);
    llRenderDetail(llCtx);
    llRenderFooterSources(llCtx);
  } catch (err) {
    llCtx.els.listSummary.textContent = "Failed to load trophy data: " + err.message;
    llCtx.els.detail.innerHTML = '<p class="detail-empty">The trophy data file could not be loaded. If you opened this page from a local file, serve the app folder with a small static server instead (see serve.ts in the project root).</p>';
  }
}

document.addEventListener("DOMContentLoaded", llBoot);
