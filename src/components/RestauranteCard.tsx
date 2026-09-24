import type { Restaurante } from "../restaurantes";

interface RestauranteCardProps {
  restaurante: Restaurante;
}

export function RestauranteCard({
  restaurante,
}: RestauranteCardProps) {
  const entregaPropria =
    restaurante.modalidadeEntrega === "entrega_propria";

  const telefone = restaurante.whatsapp.replace(/\D/g, "");

  const mensagem = encodeURIComponent(
    `Olá! Estou hospedado nos Império Chalés e encontrei vocês no Sabores da Chapada. Gostaria de consultar o cardápio. Código de indicação: IMPERIO.`
  );

  const linkWhatsApp = `https://wa.me/${telefone}?text=${mensagem}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">

      {restaurante.imagemCapa && (
        <img
          src={restaurante.imagemCapa}
          alt={restaurante.nome}
          className="h-48 w-full object-cover"
        />
      )}

      <div className="p-6">

        <div className="mb-3 flex flex-wrap items-center gap-2">

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
            {restaurante.categoria}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              entregaPropria
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {entregaPropria
              ? "🚚 Entrega própria"
              : "🛍️ Retirada sob consulta"}
          </span>

        </div>

        <h3 className="text-2xl font-bold text-[#19352b]">
          {restaurante.nome}
        </h3>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          {restaurante.descricao}
        </p>

        <div className="mt-5 space-y-2 text-sm text-gray-700">

          <p>
            📍 {restaurante.endereco}
          </p>

          <p>
            🕒 {restaurante.horarioFuncionamento}
          </p>

          <p>
            📞 {restaurante.telefone}
          </p>

        </div>

        {!entregaPropria && (
          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">

            <strong>
              Atenção: consulte o anfitrião antes de pedir.
            </strong>

            <p className="mt-2">
              A retirada depende de confirmação prévia.
              Horários para consulta: 11h às 13h e
              20h às 22h.
            </p>

          </div>
        )}

        {entregaPropria ? (
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
          >
            Pedir pelo WhatsApp
          </a>
        ) : (
          <div className="mt-6 rounded-xl bg-amber-100 p-3 text-center text-sm font-semibold text-amber-900">
            Consulte o anfitrião antes de realizar o pedido.
          </div>
        )}

      </div>

    </article>
  );
}

export default RestauranteCard;