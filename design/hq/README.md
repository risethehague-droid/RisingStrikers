# HC2 HQ: side menu, Loose Ends, Versions (card q-hq-sections)

The next HC2 HQ page, ready to publish. Built by worker-f from HQ's live source (read 25 Oct, version
`1792844981-0cde`). Luca OK'd the card. **Only the taskmaster publishes it to HQ.**

- `index.html`: the page. HQ's code with the additions below; everything else unchanged.
- `hqdata.py`: builds the `versions` and `loose` documents from the repo and the agents folder.

## What changed

1. **Side menu.** Every section in a left menu, each with a small count: Agents (busy agents), Your move (cards to
   OK), Board (open cards), Loose ends (open), Versions (live version, or "N new" for you), Project (% of the
   roadmap), How HQ works. The Project tabs sit under Project. The section on screen is lit up.
   - Narrow windows and phones get a **☰ Sections** bar at the top that opens the same menu. Nothing scrolls sideways.
   - Every section has its own link: HQ's link plus `#agents`, `#your-move`, `#board`, `#loose-ends`, `#versions`,
     `#project`, `#how`. A Project tab: `#roadmap`, `#creative`, `#assets`, `#decisions`, `#references` (as today).
2. **Loose Ends** (`#loose-ends`): one card per loose end. Shows what, why, what closes it, who it waits on, and
   open / sent / closed. Filters: Not closed / Open / Sent / Closed / All, and by who it waits on.
   - **Make a card**: a card in To do (lane Lead; a decision when it waits on Luca), and the loose end turns Sent.
   - **Close…**: an optional line on how it was settled, then closed. **Reopen** undoes it.
3. **Versions** (`#versions`): every version from `docs/CHANGELOG.txt`, newest first. Each shows the version, date,
   headline, PRs, tasks, whose OK, the changelog's own bullets, and the preview GIFs from `docs/previews/`.
   - The newest two open; the rest fold. 8 show, then "Show all".
   - **Search** ("keeper", "#24", "t-019"): matching versions open with only the matching changes, words marked.
   - **New since I last looked**: per viewer, in this browser (localStorage, every read and write in try/catch).
     When you scroll to Versions, HQ remembers the newest version you've seen. On a first visit nothing is marked.
   - **Play this version** is a stub: the button shows when a version's `play` holds a page link.
4. Small: the inner `#agents` / `#board` containers are now `#agentGrid` / `#boardGrid` (the section ids took the
   names). A `meta/hq.sample` line shows a yellow banner (only the preview copy sets it). "How HQ works" has two
   new lines.

**Unchanged:** the Agents strip (7-step meters, progress bars), Your move (OK / Not yet / No, `next`, `preview` with
GIF / Play it / Test Lab / vs today), the Board (lane filters, drawer), + Add a card, the `meta/hq` status lines
and next-checks line, ↻ Check now (owner only, `fire_trigger` on `trig_01XnmuxJ2BFdFv4jwZvQ7q1E`, writes
`meta/hq.manualCheck`), the Project tabs (Roadmap / Creative / Assets / Decisions / References), the 16-bit look,
light and dark. The collections, `norm()` and the field names are the same.

**Where the layout comes from:** the left rail with a count beside each view is how Linear and Jira lay out a
project; Versions reads like GitHub's Releases list (newest first, notes, search); Loose Ends is a punch list, like
a site handover's snag list: each item has an owner and open / sent / closed.

## The data it needs (new)

Two new collections in HQ's database. Nothing else changes.

### `versions`: one doc per game version

Doc id: the version with dots as dashes (`v0-12-4`). Shape:

```
{ ver: "v0.12.4", n: 56,            // n = its place in the changelog, oldest = 1 (sorts newest first)
  date: "25 Oct", headline: "SPECIAL-SAVE CLASH + SET-PIECE RHYTHM + KEEPER HANDS", note: "",
  prs: [36, 37, 38], tasks: ["t-028", "t-029", "t-031"], ok: "Luca's OK",
  bullets: [{ text, prs: [36], tasks: ["t-028"], gifs: [{ path: "docs/previews/pr36-save-clash.gif", url: "/_blob/…" }] }],
  gifs: [ … ],                       // the version's PR GIFs that no bullet names
  play: null }                       // later: an "HC2 Football · v0.x.y" page link
```

**When:** at every merge, after the CHANGELOG entry is written (taskmaster.md "Merging", step 4).
**How** (the taskmaster, Luca's account):

1. **First time only: all GIFs.** `python3 design/hq/hqdata.py gifs` lists them (31 today, ~23 MB). Upload them
   to HQ's asset store: Artifact publish, `url` = HQ, `asset: true`, `file_paths` (25 per call). Keep a map file
   `{"docs/previews/<file>.gif": "<url from the result>"}`. **After that:** upload only the new PR's GIF and
   add it to the map. The Needs OK card's `preview.gif` is already the same upload: reuse it.
2. `python3 design/hq/hqdata.py versions $TMP/hq --gifs <map.json>` writes one JSON per version, plus
   `$TMP/hq/versions-writes.json`.
3. ArtifactData `batch` on HQ with those writes (50 per batch; first time: 56 docs = 2 batches). After the first
   time, only the new version's doc. Its doc is new, so it needs no `if_version`.

### `loose`: one doc per loose end

Doc id: the title as a slug (60 chars), so the same loose end sent twice is one doc. Shape:

```
{ title, why, closes,
  who: "luca" | "taskmaster" | "co-designer" | "worker-l" | "worker-f",
  status: "open" | "sent" | "closed",   // open = nothing made yet; sent = a card made or passed on; closed = settled
  source: "co-designer" | "check", check: 0-7,   // check = which of the 7 scan checks found it (source "check")
  from: "agents/reports/<file>.md" or "2-hourly check", foundAt: <ms>,
  card: "<tasks doc id>" or "",
  closedBy: <user id> or null, closedAt: <ms> or 0, closeNote: "",
  log: [{ at, by, text }] }
```

HQ writes `status`, `card`, `closedBy`, `closedAt`, `closeNote`, `log` (Make a card / Close / Reopen). The checks
write the rest. Never overwrite an existing doc's `status`: a loose end that is already there stays as it is.

**When and how:**

1. **The co-designer's notes** (the 2-hourly check, job C): a `note` report titled "Loose ends from the
   co-designer" → `python3 design/hq/hqdata.py loose $TMP/hq <report files>` → ArtifactData `batch` of `set`
   for the ids **not already in** `loose` (list it first). `(who: you)` in his notes means the co-designer.
2. **Luca's side** (the 2-hourly check, optional): run the co-designer's 7 checks and write new ones with
   `source: "check"`, `check: N`, `from: "2-hourly check"`. The checks (his note
   `agents/reports/note--co-designer--20261025-154651.md`):
   1. built but switched off (flags off in matches, Test Lab only)
   2. decisions nobody made (for-luca reviews, question reports, unanswered notes)
   3. stuck PRs (> 2 days, no Preview line, conflicts)
   4. branches with commits and no PR
   5. idle or blocked agents
   6. the gameplay list vs the changelog
   7. anything contradictory
3. **Closing:** when the check sees a loose end settled (its card done, the PR merged, the switch decided), it
   writes `status: "closed"`, `closedBy: null`, `closedAt`, `closeNote: "<what settled it>"` (pinned `update`).
4. **Back to the co-designer:** his morning scan can't read HQ (other account). The check puts closed ones in its
   reviews of his notes (`answered`, a list of what closed), so his scan sees them closed.

## Publishing (the taskmaster only)

1. Read HQ first (Artifact `read`, url `https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4`). If HQ changed since
   version `1792844981-0cde`, carry those changes into `design/hq/index.html` first.
2. Artifact publish: `file_path` = `design/hq/index.html`, `url` = HQ, **no** `icon`, **no** `capabilities` (the
   stored set carries over: `{"assets":{},"db":{},"mcp":{"servers":[{"server":"Claude Code Remote","tools":
   ["fire_trigger"]}]},"user":{"scopes":["profile"]}}`; pass it in full only if it ever needs restating).
3. Seed `versions` and `loose` as above. Until then both sections show a short "nothing here yet" line.

## The preview copy

"HC2 HQ · preview · sections", private on the co-designer's account:
https://claude.ai/artifact/BfghxBnybXr9L28vdzM7cJ. Same page (only the `<title>` differs), capabilities
`assets`, `db`, `user` (no `mcp`, so no ↻ Check now). Its cards, agents and roadmap rows are examples marked
"Example"; Versions (all 56 versions, 31 GIFs) and the 8 Loose Ends are real, built with `hqdata.py`; two loose
ends marked "EXAMPLE" show the sent and closed states.
