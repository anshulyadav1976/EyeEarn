import Link from "next/link";

type Surface = "explore" | "buyer" | "methodology";

const links = [
  ["explore", "/explore", "EXPLORE & EARN"],
  ["buyer", "/buyer", "BUY"],
  ["methodology", "/developers", "METHODOLOGY"],
] as const;

export default function PrimaryNav({ active }: { active: Surface }) {
  return (
    <nav aria-label="Primary navigation">
      {links.map(([id, href, label]) => (
        <Link href={href} aria-current={active === id ? "page" : undefined} key={id}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
