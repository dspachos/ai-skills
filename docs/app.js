/* ai-skills site: theme, icons, rendering. Vanilla JS, no framework. */
(function () {
  "use strict";

  var DATA = window.AI_SKILLS || { groups: [], changelog: [], skillCount: 0 };

  // ---------------------------------------------------------------- icons

  var STROKE = {
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'
  };
  var FILL = {
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    github: '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>'
  };

  function svg(paths, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || "size-4") + '" aria-hidden="true">' + paths + "</svg>";
  }
  function svgFill(paths, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="' + (cls || "size-4") + '" aria-hidden="true">' + paths + "</svg>";
  }

  function paintIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      var name = el.getAttribute("data-icon");
      el.innerHTML = FILL[name] ? svgFill(FILL[name]) : svg(STROKE[name] || "");
    });
    (root || document).querySelectorAll("[data-copy]").forEach(function (btn) {
      if (btn.innerHTML.trim()) return;
      btn.innerHTML = svg(STROKE.copy);
    });
  }

  // ---------------------------------------------------------------- theme

  function paintTheme() {
    var dark = document.documentElement.classList.contains("dark");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.innerHTML = dark ? svg(STROKE.sun) : svg(STROKE.moon);
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
    paintTheme();
  });

  // ---------------------------------------------------------------- copy

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    var text = btn.getAttribute("data-copy");
    function done() {
      btn.innerHTML = svg(STROKE.check);
      setTimeout(function () { btn.innerHTML = svg(STROKE.copy); }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (err) { /* no clipboard: the user copies by hand */ }
      document.body.removeChild(ta);
      done();
    }
  });

  // ---------------------------------------------------------------- stars

  function formatStars(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
  }

  fetch("https://api.github.com/repos/" + (DATA.repo || "dspachos/ai-skills"))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (repo) {
      if (!repo || typeof repo.stargazers_count !== "number") throw new Error("no data");
      document.querySelectorAll("[data-stars]").forEach(function (el) {
        el.textContent = formatStars(repo.stargazers_count);
      });
    })
    .catch(function () {
      document.querySelectorAll("[data-stars]").forEach(function (el) {
        el.textContent = "Star";
      });
    });

  // ---------------------------------------------------------------- index

  function skillRow(skill) {
    var chip = '<span class="hidden shrink-0 rounded-sm border border-line bg-muted px-2 py-1 font-mono text-xs font-medium text-fg-body sm:inline-block">/' + skill.slug + "</span>";
    var arrow = '<span class="size-4 shrink-0 text-fg-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground motion-reduce:transform-none motion-reduce:transition-none">' + svg(STROKE["arrow-right"]) + "</span>";
    var thumb = '<span class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-accent-wash text-foreground dark:bg-accent-panel dark:text-accent-fill">' + svg(STROKE[skill.icon] || STROKE.eye, "size-5") + "</span>";
    return '<a href="skill.html?slug=' + encodeURIComponent(skill.slug) + '" class="group flex items-center gap-4 rounded-sm border-b border-line py-3.5 transition-colors last:border-b-0 hover:bg-hover-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-line-strong md:-mx-4 md:px-4">'
      + thumb
      + '<span class="flex min-w-0 flex-1 flex-col gap-0.5"><span class="block text-balance text-base font-medium leading-snug">The /' + skill.slug + " Skill</span>"
      + '<span class="mt-0.5 block text-sm leading-relaxed text-fg-muted">' + skill.tagline + "</span></span>"
      + chip + arrow + "</a>";
  }

  function renderIndex() {
    var mount = document.getElementById("skills-groups");
    if (!mount) return;

    mount.innerHTML = DATA.groups.map(function (group) {
      var start = group.skills.find(function (s) { return s.slug === group.start; }) || group.skills[0];
      var startLink = start
        ? '<a href="skill.html?slug=' + encodeURIComponent(start.slug) + '" class="mt-2.5 inline-flex items-center gap-1.5 font-mono text-xs text-fg-subtle transition-colors hover:text-foreground">Start with <span class="font-medium">/' + start.slug + "</span> →</a>"
        : "";
      return '<div class="mt-10 first:mt-8">'
        + '<h3 class="text-base font-bold leading-[1.3] tracking-[-0.018em]">' + group.name + "</h3>"
        + '<p class="mt-1 max-w-[52ch] text-sm leading-relaxed text-fg-muted">' + group.description + "</p>"
        + startLink
        + '<div class="mt-3 border-t border-line-soft">' + group.skills.map(skillRow).join("") + "</div>"
        + "</div>";
    }).join("");

    var log = document.getElementById("changelog-list");
    if (log) {
      log.innerHTML = DATA.changelog.map(function (entry) {
        return '<div class="border-b border-line-soft py-6 last:border-b-0">'
          + '<div class="font-mono text-xs font-medium text-fg-faint">' + entry.version + " · " + entry.date + "</div>"
          + '<h3 class="mt-1 text-lg font-bold leading-[1.2] tracking-[-0.02em]">' + entry.title + "</h3>"
          + '<p class="mt-1 max-w-[60ch] text-sm leading-relaxed text-fg-muted">' + entry.description + "</p>"
          + "</div>";
      }).join("");
    }

    var count = document.querySelector("[data-skill-count]");
    if (count) count.textContent = DATA.skillCount;
  }

  // ---------------------------------------------------------------- detail

  function findSkill(slug) {
    var found = null;
    DATA.groups.forEach(function (g) {
      g.skills.forEach(function (s) { if (s.slug === slug) { found = s; found.groupName = g.name; } });
    });
    return found;
  }

  function renderDetail() {
    var mount = document.getElementById("skill-detail");
    if (!mount) return;

    var slug = new URLSearchParams(location.search).get("slug");
    var skill = slug && findSkill(slug);
    if (!skill) {
      mount.innerHTML = '<p class="text-sm text-fg-muted">Unknown skill. <a class="underline underline-offset-[3px]" href="index.html#skills">Back to all skills</a>.</p>';
      return;
    }

    document.title = "/" + skill.slug + " — ai-skills";

    var requires = (skill.requires || []).map(function (r) {
      return '<span class="rounded-sm border border-line bg-card px-2 py-1 font-mono text-xs text-fg-muted">' + r + "</span>";
    }).join("");

    var command = "npx skills add " + DATA.repo + " --skill " + skill.slug;
    var install = '<div class="mt-8 rounded-xl border border-accent-line bg-accent-wash p-6 sm:p-8">'
      + '<div class="font-mono text-xs font-medium text-fg-label">install this skill</div>'
      + '<div class="mt-4 flex items-center gap-2 rounded-md border border-line bg-card px-3.5 py-2.5">'
      + '<code class="min-w-0 flex-1 select-all overflow-x-auto overscroll-x-contain whitespace-nowrap font-mono text-xs font-medium text-foreground sm:text-sm">' + command + "</code>"
      + '<button type="button" aria-label="Copy install command" class="flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-sm bg-accent-fill/15 text-foreground transition-colors hover:bg-accent-fill/25 dark:text-accent-fill" data-copy="' + command.replace(/"/g, "&quot;") + '"></button>'
      + "</div>"
      + '<p class="mt-3 font-mono text-xs text-fg-faint">or <span class="text-fg-muted">npx skills add ' + DATA.repo + "</span> for all skills, or copy <span class=\"text-fg-muted\">skills/" + skill.slug + '/</span> into your agent\u2019s skills folder by hand.</p>'
      + "</div>";

    mount.innerHTML =
      '<a href="index.html#skills" class="inline-flex items-center gap-1.5 font-mono text-xs text-fg-subtle transition-colors hover:text-foreground">← All skills</a>'
      + '<div class="mt-6 flex flex-wrap items-center gap-2">'
      + '<span class="rounded-sm border border-line bg-muted px-2 py-1 font-mono text-xs font-medium text-fg-muted">' + skill.groupName + "</span>"
      + '<span class="font-mono text-xs text-fg-faint">MIT</span>' + requires
      + "</div>"
      + '<h1 class="mt-4 text-balance text-3xl font-bold leading-[1.15] tracking-[-0.02em] sm:text-4xl">The /' + skill.slug + " Skill</h1>"
      + '<p class="mt-4 max-w-[60ch] text-pretty text-base leading-relaxed text-fg-muted">' + skill.description + "</p>"
      + install
      + '<h2 class="mt-14 border-t border-line-soft pt-10 text-lg font-bold leading-[1.2] tracking-[-0.02em] sm:text-xl">The SKILL.md</h2>'
      + '<p class="mt-1.5 text-sm leading-relaxed text-fg-muted">This is the file your agent reads. Install it, edit it, make it yours.</p>'
      + '<article class="md-body mt-8">' + window.marked.parse(skill.doc) + "</article>";

    paintIcons(mount);
  }

  // ---------------------------------------------------------------- boot

  paintIcons(document);
  paintTheme();
  renderIndex();
  renderDetail();
})();
