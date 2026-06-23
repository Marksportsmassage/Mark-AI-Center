import { adminDb } from "../src/lib/firebase/admin";

function argValue(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

const uid = process.env.MARK_OWNER_UID ?? argValue("uid");
const email = process.env.MARK_OWNER_EMAIL ?? argValue("email");

if (!uid || !email) {
  console.error("Missing owner bootstrap input.");
  console.error("Use MARK_OWNER_UID and MARK_OWNER_EMAIL, or --uid=<firebase_uid> --email=<email>.");
  process.exit(1);
}

const now = new Date().toISOString();

adminDb
  .collection("users")
  .doc(uid)
  .set(
    {
      id: uid,
      uid,
      email,
      display_name: "Mark",
      role: "owner",
      status: "active",
      timezone: "Asia/Taipei",
      created_at: now,
      updated_at: now
    },
    { merge: true }
  )
  .then(() => {
    console.log(`Bootstrapped owner users/${uid}. No secret was written to source code.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
