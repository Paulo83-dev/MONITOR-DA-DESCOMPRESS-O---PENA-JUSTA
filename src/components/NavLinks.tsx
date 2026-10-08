"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVEGACAO } from "@/data/site";

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <ul>
      {NAVEGACAO.map((n) => {
        const ativo = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
        return (
          <li key={n.href}>
            <Link href={n.href} aria-current={ativo ? "page" : undefined}>
              {n.rotulo}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
