import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luz de Canela | Prévia da versão estática AV2" },
      { name: "description", content: "Prévia da loja fictícia Luz de Canela, velas natalinas perfumadas." },
      { property: "og:title", content: "Luz de Canela | Velas perfumadas" },
      { property: "og:description", content: "Velas natalinas perfumadas e kits para montar em casa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Prévia: exibe a versão escolar em HTML puro servida de /av2-estatico/.
function Index() {
  return (
    <iframe
      src="/av2-estatico/inicio.html"
      title="Luz de Canela – versão estática"
      className="block h-screen w-full border-0"
    />
  );
}
