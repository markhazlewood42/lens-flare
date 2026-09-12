/**
 * One-off script: seeds the real Supabase database with the same fictional
 * content that lives in `src/data/mockData.ts`, so the public read-only demo
 * has something to show. This is NOT run automatically anywhere — run it
 * manually whenever you want to (re)populate the demo project.
 *
 * Why this exists instead of just flipping on the old client-side "demo
 * mode": we want the deployed app to actually query Supabase (real Postgres,
 * real RLS), not fake it in the browser. See supabase/migrations/11_*.sql
 * for the matching read-only RLS policies.
 *
 * `profiles.id` (and every author_id/user_id/actor_id FK) points at
 * `auth.users(id)`, so seeded "people" need real (if inert) auth users —
 * this script creates them via the Supabase Admin API. Nobody ever logs in
 * as them; there's no login UI in this build.
 *
 * Usage:
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key, NEVER the anon key> \
 *   npx tsx scripts/seed-demo-data.ts
 *
 * Add SEED_RESET=1 to wipe and reseed all content (teams/CRs/artifacts/
 * reviewers/comments) while reusing the same seeded people. Safe to re-run
 * without it too — people are matched by email and won't be duplicated, but
 * re-running without SEED_RESET will insert a second copy of the teams/CRs.
 *
 * Get the service_role key from: Supabase dashboard → Project Settings →
 * API → service_role (secret) key. Never commit it, never expose it to the
 * client — this script only ever runs on your machine.
 */
import { createClient } from '@supabase/supabase-js';
import { TEAM_MEMBERS, MOCK_TEAMS, MOCK_CRS } from '../src/data/mockData';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RESET = process.env.SEED_RESET === '1';

// Real, stable Unsplash photos to stand in for every artifact, chosen to
// match what that specific artifact is (a dashboard screen, a whiteboard
// wireframe session, a design-tool workspace) rather than generic stock
// photos. Live Figma/Loom URLs in mockData.ts are fake (figma.com/design/
// abc123 etc.) and would render as broken embeds in production — every
// seeded artifact becomes a static image instead, regardless of its
// original type. Keyed by mock artifact id (a1..a12) so each CR's artifacts
// look distinct instead of cycling through a handful of repeats.
const PLACEHOLDER_IMAGES: Record<string, string> = {
  a1: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800', // dashboard screen — Version Detail Page desktop
  a2: 'https://images.unsplash.com/photo-1686061592689-312bbfb5c055?w=800', // analytics screen — walkthrough recording
  a3: 'https://images.unsplash.com/photo-1532102235608-dc8fc689c9ab?w=800', // whiteboard sketch — user flow diagram
  a4: 'https://images.unsplash.com/photo-1546437593-3d0258c28037?w=800', // whiteboard sketch — onboarding stepper wireframe
  a5: 'https://images.unsplash.com/photo-1546017535-ed107a04ac7b?w=800', // sketching/notes — competitor analysis
  a6: 'https://images.unsplash.com/photo-1698434156088-a80e7bcdd198?w=800', // whiteboard planning — IA mapping
  a7: 'https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?w=800', // dashboard screen — dashboard exploration
  a8: 'https://images.unsplash.com/photo-1581291518570-03a26006fb21?w=800', // sketch — data architecture
  a9: 'https://images.unsplash.com/photo-1726186029199-218e58c9fb41?w=800', // design-tool workspace — live prototype
  a10: 'https://images.unsplash.com/photo-1625335524754-9e26bc4aecc6?w=800', // design-tool workspace — figma specs
  a11: 'https://images.unsplash.com/photo-1612556810513-617a5a892418?w=800', // design-tool workspace — prototype walkthrough
  a12: 'https://images.unsplash.com/photo-1625296276703-3fbc924f07b5?w=800', // dashboard/UI screen — error state library
};
const FALLBACK_IMAGE = PLACEHOLDER_IMAGES.a1;

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

async function getOrCreateUser(name: string, seed: string): Promise<string> {
  const email = `demo+${slugify(name)}@lensflare.design`;
  const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(), // random, never given out — nobody logs in as this account
    email_confirm: true,
    user_metadata: { name, avatar_url },
  });

  if (!error && created.user) return created.user.id;

  // Already exists (re-running the script) — look it up instead.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw listError;
  const existing = list.users.find(u => u.email === email);
  if (!existing) throw new Error(`Could not create or find user for ${email}: ${error?.message}`);
  return existing.id;
}

async function main() {
  console.log(RESET ? 'Reseeding (wiping existing teams/CRs first)...' : 'Seeding...');

  // 1. Seeded people — stable across runs, matched by email.
  const userIdMap = new Map<string, string>(); // mock id -> real auth.users id
  for (const member of TEAM_MEMBERS) {
    const realId = await getOrCreateUser(member.name, member.name.split(' ')[0]);
    userIdMap.set(member.id, realId);
    console.log(`  user ${member.name} -> ${realId}`);
  }

  if (RESET) {
    // critique_requests cascades to artifacts/reviewers/comments/cr_events;
    // teams cascades to team_members. Seeded people are left alone.
    await supabase.from('critique_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  // 2. Teams
  const teamIdMap = new Map<string, string>(); // mock id -> real team id
  for (const team of MOCK_TEAMS) {
    const { data, error } = await supabase.from('teams').insert({
      name: team.name,
      slack_channel: team.slack_channel,
      created_by: userIdMap.get(team.created_by),
    }).select().single();
    if (error || !data) throw error || new Error('Team insert returned no data');
    teamIdMap.set(team.id, data.id);
    console.log(`  team ${team.name} -> ${data.id}`);
  }

  // Team membership: everyone who authors or reviews a CR in a team, plus its creator.
  const teamMemberIds = new Map<string, Set<string>>(); // mock team id -> mock user ids
  for (const team of MOCK_TEAMS) teamMemberIds.set(team.id, new Set([team.created_by]));
  for (const cr of MOCK_CRS) {
    if (!cr.team_id) continue;
    const set = teamMemberIds.get(cr.team_id);
    if (!set) continue;
    set.add(cr.author.id);
    for (const r of cr.reviewers) set.add(r.user_id);
  }
  for (const [mockTeamId, memberIds] of teamMemberIds) {
    const realTeamId = teamIdMap.get(mockTeamId)!;
    const rows = [...memberIds].map(mockUserId => ({
      team_id: realTeamId,
      user_id: userIdMap.get(mockUserId),
      role: mockUserId === MOCK_TEAMS.find(t => t.id === mockTeamId)!.created_by ? 'admin' : 'member',
    }));
    const { error } = await supabase.from('team_members').insert(rows);
    if (error) throw error;
  }

  // 3. Critique requests + artifacts + reviewers + comments
  for (const cr of MOCK_CRS) {
    const { data: newCR, error: crError } = await supabase.from('critique_requests').insert({
      title: cr.title,
      description: cr.description,
      author_id: userIdMap.get(cr.author.id),
      status: cr.status,
      design_stage: cr.design_stage,
      project_tag: cr.project_tag,
      team_id: cr.team_id ? teamIdMap.get(cr.team_id) : null,
      created_at: cr.created_at,
      updated_at: cr.updated_at,
    }).select().single();
    if (crError || !newCR) throw crError || new Error('CR insert returned no data');
    console.log(`  CR "${cr.title}" -> ${newCR.id}`);

    if (cr.artifacts.length > 0) {
      const { error } = await supabase.from('artifacts').insert(cr.artifacts.map((a, i) => ({
        cr_id: newCR.id,
        type: 'image' as const,
        url: PLACEHOLDER_IMAGES[a.id] || FALLBACK_IMAGE,
        thumbnail_url: null,
        title: a.title,
        sort_order: i,
      })));
      if (error) throw error;
    }

    if (cr.reviewers.length > 0) {
      const { error } = await supabase.from('reviewers').insert(cr.reviewers.map(r => ({
        cr_id: newCR.id,
        user_id: userIdMap.get(r.user_id),
        status: r.status,
        reviewed_at: r.reviewed_at || null,
      })));
      if (error) throw error;
    }

    // Comments: insert top-level first (capturing new ids), then replies.
    const commentIdMap = new Map<string, string>();
    for (const c of cr.comments) {
      const { data: newComment, error } = await supabase.from('comments').insert({
        cr_id: newCR.id,
        author_id: userIdMap.get(c.author.id),
        body: c.body,
        comment_type: c.comment_type,
        resolved: c.resolved,
        resolved_by: c.resolved_by ? userIdMap.get(c.resolved_by.id) : null,
        created_at: c.created_at,
      }).select().single();
      if (error || !newComment) throw error || new Error('Comment insert returned no data');
      commentIdMap.set(c.id, newComment.id);

      for (const reply of c.replies || []) {
        const { error: replyError } = await supabase.from('comments').insert({
          cr_id: newCR.id,
          author_id: userIdMap.get(reply.author.id),
          parent_id: newComment.id,
          body: reply.body,
          comment_type: reply.comment_type,
          resolved: reply.resolved,
          created_at: reply.created_at,
        });
        if (replyError) throw replyError;
      }
    }
  }

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
