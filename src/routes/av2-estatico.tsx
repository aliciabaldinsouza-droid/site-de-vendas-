import { createFileRoute, redirect } from "@tanstack/react-router";

// O servidor da prévia redireciona /av2-estatico/index.html para /av2-estatico;
// aqui levamos de volta para a cópia inicio.html da página inicial.
export const Route = createFileRoute("/av2-estatico")({
  beforeLoad: () => {
    throw redirect({ href: "/av2-estatico/inicio.html" });
  },
});
