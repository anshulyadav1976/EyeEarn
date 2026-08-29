import Link from "next/link";
import styles from "./buyer-tools-nav.module.css";

const tools = [
  ["coverage", "Coverage map", "/buyer"],
  ["ask", "Ask the street", "/intelligence"],
  ["atlas", "Authority atlas", "/operations"],
  ["replay", "Run replay", "/replay"],
] as const;

export default function BuyerToolsNav({ active }: { active: string }) {
  return (
    <nav className={styles.tabs} aria-label="Buyer tools">
      {tools.map(([id, label, href]) =>
        id === active ? (
          <b key={id}>{label}</b>
        ) : (
          <Link key={id} href={href}>
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
