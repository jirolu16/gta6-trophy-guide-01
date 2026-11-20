/* Leonida Legend - data layer.
   Loads the official trophy data (app/data/trophies.json) and holds the
   roadmap and warning content written for this guide. */

const LL_DATA_URL = "data/trophies.json";

const LL_KINDS = [
  ["all", "All kinds"],
  ["story", "Story"],
  ["completion", "Completion"],
  ["activities", "Activities"],
  ["characters", "Characters & Strangers"],
  ["collectibles", "Collectibles"],
  ["crime", "Crime & Robberies"],
  ["money", "Money"],
  ["secrets", "Secrets & Odd Jobs"]
];

const LL_GRADES = [
  ["all", "All grades"],
  ["platinum", "Platinum"],
  ["gold", "Gold"],
  ["silver", "Silver"],
  ["bronze", "Bronze"]
];

const LL_ROADMAP = [
  {
    stage: 1,
    title: "Stage 1 - The Story Run",
    hours: "About 60-80 hours",
    body: "Play the full story once, from Chapter 1 to the finale. There are no difficulty settings and no mission replay, and free roam continues after the credits, so nothing needs to be rushed. While travelling, build the long-term habits early: scan vehicles and WAiNK locations, study animals with the binoculars, and try each activity type once. Keep a manual save at the start of every chapter (the game gives you 15 manual slots plus one autosave). During Chapter 1, do not skip the morning scene at Jason's house described in the missable warning: it is the only moment in the game believed to be permanently losable.",
    tips: [
      "Accept Lucia's meditation invitation at Jason's house in Chapter 1 (see Missables).",
      "Start scanning vehicles and animals from Chapter 1; both feed the 100% checklist.",
      "Never enable cheat codes on this save: they disable trophies and saving."
    ]
  },
  {
    stage: 2,
    title: "Stage 2 - The 100% Checklist",
    hours: "About 100 hours",
    body: "After the story, open Progress, then Stats, then 100% Completion and work the checklist behind A Long Road. Finish the must-complete categories in full (Robberies, Underwater Discoveries, Shooting Ranges, Drone Races and Bret's Target Decks) and fill the quotas everywhere else: 100 optional missions, 200 vehicle scans, 100 animals studied, 300 stunts, 70 of 80 challenges, 15 of 18 meditations. Most grind trophies in this app live in this stage, including The Shootist, Cunning Stunts, Maximum Withdrawal and the money trophies, and bank vaults double as the best income for Little Boxes and Treat Yo Self.",
    tips: [
      "Bank vaults pay up to $205,000 each: they fund garages and spending trophies while filling the Robberies category.",
      "Meditate at each spot with both characters; paired meditations count double on the checklist.",
      "Leave the last few challenges and stunts for this stage, not the story run."
    ]
  },
  {
    stage: 3,
    title: "Stage 3 - People of Leonida & Cleanup",
    hours: "About 10 hours",
    body: "Finish the character quest lines (Andy, Kenton, Billy, Randy, Tyrone and Bret) and the eight Strangers & Freaks strands. Every quest giver stays available after the story, and even Kenton, who disappears for a while after Chapter 1, comes back during Chapters 2-3. Sweep up the remaining one-off trophies here as well: the tank at Mile Zero, the UFO Easter egg in Kelly County, and any counter trophies still short of their targets.",
    tips: [
      "Check the PS5 trophy tracker for Strangers & Freaks: only true stranger strands count, not the named quest lines.",
      "Bad Luck, I Guess still had no confirmed trigger when this guide was written; read its entry before experimenting."
    ]
  },
  {
    stage: 4,
    title: "Stage 4 - Leonida Legend",
    hours: "Final checks",
    body: "When 54 trophies are earned, Vice Got a Price! unlocks on its own. Use the tracker in this app to confirm nothing is left at a partial counter, then enjoy the platinum. Total estimate for the full run is around 200 hours at a difficulty of about 4/10, per the roadmap sources cited in this app.",
    tips: [
      "Export your tracker progress from the Save Data view as a backup before the final push."
    ]
  }
];

const LL_MISSABLE_INTRO =
  "Out of all 55 trophies, exactly one is flagged as potentially missable by the guide sources: Positive Mental Attitude. Everything else can be finished after the story, in free roam, at your own pace. This page collects the one real warning plus the near-misses that worry players but are confirmed safe.";

const LL_SAFE_NOTES = [
  {
    title: "Quest givers who seem to vanish",
    body: "Kenton becomes unavailable after Chapter 1, which looks like a missable line, but he returns during Chapters 2-3 and his quests can be finished after the story. Andy, Billy, Randy, Tyrone and Bret likewise stay available in free roam. Calling Brian as Jason during Chapter 2 speeds up Kenton's return text."
  },
  {
    title: "The Kingpin Bowling valuables",
    body: "Let's Go Bowling needs 3 key valuables at Kingpin Bowling. If you miss one during the Chapter 2 optional mission, the trophy is not lost: the robbery icon respawns (it takes a while) and you can return to steal whatever is left. The valuables do not need to be taken in a single run."
  },
  {
    title: "Expiring side content",
    body: "Some optional missions, hourglass quests and magazine or fence offers can expire as the story moves on. Per the roadmap sources, none of them feed any trophy or the 100% Completion checklist, which draws from a pool of 200-300+ optional missions while only requiring 100."
  },
  {
    title: "Cheat codes",
    body: "Not a missable trophy, but a missable platinum: activating cheat codes disables trophy earning and saving on that file. Keep cheats for a separate throwaway save."
  }
];

async function llLoadData() {
  const response = await fetch(LL_DATA_URL);
  if (!response.ok) {
    throw new Error("Could not load " + LL_DATA_URL + " (HTTP " + response.status + ")");
  }
  const data = await response.json();
  if (!data || !Array.isArray(data.trophies)) {
    throw new Error("Trophy data file has an unexpected shape.");
  }
  return data;
}

function llKindLabel(kind) {
  for (const [key, label] of LL_KINDS) {
    if (key === kind) return label;
  }
  return kind;
}

function llFormatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}
