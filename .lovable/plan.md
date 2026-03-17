

## Plan

### Problem 1: Ads not showing in feed
The discovery feed path (lines 180-183) bypasses `interleaveAds` entirely — it sets signals directly from `fetchDiscovery()` without inserting ads. Same issue when real signals exist but are expired (lines 189-192). Ads only get inserted when there are active followed-user signals.

**Fix:** Run `interleaveAds` on discovery content too, so ads appear every 4th item regardless of feed type.

### Problem 2: Spark (felt) the top drop from EmberProfile
Currently the top sparked drop in `EmberProfile.tsx` is display-only. Need to add a tappable "felt" interaction on it.

**Changes:**

1. **`src/components/EmberProfile.tsx`**:
   - Store the `signal_id` of the top drop in the `topDrop` object
   - Add a tap handler on the top drop media that inserts a felt (same as feed felt logic)
   - Show a felt effect animation (spark visual) on tap
   - Track whether user has already sparked it to provide feedback

2. **`src/components/FeedView.tsx`**:
   - Wrap discovery signals through `interleaveAds` before setting state (lines 181 and 190)
   - This ensures ads appear every 4th item in all feed types

### Technical details

**EmberProfile topDrop changes:**
- Extend `topDrop` interface to include `signal_id: string`
- Set `signal_id: top.id` when building topDrop data
- Add `onTap` handler that calls `supabase.from("felts").insert(...)` and shows a `FeltEffect` animation
- Display a brief "✦ sparked" toast on success

**Feed ad fix:**
- Change line 181 from `setSignals(await fetchDiscovery())` to `setSignals(await interleaveAds(await fetchDiscovery(), user.id))`
- Same for line 190

