# StatLocker — Product Overview

## Policy (North Star)

- Roles: **Athlete** and **Coach** only. **No Parent accounts.**
- Parents: May view using the athlete’s login at the family’s discretion.
- Specs live here: `/specs/<feature>/{requirements.md, design.md, tasks.md}`
- Source of truth doc: `/docs/overview.md`

**Tagline:** Stat tracking made easy. Progress made visible.

## What it is
StatLocker turns raw game stats into a beautiful, actionable performance dashboard for high school and club athletes—starting with lacrosse.

## Who it’s for
- **Primary:** Athletes (13–18) in high school & club teams  
- **Secondary:** Coaches (mobile first, web/team dashboards later)  
- **No Parent Accounts:** Parents do not register. If needed, they may view using the athlete’s own account at the family’s discretion.

## Core Value
- **Effortless logging** with position-specific stats + auto-calculated percentages  
- **AI insights** (tone: Hype, Mentor, Analyst, Captain) that explain trends and next steps  
- **Goals that stick** via GoalPace status (on-track / at-risk / stretch) and badges  
- **Clear trends** (StatGraph AI) and shareable season snapshots

## MVP Scope
1) **Onboarding** (role lock: Athlete or Coach; sport/gender; position; HS/Club; choose 3 goals; tone; review → auth)  
2) **Dashboard** (Hero, Stat Cards, AI Insight preview, Goals progress, Recent Games, FAB “Log Game”)  
3) **Log Game** (position fields with +/-; % derived on submit)  
4) **Stats** (trends, filters, comparisons; AI after 3 games)  
5) **Goals** (GoalPace + badges)

## Tech (baseline)
React Native + Expo (TypeScript, Expo Router) • NativeWind • Zustand • RHF + Zod • Firebase (Auth/Firestore/Storage) • RevenueCat • expo-notifications • Reanimated

## Pricing
- **7-day free trial**  
- **Pro** $9.99/mo — full tracking + AI insights  
- **Elite** $19.99/mo — adds advanced analytics & unlimited AI summaries  
- **Coach/Team/Org** — later phases

## Source of Truth
- Full plan & rationale: **`/docs/overview.md`**
