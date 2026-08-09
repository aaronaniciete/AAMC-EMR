# Deploying Meridian Clinic EMR

This turns the Claude-artifact prototype into a real website with real logins and a
real database. You don't need to install anything on your computer for this — it's
all done through Supabase's and GitHub's and Vercel's websites.

Budget: all three services below have a free tier that's plenty for one small clinic.

---

## Part 1 — Create the database (Supabase)

1. Go to **supabase.com** → sign up (free).
2. **New project** → give it a name → set a database password (save this
   somewhere safe, like a password manager) → pick a region close to you
   (e.g. Singapore) → Create. Wait ~2 minutes while it sets up.
3. In the left sidebar, open **SQL Editor** → **New query**.
4. Open `supabase/schema.sql` from this project, copy all of it, paste it into
   the query box, and click **Run**. This creates the tables and locks them down
   so only signed-in staff can read or write.
5. Go to **Project Settings** (gear icon) → **API**. You'll see a **Project URL**
   and an **anon public** key — copy both somewhere handy. You'll need them in Part 3.

## Part 2 — Create your own login

1. Still in Supabase: **Authentication** → **Users** → **Add user**.
2. Enter your email and a password → Create user.
3. You'll repeat this step for each staff member once the app is live —
   that's how new people get access, instead of the old "type your name" screen.

## Part 3 — Put the project on GitHub

1. Go to **github.com** → sign up (free) if you don't have an account.
2. Click the **+** in the top right → **New repository** → name it something
   like `clinic-emr` → **Create repository**.
3. On the new (empty) repo page, click **uploading an existing file**.
4. Drag in every file and folder from this project *except* anything called
   `node_modules` or `dist` (there won't be any yet — just upload everything
   you were given). Do **not** upload a `.env` file even if you make one later —
   it holds secrets and should never go to GitHub.
5. Scroll down, click **Commit changes**.

## Part 4 — Deploy it (Vercel)

1. Go to **vercel.com** → sign up (you can sign up "with GitHub" to link them
   automatically — recommended).
2. **Add New** → **Project** → import the `clinic-emr` repo you just created.
3. Vercel will detect it's a Vite project automatically — leave the build
   settings as-is.
4. Before clicking Deploy, open **Environment Variables** and add two:
   - `VITE_SUPABASE_URL` → paste the Project URL from Part 1, step 5
   - `VITE_SUPABASE_ANON_KEY` → paste the anon public key from Part 1, step 5
5. Click **Deploy**. After about a minute you'll get a live link like
   `clinic-emr.vercel.app` — that's your app's real address.

## Part 5 — First login and testing

1. Open your new live link.
2. Sign in with the email/password you created in Part 2.
3. It'll ask for your name and role once — that's saved for next time.
4. **Test everything with made-up patients first.** Add a fake patient, book a
   fake appointment, print a fake prescription, before anyone touches a real one.
5. When you're confident, repeat Part 2 for each real staff member and share
   the live link with them.

## Adding staff later

Same as Part 2: Supabase → Authentication → Users → Add user. Give them the
live link; they fill in their name/role the first time they sign in.

## Optional: a real domain

Vercel → your project → Settings → Domains → add a domain you own (e.g.
`emr.albaanicieteclinic.com`) if you'd like something other than the
`.vercel.app` address.

---

## Before this touches real patient records

This gets you real login and real storage, which is a big step up from the
Claude-artifact version — but "technically working" isn't the same as
"safe for live patient data." Worth doing before full rollout:

- Have someone review it against the **Philippines Data Privacy Act**
  (a clinic handling sensitive personal health data may need to register
  with the National Privacy Commission — a lawyer or compliance consultant
  can confirm what applies to you).
- Set up **database backups** (Supabase does daily backups automatically
  on paid plans; confirm what the free plan covers before relying on it).
- Decide who gets which **role/access** — right now every signed-in staff
  member can see every patient, which is normal for a small clinic front
  desk but worth confirming is what you want.
- Keep testing with fake data until the whole team is comfortable.

I can help with any of these next — just ask, and paste back any error
messages you hit along the way and I'll help fix them.
