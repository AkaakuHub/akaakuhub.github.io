import { profile } from "../../../src/content/profile";
import { privacy } from "../../../src/content/privacy";

function escape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll(">", "&gt;");
}

function link(href: string, label: string): string {
  return `<a class="underline decoration-stone-300 underline-offset-4 transition hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4" href="${escape(href)}">${escape(label)}</a>`;
}

export function siteDocument(): string {
  const history = profile.history
    .map(
      (entry) =>
        `<li class="grid gap-2 border-t border-stone-300/60 py-5 sm:grid-cols-[7rem_1fr]"><time class="font-mono text-sm text-stone-500">${escape(entry.date)}</time><div><h3 class="font-medium">${entry.team ? link(profile.team.href, profile.team.label) : ""}${escape(entry.title)}</h3>${entry.detail ? `<p class="mt-1 text-sm text-stone-600">${escape(entry.detail)}</p>` : ""}</div></li>`,
    )
    .join("");
  return `<div class="mx-auto max-w-5xl px-6 py-10 sm:px-12 sm:py-16">
    <header class="flex items-center justify-between gap-6 border-b border-stone-300 pb-6"><a class="font-mono text-sm tracking-wider" href="/">akaaku.net</a><nav aria-label="外部リンク" class="flex gap-6 text-sm">${link(profile.github, "GitHub")}${link(profile.blog, "ブログ")}</nav></header>
    <main class="py-14 sm:py-24">
      <section aria-labelledby="profile-name" class="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <div><h1 id="profile-name" class="text-5xl font-semibold tracking-tight sm:text-7xl">${escape(profile.name)}</h1><p class="mt-5 font-mono text-stone-500">${escape(profile.handle)}</p><p class="mt-8 text-lg leading-relaxed">${escape(profile.hobbies)}</p><dl class="mt-6 grid grid-cols-[5rem_1fr] gap-y-3 text-sm"><dt class="text-stone-500">好きなもの</dt><dd>${escape(profile.favorite)}</dd><dt class="text-stone-500">活動</dt><dd>${link(profile.team.href, profile.team.label)}</dd></dl></div>
        <img class="size-28 rounded-3xl border border-stone-200 sm:size-40" src="${escape(profile.avatar)}" width="160" height="160" alt="あかあくのアイコン" decoding="async" />
      </section>
      <section aria-labelledby="room-title" class="my-14 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-stone-300 bg-white/60 p-6 sm:my-20 sm:p-8"><div><h2 id="room-title" class="text-lg font-medium">3Dの部室</h2><p class="mt-2 text-sm leading-relaxed text-stone-600">このサイトには、部屋を見回して掲示を読める3D版もあります。</p></div><a class="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4" href="/?view=3d">3D版を開く<span aria-hidden="true"> ↗</span></a></section>
      <section aria-labelledby="history-title"><h2 id="history-title" class="mb-6 text-2xl font-medium">活動記録</h2><ol>${history}</ol></section>
      <section aria-labelledby="qualifications-title" class="mt-14"><h2 id="qualifications-title" class="text-2xl font-medium">資格</h2><ul class="mt-5 flex flex-wrap gap-3">${profile.qualifications.map((qualification) => `<li class="rounded-full border border-stone-300 px-5 py-2 text-sm">${escape(qualification)}</li>`).join("")}</ul></section>
    </main>
    <footer class="border-t border-stone-300 pt-6 text-sm text-stone-600"><details><summary class="w-fit cursor-pointer">${escape(privacy.title)}</summary><div class="mt-6 max-w-2xl space-y-5 leading-relaxed">${privacy.sections.map((section) => `<section><h2 class="font-medium text-stone-900">${escape(section.title)}</h2><p class="mt-1">${escape(section.text)}</p></section>`).join("")}<p>${escape(privacy.operator)}</p><p>${link(privacy.google, "Googleのデータ利用")} · ${link(privacy.optout, "計測を停止する")}</p><p>${escape(privacy.updated)}</p></div></details></footer>
  </div>`;
}
