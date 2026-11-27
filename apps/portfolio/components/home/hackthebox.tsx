"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { isStatic } from "@/lib/motion";
import type { HackTheBoxStats } from "@repo/data/hackthebox";
import SectionHeading from "@/components/section-heading";

/**
 * Hack The Box, live.
 *
 * Built around what the profile actually has — rank and the climb to the next
 * one, machines owned, challenges and Sherlocks solved, and where those solves
 * are. Every count is null unless it is real (the data layer turns zeros into
 * null), and each block renders only when its value exists.
 *
 * The rank gauge: sixty ticks around a ring, lit up to the current progress,
 * with the arc drawing itself in as the section arrives.
 */

const number = new Intl.NumberFormat("en-US");
const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatSince(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : monthYear.format(date);
}

const TICKS = 60;
const SIZE = 320;
const CENTER = SIZE / 2;
const ARC_R = 118;

export default function HackTheBox({
  stats,
  tagline,
}: {
  stats: HackTheBoxStats;
  tagline: string;
}) {
  const root = useRef<HTMLElement>(null);
  const since = formatSince(stats.memberSince);
  const progress = stats.rankProgress;
  const lit = progress !== null ? Math.round((progress / 100) * TICKS) : TICKS;

  const figures = [
    stats.systemOwns !== null && { label: "root / system owns", value: stats.systemOwns },
    stats.userOwns !== null && { label: "user / foothold owns", value: stats.userOwns },
    stats.challengesSolved !== null && {
      label: "challenges solved",
      value: stats.challengesSolved,
    },
    stats.sherlocksSolved !== null && {
      label: stats.sherlocksSolved === 1 ? "sherlock solved" : "sherlocks solved",
      value: stats.sherlocksSolved,
    },
  ].filter((item) => item !== false);

  useGSAP(
    () => {
      if (isStatic()) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "[data-gauge]", start: "top 75%", once: true },
      });
      tl.from("[data-tick]", {
        opacity: 0.15,
        scaleY: 0.3,
        transformOrigin: "50% 100%",
        stagger: { each: 0.018 },
        duration: 0.4,
      })
        .from(
          "[data-arc]",
          { attr: { "stroke-dasharray": "0 100" }, duration: 1.8, ease: "mb.inOut" },
          0,
        )
        .to(
          "[data-rank]",
          {
            duration: 1.2,
            scrambleText: { text: stats.rank ?? "", chars: "upperCase", speed: 0.5 },
          },
          0.2,
        )
        .from("[data-gauge-in]", { autoAlpha: 0, y: 12, stagger: 0.1, duration: 0.7 }, 0.6);

      gsap.from("[data-bar]", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.4,
        stagger: 0.1,
        ease: "mb.inOut",
        scrollTrigger: { trigger: "[data-areas]", start: "top 85%", once: true },
      });
    },
    { scope: root, dependencies: [stats.rank] },
  );

  return (
    <section ref={root} id="hackthebox" data-section="hackthebox" className="shell section-pad">
      <SectionHeading
        index="03"
        label="hack the box"
        title="Practice on live targets."
        intro={tagline}
      >
        <a
          href={stats.profileUrl}
          target="_blank"
          rel="noopener noreferrer external"
          className="btn btn-ghost shrink-0"
          data-cursor="open profile"
        >
          {stats.username ? `@${stats.username}` : "View profile"}
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(Hack The Box profile, opens in a new tab)</span>
        </a>
      </SectionHeading>

      <div className="grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        {stats.rank ? (
          <div className="flex flex-col items-center gap-8 lg:items-start">
            <div data-gauge className="relative w-full max-w-[22rem]">
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="w-full"
                role="img"
                aria-label={
                  progress !== null && stats.nextRank
                    ? `${progress}% of the way from ${stats.rank} to ${stats.nextRank}`
                    : `Rank: ${stats.rank}`
                }
              >
                {Array.from({ length: TICKS }, (_, i) => {
                  const angle = (i / TICKS) * 360;
                  return (
                    <rect
                      key={i}
                      data-tick
                      x={CENTER - 1.25}
                      y={8}
                      width={2.5}
                      height={i % 5 === 0 ? 18 : 11}
                      rx={1}
                      transform={`rotate(${angle} ${CENTER} ${CENTER})`}
                      className={i < lit ? "fill-primary" : "fill-foreground/15"}
                    />
                  );
                })}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={ARC_R}
                  className="fill-none stroke-line"
                  strokeWidth={2}
                />
                {progress !== null ? (
                  <circle
                    data-arc
                    cx={CENTER}
                    cy={CENTER}
                    r={ARC_R}
                    className="fill-none stroke-primary"
                    strokeWidth={4}
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray={`${progress} 100`}
                    transform={`rotate(-90 ${CENTER} ${CENTER})`}
                  />
                ) : null}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-14 text-center">
                <span data-gauge-in className="label">
                  current rank
                </span>
                <span
                  data-rank
                  className="font-head mt-2 text-[clamp(1.6rem,3vw,2.4rem)] leading-none"
                >
                  {stats.rank}
                </span>
                {progress !== null && stats.nextRank ? (
                  <span data-gauge-in className="mt-3 font-mono text-xs text-muted-foreground">
                    <span className="text-primary">{progress}%</span> to {stats.nextRank}
                  </span>
                ) : null}
              </div>
            </div>

            {stats.points !== null || since ? (
              <dl className="grid w-full max-w-[22rem] grid-cols-2 gap-6 border-t border-line pt-6">
                {stats.points !== null ? (
                  <div>
                    <dt className="label">points</dt>
                    <dd
                      data-count={stats.points}
                      className="mt-1 text-2xl font-semibold tabular-nums"
                    >
                      {number.format(stats.points)}
                    </dd>
                  </div>
                ) : null}
                {since ? (
                  <div>
                    <dt className="label">hacking since</dt>
                    <dd className="mt-1 text-2xl font-semibold">{since}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-16">
          {figures.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-12">
              {figures.map((figure) => (
                <div key={figure.label} data-reveal className="border-t border-line pt-5">
                  <dd
                    data-count={figure.value}
                    className="font-display text-[clamp(3.5rem,8vw,7rem)] leading-[0.85] tabular-nums"
                  >
                    {number.format(figure.value)}
                  </dd>
                  <dt className="mt-3 label">{figure.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}

          {stats.focusAreas.length > 0 ? (
            <div data-areas>
              <p className="mb-6 label">where the solves are</p>
              <ul className="space-y-5">
                {stats.focusAreas.map((area) => (
                  <li key={`${area.kind}-${area.name}`}>
                    <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
                      <span>
                        {area.name}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          {area.kind.toLowerCase()}
                        </span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {area.owned}/{area.total}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={area.total}
                      aria-valuenow={area.owned}
                      aria-label={`${area.name} ${area.kind.toLowerCase()}: ${area.owned} of ${area.total}`}
                    >
                      {/* A floor of 2% keeps a single solve in a large category visible. */}
                      <div
                        data-bar
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(area.percent, 2)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {stats.source === "live" ? (
        <p className="mt-16 label">live from hack the box, refreshed every six hours</p>
      ) : null}
    </section>
  );
}
