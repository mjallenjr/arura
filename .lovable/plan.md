

# Fix Critical Failure Points

## Overview
Four targeted fixes addressing the top risks: cold-start empty feed, onboarding friction, premature ad-gating, and shallow retention.

---

## 1. Make Onboarding Invite Step Skippable
**Problem**: Mandatory 3-invite gate causes high bounce. Users can't proceed without sharing.
**Fix**: 
- In `Onboarding.tsx`: Allow the "Next"/"Let's go" button to work on the invite step even without completing the interaction. Change `needsInteraction` logic so the invite step is never blocking.
- In `InviteStep.tsx`: Add a "Skip for now" link below the share buttons. Call `onComplete` immediately when tapped.
- Keep the invite UI encouraging but not mandatory.

**Files**: `src/components/Onboarding.tsx`, `src/components/onboarding/InviteStep.tsx`

---

## 2. Guarantee Content for New Users (Cold-Start Fix)
**Problem**: New users with no follows and no seed content in DB see only static fallback images with no social context.
**Fix**:
- In `useFeedData.ts`: When the user has 0 follows, fetch **both** seed content and engagement-ranked signals (from `get_engagement_ranked_signals` RPC) in parallel, combining them so there's always a "For You" feel.
- Add a "Discover more embers" CTA card at the end of discovery content linking to `/people`.
- In `src/lib/feed-types.ts`: Add a `isForYou` flag to Signal type for UI badging.

**Files**: `src/hooks/useFeedData.ts`, `src/lib/feed-types.ts`

---

## 3. Remove Ad Interstitial When No Real Ads Exist
**Problem**: The FanSheet ad-gates non-sparked fans, but without real ad inventory this is pure friction.
**Fix**:
- In `FanSheet.tsx` line ~134-143: Already handles `!ad` by letting the fan through (line 138). This is correct. However, the 4-second forced wait is unnecessary friction when ads are placeholder/test data.
- Add a check: if no ads exist in the system at all (or ad has no `cta_url`), skip the interstitial entirely and fan directly. This makes fanning free until real advertisers onboard.
- Keep the ad infrastructure intact for when real inventory arrives.

**Files**: `src/components/feed/FanSheet.tsx`

---

## 4. Add Quick Reply to Flares (Retention Depth)
**Problem**: No way to respond to a flare creates dead-end interactions. Users feel → nothing happens.
**Fix**:
- Add a "Reply" action to `PostActions.tsx` that opens a compact word input (10-word max, matching the existing DM constraint).
- On submit, send a direct message to the flare's author and show a toast confirmation.
- This creates conversation loops from passive viewing → active engagement → DM thread → daily opens.

**Files**: `src/components/PostActions.tsx`, new component `src/components/feed/QuickReply.tsx`

---

## Technical Notes
- No database migrations needed — all fixes use existing tables (`direct_messages`, `seed_content`, `ads`, `fans`).
- The invite step change is purely UI logic (removing the `needsInteraction` block for the invite step).
- The cold-start fix reuses the existing `get_engagement_ranked_signals` RPC that already returns top content outside the user's graph.
- Quick reply piggybacks on the existing `direct_messages` table and 10-word limit.

