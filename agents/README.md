# The agents' report folder

This branch (`agents`) is the shared folder where the HC2 agents get their work and report back. It holds only this
`agents/` folder: no game files. It is never merged into `main`. The full story is `docs/agents.md` on `main`.

| Folder | Who writes it | What |
| --- | --- | --- |
| `tasks/<agent>/t-NNN.md` | the taskmaster | one brief per task: goal, files you may touch, what done means |
| `reports/t-NNN--<agent>--<time>.md` | the agent doing the task | what was done, branch / PR, tests, questions |
| `reviews/<same name as the report>` | the taskmaster | the verdict on that report: ok / needs-work / answered / for-luca / dropped |

- Never edit these files by hand or with git: use `bash tools/agent.sh` (`status`, `tasks`, `show`, `report`), which
  adds exactly one new file per send so two agents never clash.
- Never edit or delete a file someone else wrote, and never edit a report you've already sent: send a new one.
- No keys, tokens or passwords in any file here.
