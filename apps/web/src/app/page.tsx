import { redirect } from "next/navigation";

// The landing page is built in P8. Until then the root goes to the living style guide,
// the only finished surface (no placeholder pages: brief rule 4).
export default function Home() {
  redirect("/design");
}
