import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sha256Hex } from "@/lib/crypto";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const pw = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");
  const expected = process.env.APP_PASSWORD;
  if (expected && pw === expected) {
    cookies().set("lop_auth", sha256Hex(pw), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    redirect(next.startsWith("/") ? next : "/");
  }
  redirect(`/login?error=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const gateOff = !process.env.APP_PASSWORD;
  return (
    <div className="mx-auto max-w-md pt-16">
      <Card title="Anmelden">
        {gateOff ? (
          <p className="text-sm text-slate-400">
            Der Passwortschutz ist deaktiviert. Setze <code>APP_PASSWORD</code> in <code>.env</code>, um ihn zu aktivieren.
          </p>
        ) : (
          <form action={login} className="space-y-3">
            <input type="hidden" name="next" value={searchParams.next || "/"} />
            <div>
              <label className="label">Passwort</label>
              <input name="password" type="password" className="input" autoFocus required />
            </div>
            {searchParams.error && <p className="text-sm text-red-300">Falsches Passwort.</p>}
            <button className="btn w-full">Anmelden</button>
          </form>
        )}
      </Card>
    </div>
  );
}
