

# Campfires → Camps → Bonfires

## Concept
Camps form **organically from shared interests**. When 5+ embers share the same vibe, they're automatically grouped into a camp. At 25 campers, the camp evolves into a **bonfire** and the top contributor (most stitches + flares) becomes the **Park Ranger** who names the campground (3 words max). Non-campers see camp activity in their feed as FOMO teasers.

---

## Database Schema (3 new tables + 1 RPC)

### `camps` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| vibe | text | The shared interest that spawned this camp |
| name | text (nullable) | Park Ranger names it (max 3 words), null until bonfire |
| status | text | `campfire` (5-24) or `bonfire` (25+) |
| ranger_id | uuid (nullable) | User who earned Park Ranger |
| member_count | int | Denormalized count for fast queries |
| created_at | timestamptz | Auto |

### `camp_members` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| camp_id | uuid | FK → camps |
| user_id | uuid | The camper |
| joined_at | timestamptz | Auto |
| contribution_score | int | Stitches + flares posted, updated via trigger |

Unique constraint on `(camp_id, user_id)`.

### `camp_flares` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| camp_id | uuid | FK → camps |
| signal_id | uuid | FK → signals |
| user_id | uuid | Who posted it |
| created_at | timestamptz | Auto |

### RPC: `sync_camps_for_user(p_user_id uuid)`
- Queries the user's interests from `profiles`
- For each interest with 5+ users sharing it, upserts a row in `camps` and adds the user to `camp_members`
- If any camp hits 25 members, promotes status to `bonfire` and sets `ranger_id` to the member with the highest `contribution_score`
- Called on login and when interests change

### RLS Policies
- **camps**: Authenticated can SELECT all (public visibility drives FOMO). Only service role can INSERT/UPDATE.
- **camp_members**: Authenticated can SELECT all (see who's in camps). INSERT/DELETE own membership.
- **camp_flares**: Members can INSERT into their camps. Authenticated can SELECT from camps they belong to. Non-members see count only (via camps.member_count).

---

## UI Components

### 1. Camps Tab — New nav item or section in Discover
- **My Camps**: List of camps the user belongs to, showing name/vibe, member count, status badge (campfire/bonfire), and Park Ranger avatar
- **Warming Up**: Camps the user *could* join (shares the vibe but hasn't been auto-synced yet) — FOMO cards showing "23 campers around *hiking*" with a pulsing fire icon
- **Bonfire highlight**: Camps at 25+ get a golden border and the campground name displayed prominently

### 2. Camp Detail Page (`/camp/:campId`)
- Header: Camp name (or vibe if unnamed), status, member count, Park Ranger badge
- Flare feed: Shows flares posted into this camp (filtered `camp_flares` → `signals`)
- Member list: Avatars of campers, Park Ranger marked with a ranger badge
- Post to camp: Camera button that tags the flare to this camp
- **Park Ranger controls** (if user is ranger and camp is bonfire): "Name this campground" input (3 words max)

### 3. FOMO in Main Feed
- Inject a "camp activity" card every ~8 flares showing: "*hiking* campfire is warming up — 18 campers and growing*" with a CTA to view
- Non-members see blurred camp flare thumbnails with "join to see"

### 4. Auto-sync on Interest Change
- When a user updates interests in Profile/InterestPicker, call `sync_camps_for_user` to add/remove them from camps automatically

---

## Files to Create/Modify

**New files:**
- `src/pages/Camps.tsx` — Camps list page (My Camps + Warming Up)
- `src/pages/CampDetail.tsx` — Individual camp view with flare feed
- `src/components/camp/CampCard.tsx` — Card component for camp lists
- `src/components/camp/CampFomoCard.tsx` — FOMO injection card for main feed
- `src/hooks/useCamps.ts` — Hook for camp data, sync, and ranger actions

**Modified files:**
- `src/components/AnimatedRoutes.tsx` — Add `/camps` and `/camp/:campId` routes
- `src/components/NavBar.tsx` — Add "camps" tab or integrate into discover
- `src/hooks/useFeedData.ts` — Inject FOMO cards from active camps
- `src/components/InterestPicker.tsx` — Trigger camp sync on interest save

**Database migration:** 3 tables + 1 RPC function + RLS policies + realtime on `camp_members`

---

## Technical Notes
- Camp formation is **deterministic** — based on the `interests` array in `profiles`. No AI image similarity needed for v1.
- The `sync_camps_for_user` RPC handles all the logic server-side: counting shared-interest users, creating camps, promoting to bonfire, and selecting the Park Ranger.
- Contribution score increments via a trigger on `camp_flares` INSERT and `stitches` INSERT (when the stitch targets a camp flare).
- Park Ranger promotion is **automatic** — the ember with the highest contribution score when a camp hits 25 gets the title. If a new camper later surpasses them, the ranger doesn't change (first ranger sticks unless they leave).

