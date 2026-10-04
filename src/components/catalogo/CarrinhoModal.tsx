import type {
  Atendimento,
  ItemCarrinho,
  Pagamento,
  RespostaConsulta,
} from "./catalogoTypes";

type CarrinhoModalProps = {
  aberto: boolean;

  itens: ItemCarrinho[];

  atendimento: Atendimento;

  pagamento: Pagamento;

  trocoPara?: string;

  carregando?: boolean;

  resposta?: RespostaConsulta | null;

  onFechar: () => void;

  onAlterarQuantidade: (
    pratoId: string,
    quantidade: number
  ) => void;

  onAlterarObservacao: (
    pratoId: string,
    observacao: string
  ) => void;

  onRemover: (
    pratoId: string
  ) => void;

  onLimpar: () => void;

  onAtendimentoChange: (
    atendimento: Atendimento
  ) => void;

  onPagamentoChange: (
    pagamento: Pagamento
  ) => void;

  onTrocoChange?: (
    valor: string
  ) => void;

  onEnviarConsulta: () => void;
};

export function CarrinhoModal({
  aberto,
  itens,
  atendimento,
  pagamento,
  trocoPara = "",
  carregando = false,
  resposta = null,
  onFechar,
  onAlterarQuantidade,
  onAlterarObservacao,
  onRemover,
  onLimpar,
  onAtendimentoChange,
  onPagamentoChange,
  onTrocoChange,
  onEnviarConsulta,
}: CarrinhoModalProps) {
  if (!aberto) {
    return null;
  }

  const subtotal = itens.reduce(
    (total, item) =>
      total +
      item.preco * item.quantidade,
    0
  );

  const quantidadeTotal =
    itens.reduce(
      (total, item) =>
        total + item.quantidade,
      0
    );

  return (
    <div
      className="
        fixed
        inset-0

        z-[300]

        flex

        items-end
        justify-center

        bg-black/85

        backdrop-blur-md

        sm:items-center
        sm:p-5
      "
      role="dialog"
      aria-modal="true"
      aria-label="Carrinho"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div
        className="
          flex

          max-h-[94vh]
          w-full
          max-w-3xl

          flex-col

          overflow-hidden

          rounded-t-[28px]

          border
          border-white/15

          bg-gradient-to-br
          from-[#222222]
          via-[#101010]
          to-black

          text-white

          shadow-[0_35px_120px_rgba(0,0,0,0.90)]

          sm:rounded-[28px]
        "
      >
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div
          className="
            flex

            shrink-0

            items-center
            justify-between

            gap-4

            border-b
            border-white/10

            p-5

            sm:p-6
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-black

                uppercase

                tracking-[0.22em]

                text-[#d4af37]
              "
            >
              Sua seleção
            </p>

            <h2
              className="
                mt-1

                text-2xl
                font-black
              "
            >
              🛒 Carrinho
            </h2>

            <p
              className="
                mt-1

                text-xs

                text-white/40
              "
            >
              {quantidadeTotal}{" "}
              {quantidadeTotal === 1
                ? "item"
                : "itens"}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar carrinho"
            className="
              flex

              h-11
              w-11

              items-center
              justify-center

              rounded-full

              border
              border-white/15

              bg-black/40

              text-xl

              transition-all
              duration-300

              hover:border-[#d4af37]
              hover:bg-[#d4af37]
              hover:text-black
            "
          >
            ×
          </button>
        </div>

        {/* =====================================================
            CORPO
        ====================================================== */}

        <div
          className="
            flex-1

            overflow-y-auto

            p-5

            sm:p-6
          "
        >
          {itens.length === 0 ? (
            <div
              className="
                flex

                min-h-[360px]

                items-center
                justify-center

                text-center
              "
            >
              <div>
                <div className="text-5xl">
                  🛒
                </div>

                <h3
                  className="
                    mt-5

                    text-xl
                    font-black
                  "
                >
                  Seu carrinho está vazio
                </h3>

                <p
                  className="
                    mt-2

                    text-sm

                    text-white/40
                  "
                >
                  Escolha um restaurante e
                  adicione seus pratos.
                </p>

                <button
                  type="button"
                  onClick={onFechar}
                  className="
                    mt-6

                    rounded-2xl

                    border
                    border-[#d4af37]/45

                    bg-[#d4af37]

                    px-6
                    py-3

                    text-sm
                    font-black

                    text-black
                  "
                >
                  Continuar escolhendo
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* =================================================
                  ITENS
              ================================================== */}

              <div className="space-y-3">
                {itens.map((item) => (
                  <article
                    key={item.pratoId}
                    className="
                      rounded-[22px]

                      border
                      border-white/10

                      bg-gradient-to-br
                      from-[#292929]
                      via-[#171717]
                      to-[#090909]

                      p-4
                    "
                  >
                    <div
                      className="
                        flex

                        gap-4
                      "
                    >
                      {/* FOTO */}

                      <div
                        className="
                          flex

                          h-20
                          w-20

                          shrink-0

                          items-center
                          justify-center

                          overflow-hidden

                          rounded-2xl

                          bg-black/40
                        "
                      >
                        {item.imagemUrl ? (
                          <img
                            src={
                              item.imagemUrl
                            }
                            alt={item.nome}
                            className="
                              h-full
                              w-full

                              object-cover
                            "
                          />
                        ) : (
                          <span className="text-2xl">
                            🍽️
                          </span>
                        )}
                      </div>

                      {/* DADOS */}

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <div
                          className="
                            flex

                            items-start
                            justify-between

                            gap-3
                          "
                        >
                          <div>
                            <p
                              className="
                                text-[9px]
                                font-bold

                                uppercase

                                tracking-[0.12em]

                                text-[#d4af37]
                              "
                            >
                              {
                                item.restauranteNome
                              }
                            </p>

                            <h3
                              className="
                                mt-1

                                font-black

                                text-white
                              "
                            >
                              {item.nome}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onRemover(
                                item.pratoId
                              )
                            }
                            aria-label={`Remover ${item.nome}`}
                            className="
                              text-sm

                              text-white/30

                              transition-colors

                              hover:text-red-400
                            "
                          >
                            ✕
                          </button>
                        </div>

                        <p
                          className="
                            mt-2

                            font-black

                            text-[#f1cc48]
                          "
                        >
                          R${" "}
                          {(
                            item.preco *
                            item.quantidade
                          ).toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits:
                                2,
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* QUANTIDADE */}

                    <div
                      className="
                        mt-4

                        flex

                        items-center
                        justify-between

                        gap-4
                      "
                    >
                      <div
                        className="
                          flex

                          items-center

                          overflow-hidden

                          rounded-xl

                          border
                          border-white/10

                          bg-black/30
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onAlterarQuantidade(
                              item.pratoId,
                              Math.max(
                                1,
                                item.quantidade -
                                  1
                              )
                            )
                          }
                          className="
                            flex

                            h-10
                            w-10

                            items-center
                            justify-center

                            text-lg

                            hover:bg-white/[0.05]
                          "
                        >
                          −
                        </button>

                        <div
                          className="
                            flex

                            h-10
                            min-w-[44px]

                            items-center
                            justify-center

                            border-x
                            border-white/10

                            text-sm
                            font-black
                          "
                        >
                          {item.quantidade}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onAlterarQuantidade(
                              item.pratoId,
                              item.quantidade +
                                1
                            )
                          }
                          className="
                            flex

                            h-10
                            w-10

                            items-center
                            justify-center

                            text-lg

                            hover:bg-white/[0.05]
                          "
                        >
                          +
                        </button>
                      </div>

                      <span
                        className="
                          text-xs

                          text-white/35
                        "
                      >
                        Unitário: R${" "}
                        {item.preco.toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits:
                              2,
                          }
                        )}
                      </span>
                    </div>

                    {/* OBSERVAÇÃO */}

                    <textarea
                      value={
                        item.observacao
                      }
                      onChange={(event) =>
                        onAlterarObservacao(
                          item.pratoId,
                          event.target.value
                        )
                      }
                      placeholder="Observação para este item..."
                      rows={2}
                      className="
                        mt-4

                        w-full

                        resize-none

                        rounded-xl

                        border
                        border-white/10

                        bg-black/35

                        px-4
                        py-3

                        text-sm

                        text-white

                        outline-none

                        placeholder:text-white/25

                        focus:border-[#d4af37]/60
                      "
                    />
                  </article>
                ))}
              </div>

              {/* LIMPAR */}

              <div
                className="
                  mt-4

                  text-right
                "
              >
                <button
                  type="button"
                  onClick={onLimpar}
                  className="
                    text-xs
                    font-bold

                    text-red-400/70

                    transition-colors

                    hover:text-red-400
                  "
                >
                  Limpar carrinho
                </button>
              </div>

              {/* =================================================
                  ATENDIMENTO
              ================================================== */}

              <div
                className="
                  mt-7

                  rounded-[22px]

                  border
                  border-white/10

                  bg-black/25

                  p-5
                "
              >
                <p
                  className="
                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.18em]

                    text-[#d4af37]
                  "
                >
                  Atendimento
                </p>

                <h3
                  className="
                    mt-2

                    text-lg
                    font-black
                  "
                >
                  Como deseja receber?
                </h3>

                <div
                  className="
                    mt-4

                    grid
                    grid-cols-1

                    gap-2

                    sm:grid-cols-3
                  "
                >
                  <Opcao
                    ativo={
                      atendimento ===
                      "entrega"
                    }
                    onClick={() =>
                      onAtendimentoChange(
                        "entrega"
                      )
                    }
                    icone="🚚"
                    titulo="Entrega"
                  />

                  <Opcao
                    ativo={
                      atendimento ===
                      "retirada_restaurante"
                    }
                    onClick={() =>
                      onAtendimentoChange(
                        "retirada_restaurante"
                      )
                    }
                    icone="🏪"
                    titulo="Retirar no restaurante"
                  />

                  <Opcao
                    ativo={
                      atendimento ===
                      "retirada_anfitriao"
                    }
                    onClick={() =>
                      onAtendimentoChange(
                        "retirada_anfitriao"
                      )
                    }
                    icone="🏡"
                    titulo="Retirada com anfitrião"
                  />
                </div>
              </div>

              {/* =================================================
                  PAGAMENTO
              ================================================== */}

              <div
                className="
                  mt-4

                  rounded-[22px]

                  border
                  border-white/10

                  bg-black/25

                  p-5
                "
              >
                <p
                  className="
                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.18em]

                    text-[#d4af37]
                  "
                >
                  Pagamento
                </p>

                <h3
                  className="
                    mt-2

                    text-lg
                    font-black
                  "
                >
                  Como pretende pagar?
                </h3>

                <div
                  className="
                    mt-4

                    grid
                    grid-cols-2

                    gap-2
                  "
                >
                  <Opcao
                    ativo={
                      pagamento === "pix"
                    }
                    onClick={() =>
                      onPagamentoChange(
                        "pix"
                      )
                    }
                    icone="◆"
                    titulo="PIX"
                  />

                  <Opcao
                    ativo={
                      pagamento ===
                      "credito"
                    }
                    onClick={() =>
                      onPagamentoChange(
                        "credito"
                      )
                    }
                    icone="💳"
                    titulo="Crédito"
                  />

                  <Opcao
                    ativo={
                      pagamento ===
                      "debito"
                    }
                    onClick={() =>
                      onPagamentoChange(
                        "debito"
                      )
                    }
                    icone="💳"
                    titulo="Débito"
                  />

                  <Opcao
                    ativo={
                      pagamento ===
                      "dinheiro"
                    }
                    onClick={() =>
                      onPagamentoChange(
                        "dinheiro"
                      )
                    }
                    icone="💵"
                    titulo="Dinheiro"
                  />
                </div>

                {pagamento ===
                  "dinheiro" &&
                  onTrocoChange && (
                    <div className="mt-4">
                      <label
                        className="
                          text-xs
                          font-bold

                          text-white/50
                        "
                      >
                        Precisa de troco?
                      </label>

                      <input
                        type="text"
                        value={trocoPara}
                        onChange={(
                          event
                        ) =>
                          onTrocoChange(
                            event.target
                              .value
                          )
                        }
                        placeholder="Ex.: troco para R$ 100"
                        className="
                          mt-2

                          w-full

                          rounded-xl

                          border
                          border-white/10

                          bg-black/35

                          px-4
                          py-3

                          text-sm

                          text-white

                          outline-none

                          placeholder:text-white/25

                          focus:border-[#d4af37]/60
                        "
                      />
                    </div>
                  )}
              </div>

              {/* =================================================
                  RESPOSTA
              ================================================== */}

              {resposta && (
                <div
                  className={`
                    mt-4

                    rounded-[20px]

                    border

                    p-5

                    ${
                      resposta.sucesso
                        ? `
                          border-emerald-400/25

                          bg-emerald-400/[0.07]
                        `
                        : `
                          border-red-400/25

                          bg-red-400/[0.07]
                        `
                    }
                  `}
                >
                  <p
                    className={`
                      text-sm
                      font-black

                      ${
                        resposta.sucesso
                          ? "text-emerald-300"
                          : "text-red-300"
                      }
                    `}
                  >
                    {resposta.sucesso
                      ? "✓ Consulta preparada com sucesso."
                      : resposta.erro ||
                        "Não foi possível preparar a consulta."}
                  </p>

                  {resposta.sucesso &&
                    resposta.totalEstimado !==
                      undefined && (
                      <p
                        className="
                          mt-2

                          text-sm

                          text-white/55
                        "
                      >
                        Total estimado:{" "}
                        <strong className="text-white">
                          R${" "}
                          {resposta.totalEstimado.toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits:
                                2,
                            }
                          )}
                        </strong>
                      </p>
                    )}
                </div>
              )}
            </>
          )}
        </div>

        {/* =====================================================
            TOTAL / FINALIZAÇÃO
        ====================================================== */}

        {itens.length > 0 && (
          <div
            className="
              shrink-0

              border-t
              border-white/10

              bg-black/40

              p-5

              backdrop-blur-md

              sm:p-6
            "
          >
            <div
              className="
                flex

                items-end
                justify-between

                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-[9px]
                    font-black

                    uppercase

                    tracking-[0.18em]

                    text-white/35
                  "
                >
                  Subtotal
                </p>

                <strong
                  className="
                    mt-1
                    block

                    text-2xl
                    font-black

                    text-white
                  "
                >
                  R${" "}
                  {subtotal.toLocaleString(
                    "pt-BR",
                    {
                      minimumFractionDigits:
                        2,
                    }
                  )}
                </strong>
              </div>

              <button
                type="button"
                onClick={
                  onEnviarConsulta
                }
                disabled={carregando}
                className="
                  flex

                  min-h-[54px]

                  min-w-[190px]

                  items-center
                  justify-center

                  rounded-2xl

                  border
                  border-[#d4af37]

                  bg-gradient-to-r
                  from-[#c69f22]
                  via-[#f0ce4c]
                  to-[#c69f22]

                  px-6
                  py-3

                  text-sm
                  font-black

                  text-black

                  shadow-[0_10px_30px_rgba(212,175,55,0.15)]

                  transition-all
                  duration-300

                  hover:-translate-y-0.5
                  hover:brightness-110

                  disabled:cursor-wait
                  disabled:opacity-60
                "
              >
                {carregando
                  ? "Preparando..."
                  : "Consultar pedido →"}
              </button>
            </div>

            <p
              className="
                mt-3

                text-[10px]
                leading-5

                text-white/30
              "
            >
              Valores, disponibilidade,
              pagamento e entrega devem ser
              confirmados diretamente com o
              estabelecimento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   OPÇÃO
========================================================= */

function Opcao({
  ativo,
  onClick,
  icone,
  titulo,
}: {
  ativo: boolean;

  onClick: () => void;

  icone: string;

  titulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex

        min-h-[70px]

        items-center
        justify-center

        gap-2

        rounded-xl

        border

        px-3
        py-3

        text-center

        text-xs
        font-black

        transition-all
        duration-300

        ${
          ativo
            ? `
              border-[#d4af37]

              bg-[#d4af37]/15

              text-[#f1cd49]
            `
            : `
              border-white/10

              bg-white/[0.035]

              text-white/55

              hover:border-white/25

              hover:text-white
            `
        }
      `}
    >
      <span>{icone}</span>

      <span>{titulo}</span>
    </button>
  );
}