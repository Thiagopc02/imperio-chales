import {

  useEffect,

  useState,

} from "react";



import {

  Link,

  useNavigate,

} from "react-router-dom";



import {

  onAuthStateChanged,

  signOut,

  type User,

} from "firebase/auth";



import {

  doc,

  onSnapshot,

  type Timestamp,

} from "firebase/firestore";



import {

  auth,

  db,

} from "../firebase/config";



import perfilIcon from "../components/catalogo/perfil.png";
import estadiaIcon from "./estadia.png";
import consultasIcon from "./consultas.png";



/* =========================================================

   TIPOS

========================================================= */



interface PerfilCliente {

  uid: string;

  nomeCompleto: string;

  cpf: string;

  celular: string;

  email: string;

  tipo: "cliente";

  criadoEm: Timestamp | null;

  fotoUrl?: string;

}



type EstadoPerfil =

  | "carregando"

  | "pronto"

  | "sem_perfil"

  | "erro";



/* =========================================================

   FORMATAÇÕES

========================================================= */



function formatarCelular(

  valor: string

): string {

  const numeros = valor.replace(

    /\D/g,

    ""

  );



  if (numeros.length !== 11) {

    return "NÃO INFORMADO";

  }



  return `(${numeros.slice(

    0,

    2

  )}) ${numeros.slice(

    2,

    7

  )}-${numeros.slice(7)}`;

}



/* =========================================================

   CPF MASCARADO

========================================================= */



function mascararCPF(

  valor: string

): string {

  const numeros = valor.replace(

    /\D/g,

    ""

  );



  if (numeros.length !== 11) {

    return "NÃO INFORMADO";

  }



  return `***.***.***-${numeros.slice(

    -2

  )}`;

}



/* =========================================================

   DATA

========================================================= */



function formatarData(

  valor: Timestamp | null

): string {

  if (!valor) {

    return "NÃO DISPONÍVEL";

  }



  return valor

    .toDate()

    .toLocaleDateString(

      "pt-BR",

      {

        day: "2-digit",

        month: "long",

        year: "numeric",

      }

    );

}



/* =========================================================

   TEXTO OPCIONAL

========================================================= */



function textoOpcional(

  valor: unknown

): string | undefined {

  if (

    typeof valor !== "string"

  ) {

    return undefined;

  }



  const resultado =

    valor.trim();



  return resultado

    ? resultado

    : undefined;

}



/* =========================================================

   CONVERTER PERFIL

========================================================= */



function converterPerfil(

  uid: string,

  dados: Record<

    string,

    unknown

  >

): PerfilCliente | null {

  if (

    dados.uid !== uid ||

    dados.tipo !==

      "cliente" ||

    typeof dados.nomeCompleto !==

      "string" ||

    typeof dados.email !==

      "string"

  ) {

    return null;

  }



  const criadoEm =

    dados.criadoEm &&

    typeof dados.criadoEm ===

      "object" &&

    "toDate" in dados.criadoEm &&

    typeof (

      dados.criadoEm as {

        toDate?: unknown;

      }

    ).toDate === "function"

      ? (dados.criadoEm as Timestamp)

      : null;



  const fotoUrl =

    textoOpcional(

      dados.fotoUrl

    ) ||

    textoOpcional(

      dados.photoURL

    ) ||

    textoOpcional(

      dados.foto

    );



  return {

    uid,



    nomeCompleto:

      dados.nomeCompleto,



    cpf:

      typeof dados.cpf ===

      "string"

        ? dados.cpf

        : "",



    celular:

      typeof dados.celular ===

      "string"

        ? dados.celular

        : "",



    email:

      dados.email,



    tipo:

      "cliente",



    criadoEm,



    fotoUrl,

  };

}



/* =========================================================

   CAMPO DO PERFIL

========================================================= */



type CampoPerfilProps = {

  titulo: string;

  valor: string;

  destaque?: boolean;

};



function CampoPerfil({

  titulo,

  valor,

  destaque = false,

}: CampoPerfilProps) {

  return (

    <div

      className="

        rounded-[20px]

        border

        border-white/10



        bg-gradient-to-br

        from-white/[0.07]

        to-white/[0.025]



        p-4



        transition-all

        duration-300



        hover:border-white/20



        sm:p-5

      "

    >

      <p

        className="

          text-[9px]

          font-black



          uppercase



          tracking-[0.18em]



          text-white/35



          sm:text-[10px]

        "

      >

        {titulo}

      </p>



      <p

        className={`

          mt-2



          break-words



          text-sm

          font-black



          uppercase



          sm:text-base



          ${

            destaque

              ? "text-[#16f06d]"

              : "text-white"

          }

        `}

        style={{

          textShadow:

            destaque

              ? "0 0 14px rgba(22,240,109,0.28)"

              : "0 2px 0 rgba(0,0,0,0.85)",

        }}

      >

        {valor}

      </p>

    </div>

  );

}



/* =========================================================

   COMPONENTE PRINCIPAL

========================================================= */



export function ClientePerfil() {

  const navigate =

    useNavigate();



  const [

    perfil,

    setPerfil,

  ] =

    useState<PerfilCliente | null>(

      null

    );



  const [

    estado,

    setEstado,

  ] =

    useState<EstadoPerfil>(

      "carregando"

    );



  const [

    erro,

    setErro,

  ] = useState("");



  const [

    saindo,

    setSaindo,

  ] = useState(false);



  /* =======================================================

     CONSULTAR PERFIL

  ======================================================= */



  useEffect(() => {

    let ativo = true;



    let cancelarPerfil:

      | (() => void)

      | undefined;



    const cancelarAuth =

      onAuthStateChanged(

        auth,



        (

          usuario:

            User | null

        ) => {

          if (

            cancelarPerfil

          ) {

            cancelarPerfil();



            cancelarPerfil =

              undefined;

          }



          setPerfil(null);



          setEstado(

            "carregando"

          );



          if (!usuario) {

            navigate(

              "/cliente/login",

              {

                replace: true,



                state: {

                  from:

                    "/cliente/perfil",

                },

              }

            );



            return;

          }



          const uid =

            usuario.uid;



          const referencia =

            doc(

              db,

              "clientes",

              uid

            );



          cancelarPerfil =

            onSnapshot(

              referencia,



              (

                documento

              ) => {

                if (

                  !ativo ||

                  auth

                    .currentUser

                    ?.uid !== uid

                ) {

                  return;

                }



                if (

                  !documento.exists()

                ) {

                  setPerfil(

                    null

                  );



                  setEstado(

                    "sem_perfil"

                  );



                  return;

                }



                const dados =

                  documento.data();



                const perfilConvertido =

                  converterPerfil(

                    uid,

                    dados

                  );



                if (

                  !perfilConvertido ||

                  perfilConvertido.email !==

                    usuario.email

                ) {

                  setPerfil(

                    null

                  );



                  setEstado(

                    "sem_perfil"

                  );



                  return;

                }



                setPerfil({

                  ...perfilConvertido,



                  fotoUrl:

                    perfilConvertido.fotoUrl ||

                    textoOpcional(

                      usuario.photoURL

                    ),

                });



                setEstado(

                  "pronto"

                );



                setErro("");

              },



              (

                erroFirebase

              ) => {

                if (!ativo) {

                  return;

                }



                console.error(

                  "Erro ao carregar perfil do cliente:",

                  erroFirebase

                );



                setPerfil(

                  null

                );



                setErro(

                  "Não foi possível carregar seu perfil. Verifique sua conexão e tente novamente."

                );



                setEstado(

                  "erro"

                );

              }

            );

        },



        (

          erroAuth

        ) => {

          if (!ativo) {

            return;

          }



          console.error(

            "Erro na autenticação do perfil:",

            erroAuth

          );



          setEstado(

            "erro"

          );



          setErro(

            "Não foi possível verificar sua autenticação."

          );

        }

      );



    return () => {

      ativo = false;



      cancelarAuth();



      if (

        cancelarPerfil

      ) {

        cancelarPerfil();

      }

    };

  }, [

    navigate,

  ]);



  /* =======================================================

     SAIR

  ======================================================= */



  async function sairDaConta(): Promise<void> {

    if (saindo) {

      return;

    }



    setSaindo(true);

    setErro("");



    try {

      await signOut(

        auth

      );



      navigate(

        "/cliente/login",

        {

          replace: true,

        }

      );

    } catch (

      erroLogout

    ) {

      console.error(

        "Erro ao sair da conta:",

        erroLogout

      );



      setErro(

        "Não foi possível sair da conta. Tente novamente."

      );



      setSaindo(false);

    }

  }



  /* =======================================================

     CARREGANDO

  ======================================================= */



  if (

    estado ===

    "carregando"

  ) {

    return (

      <main

        className="

          flex

          min-h-screen



          items-center

          justify-center



          bg-black



          px-4



          text-white

        "

      >

        <div

          className="

            rounded-[30px]



            border

            border-white/10



            bg-[#0b0b0b]



            px-9

            py-10



            text-center



            shadow-2xl

          "

        >

          <div

            className="

              mx-auto



              h-11

              w-11



              animate-spin



              rounded-full



              border-4

              border-white/10



              border-t-[#16f06d]

            "

          />



          <h1

            className="

              mt-6



              text-xl

              font-black



              uppercase



              text-white

            "

          >

            Carregando perfil

          </h1>

        </div>

      </main>

    );

  }



  /* =======================================================

     SEM PERFIL

  ======================================================= */



  if (

    estado ===

    "sem_perfil"

  ) {

    return (

      <main

        className="

          flex

          min-h-screen



          items-center

          justify-center



          bg-black



          px-4



          text-white

        "

      >

        <div

          className="

            w-full

            max-w-md



            rounded-[30px]



            border

            border-red-500/25



            bg-[#0b0b0b]



            p-8



            text-center



            shadow-2xl

          "

        >

          <div className="text-4xl">

            ⚠️

          </div>



          <h1

            className="

              mt-5



              text-2xl

              font-black



              uppercase

            "

          >

            Perfil não encontrado

          </h1>



          <p

            className="

              mt-4



              text-sm

              leading-7



              text-white/45

            "

          >

            Não encontramos um

            perfil de cliente válido

            associado à sua conta.

          </p>



          <Link

            to="/cardapio"

            className="

              mt-7



              flex

              min-h-[58px]



              items-center

              justify-center



              gap-3



              rounded-2xl



              bg-[#16f06d]



              px-5



              font-black

              uppercase



              text-black

            "

          >

            <img

              src="/cardapio.png"

              alt=""

              className="

                h-9

                w-9



                object-contain

              "

            />



            Voltar ao cardápio

          </Link>

        </div>

      </main>

    );

  }



  /* =======================================================

     ERRO

  ======================================================= */



  if (

    estado ===

    "erro"

  ) {

    return (

      <main

        className="

          flex

          min-h-screen



          items-center

          justify-center



          bg-black



          px-4



          text-white

        "

      >

        <div

          className="

            w-full

            max-w-md



            rounded-[30px]



            border

            border-red-500/25



            bg-[#0b0b0b]



            p-8



            text-center

          "

        >

          <div className="text-4xl">

            ⚠️

          </div>



          <h1

            className="

              mt-5



              text-2xl

              font-black



              uppercase

            "

          >

            Não foi possível

            abrir seu perfil

          </h1>



          <p

            className="

              mt-4



              text-sm

              leading-7



              text-white/45

            "

          >

            {erro}

          </p>



          <button

            type="button"

            onClick={() =>

              window.location.reload()

            }

            className="

              mt-7



              w-full



              rounded-2xl



              bg-[#16f06d]



              px-5

              py-4



              text-sm

              font-black



              uppercase



              text-black

            "

          >

            Tentar novamente

          </button>

        </div>

      </main>

    );

  }



  if (!perfil) {

    return null;

  }



  /* =======================================================

     PÁGINA

  ======================================================= */



  return (

    <main

      className="

        relative



        min-h-screen



        overflow-hidden



        bg-black



        px-4

        py-7



        text-white



        sm:px-6

        sm:py-10



        lg:px-8

        lg:py-12

      "

    >

      {/* LUZ VERDE */}



      <div

        aria-hidden="true"

        className="

          pointer-events-none



          absolute



          -left-40

          top-60



          h-[420px]

          w-[420px]



          rounded-full



          bg-[#16f06d]/[0.05]



          blur-[150px]

        "

      />



      {/* LUZ DOURADA */}



      <div

        aria-hidden="true"

        className="

          pointer-events-none



          absolute



          -right-40

          top-[620px]



          h-[420px]

          w-[420px]



          rounded-full



          bg-[#d4af37]/[0.035]



          blur-[160px]

        "

      />



      <div

        className="

          relative

          z-10



          mx-auto



          w-full

          max-w-6xl

        "

      >

        {/* =================================================

            CABEÇALHO

        ================================================= */}



        <header

          className="

            mb-8



            flex

            flex-col



            items-center



            text-center



            sm:mb-10

          "

        >

          <Link

            to="/cardapio"

            className="

              transition-transform

              duration-300



              hover:scale-105

            "

          >

            <img

              src="/coroa.png"

              alt="Império Chalés"

              draggable={false}

              className="

                h-16

                w-16



                object-contain



                drop-shadow-[0_0_15px_rgba(255,255,255,0.18)]



                sm:h-20

                sm:w-20

              "

            />

          </Link>



          <div

            className="

              mt-5



              inline-flex



              rounded-full



              border

              border-[#16f06d]/25



              bg-[#16f06d]/[0.07]



              px-4

              py-2



              text-[9px]

              font-black



              uppercase



              tracking-[0.22em]



              text-[#16f06d]



              sm:text-[10px]

            "

          >

            Área exclusiva do hóspede

          </div>



          <h1

            className="

              mt-5



              text-[38px]

              font-black



              uppercase



              leading-[0.9]



              tracking-[-0.045em]



              text-white



              sm:text-[52px]



              lg:text-[64px]

            "

            style={{

              fontFamily:

                "'Arial Black', 'Montserrat', sans-serif",



              textShadow:

                "0 3px 0 #000, 0 10px 30px rgba(0,0,0,.55)",

            }}

          >

            Minha{" "}



            <span

              className="

                text-[#16f06d]

              "

              style={{

                textShadow:

                  "0 0 18px rgba(22,240,109,.38)",

              }}

            >

              conta

            </span>

          </h1>

        </header>



        {/* =================================================

            CARD PRINCIPAL

        ================================================= */}



        <section

          className="

            relative



            overflow-hidden



            rounded-[30px]



            border

            border-white/10



            bg-gradient-to-br

            from-[#1b1b1b]

            via-[#0e0e0e]

            to-black



            p-5



            shadow-[0_25px_80px_rgba(0,0,0,0.6)]



            sm:p-7

            lg:p-9

          "

        >

          <div

            aria-hidden="true"

            className="

              pointer-events-none



              absolute



              -left-32

              -top-36



              h-[360px]

              w-[360px]



              rounded-full



              bg-[#16f06d]/[0.06]



              blur-[110px]

            "

          />



          <div

            className="

              relative

              z-10



              grid

              gap-8



              lg:grid-cols-[0.72fr_1.28fr]

            "

          >

            {/* PERFIL */}



            <div>

              <div

                className="

                  flex

                  flex-col



                  items-center



                  text-center



                  sm:flex-row

                  sm:text-left

                "

              >

                <div

                  className="

                    flex

                    h-24

                    w-24



                    shrink-0



                    items-center

                    justify-center



                    overflow-hidden



                    rounded-[24px]



                    border

                    border-white/10



                    bg-gradient-to-br

                    from-[#292929]

                    to-black



                    shadow-[0_15px_35px_rgba(0,0,0,0.45)]

                  "

                >

                  <img

                    src={

                      perfil.fotoUrl ||

                      perfilIcon

                    }

                    alt="Perfil do cliente"

                    draggable={false}

                    className="

                      h-[78px]

                      w-[78px]



                      object-contain



                      drop-shadow-[0_0_14px_rgba(147,51,234,0.45)]

                    "

                  />

                </div>



                <div

                  className="

                    mt-5

                    min-w-0



                    sm:ml-5

                    sm:mt-0

                  "

                >

                  <p

                    className="

                      text-[9px]

                      font-black



                      uppercase



                      tracking-[0.2em]



                      text-white/35

                    "

                  >

                    Bem-vindo de volta

                  </p>



                  <h2

                    className="

                      mt-2



                      break-words



                      text-[26px]

                      font-black



                      uppercase



                      leading-[0.95]



                      tracking-[-0.04em]



                      text-white



                      sm:text-[30px]

                    "

                    style={{

                      fontFamily:

                        "'Arial Black', 'Montserrat', sans-serif",

                    }}

                  >

                    Olá,{" "}



                    <span className="text-[#16f06d]">

                      {

                        perfil.nomeCompleto.split(

                          " "

                        )[0]

                      }

                    </span>

                  </h2>

                </div>

              </div>



              {/* ID */}



              <div

                className="

                  mt-7



                  rounded-[20px]



                  border

                  border-[#16f06d]/15



                  bg-[#16f06d]/[0.04]



                  p-4

                "

              >

                <p

                  className="

                    text-[9px]

                    font-black



                    uppercase



                    tracking-[0.18em]



                    text-[#16f06d]

                  "

                >

                  Identificação

                </p>



                <p

                  className="

                    mt-2



                    break-all



                    font-mono



                    text-[11px]

                    font-bold



                    text-white/55

                  "

                >

                  {perfil.uid}

                </p>

              </div>



              {/* CARDÁPIO */}



              <Link

                to="/cardapio"

                className="

                  group



                  mt-5



                  flex

                  min-h-[62px]



                  w-full



                  items-center

                  justify-center



                  gap-3



                  rounded-[18px]



                  bg-[#16f06d]



                  px-5



                  text-sm

                  font-black



                  uppercase



                  tracking-[0.03em]



                  text-black



                  shadow-[0_12px_30px_rgba(22,240,109,0.18)]



                  transition-all

                  duration-300



                  hover:-translate-y-1

                  hover:bg-[#31ff82]

                  hover:shadow-[0_18px_40px_rgba(22,240,109,0.25)]

                "

              >

                <img

                  src="/cardapio.png"

                  alt=""

                  aria-hidden="true"

                  draggable={false}

                  className="

                    h-11

                    w-11



                    object-contain



                    drop-shadow-[0_5px_10px_rgba(0,0,0,.3)]



                    transition-transform

                    duration-300



                    group-hover:scale-110

                  "

                />



                <span>

                  Acessar cardápio

                </span>



                <span>

                  →

                </span>

              </Link>

            </div>



            {/* =================================================

                DADOS

            ================================================= */}



            <div>

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



                      tracking-[0.22em]



                      text-[#16f06d]

                    "

                  >

                    Seus dados

                  </p>



                  <h2

                    className="

                      mt-2



                      text-2xl

                      font-black



                      uppercase



                      tracking-[-0.035em]



                      text-white



                      sm:text-3xl

                    "

                  >

                    Perfil do cliente

                  </h2>

                </div>



                <div

                  className="

                    hidden



                    h-12

                    w-12



                    items-center

                    justify-center



                    overflow-hidden



                    rounded-xl



                    border

                    border-white/10



                    bg-white/[0.05]



                    sm:flex

                  "

                >

                  <img

                    src={perfilIcon}

                    alt=""

                    aria-hidden="true"

                    className="

                      h-9

                      w-9



                      object-contain

                    "

                  />

                </div>

              </div>



              <div

                className="

                  mt-6



                  grid

                  gap-3



                  sm:grid-cols-2

                "

              >

                <CampoPerfil

                  titulo="Nome completo"

                  valor={

                    perfil.nomeCompleto

                  }

                  destaque

                />



                <CampoPerfil

                  titulo="E-mail"

                  valor={

                    perfil.email

                  }

                />



                <CampoPerfil

                  titulo="Telefone"

                  valor={

                    formatarCelular(

                      perfil.celular

                    )

                  }

                />



                <CampoPerfil

                  titulo="CPF protegido"

                  valor={

                    mascararCPF(

                      perfil.cpf

                    )

                  }

                />



                <div

                  className="

                    sm:col-span-2

                  "

                >

                  <CampoPerfil

                    titulo="Cliente desde"

                    valor={

                      formatarData(

                        perfil.criadoEm

                      )

                    }

                  />

                </div>

              </div>

            </div>

          </div>

        </section>



        {/* =================================================

            CARDS INFERIORES

        ================================================= */}



        <div

          className="

            mt-6



            grid

            gap-6



            lg:grid-cols-2

          "

        >

          {/* =================================================

              MINHA ESTADIA

          ================================================= */}



          <section

            className="

              group

              relative



              overflow-hidden



              rounded-[28px]



              border

              border-[#d4af37]/20



              bg-gradient-to-br

              from-[#17150d]

              via-[#0d0d0c]

              to-black



              p-6



              transition-all

              duration-300



              hover:border-[#d4af37]/40



              sm:p-7

            "

          >

            <div

              aria-hidden="true"

              className="

                pointer-events-none



                absolute



                -right-16

                -top-16



                h-44

                w-44



                rounded-full



                bg-[#d4af37]/10



                blur-[70px]

              "

            />



            <div

              className="

                relative

                z-10

              "

            >

              {/* ÍCONE ESTADIA */}



              <div

                className="

                  flex



                  h-[90px]

                  w-[90px]



                  items-center

                  justify-center

                "

              >

                <img

                  src={estadiaIcon}

                  alt="Minha estadia"

                  draggable={false}

                  className="

                    h-full

                    w-full



                    object-contain



                    drop-shadow-[0_10px_20px_rgba(212,175,55,.28)]



                    transition-all

                    duration-300



                    group-hover:-translate-y-1

                    group-hover:scale-110

                  "

                />

              </div>



              <p

                className="

                  mt-3



                  text-[9px]

                  font-black



                  uppercase



                  tracking-[0.22em]



                  text-[#e8c94a]

                "

              >

                Hospedagem

              </p>



              <h2

                className="

                  mt-2



                  text-2xl

                  font-black



                  uppercase



                  tracking-[-0.035em]



                  text-white

                "

                style={{

                  fontFamily:

                    "'Arial Black', 'Montserrat', sans-serif",

                }}

              >

                Minha estadia

              </h2>



              <p

                className="

                  mt-4



                  text-sm

                  leading-7



                  text-white/48

                "

              >

                O número do chalé será

                informado quando você

                realizar uma consulta pelo

                cardápio.

              </p>



              <p

                className="

                  mt-3



                  text-sm

                  leading-7



                  text-white/35

                "

              >

                Sua conta continuará

                disponível em futuras

                hospedagens.

              </p>

            </div>

          </section>



          {/* =================================================

              MINHAS CONSULTAS

          ================================================= */}



          <section

            className="

              group

              relative



              overflow-hidden



              rounded-[28px]



              border

              border-white/10



              bg-gradient-to-br

              from-[#191919]

              via-[#0d0d0d]

              to-black



              p-6



              transition-all

              duration-300



              hover:border-[#16f06d]/25



              sm:p-7

            "

          >

            <div

              aria-hidden="true"

              className="

                pointer-events-none



                absolute



                -right-20

                top-0



                h-52

                w-52



                rounded-full



                bg-[#16f06d]/[0.055]



                blur-[80px]

              "

            />



            <div

              className="

                relative

                z-10

              "

            >

              {/* ÍCONE CONSULTAS */}



              <div

                className="

                  flex



                  h-[90px]

                  w-[90px]



                  items-center

                  justify-center

                "

              >

                <img

                  src={consultasIcon}

                  alt="Minhas consultas"

                  draggable={false}

                  className="

                    h-full

                    w-full



                    object-contain



                    drop-shadow-[0_10px_22px_rgba(22,240,109,.22)]



                    transition-all

                    duration-300



                    group-hover:-translate-y-1

                    group-hover:scale-110

                  "

                />

              </div>



              <p

                className="

                  mt-3



                  text-[9px]

                  font-black



                  uppercase



                  tracking-[0.22em]



                  text-[#16f06d]

                "

              >

                Histórico

              </p>



              <h2

                className="

                  mt-2



                  text-2xl

                  font-black



                  uppercase



                  tracking-[-0.035em]



                  text-white

                "

                style={{

                  fontFamily:

                    "'Arial Black', 'Montserrat', sans-serif",

                }}

              >

                Minhas consultas

              </h2>



              <div

                className="

                  mt-5



                  rounded-[20px]



                  border

                  border-dashed

                  border-white/10



                  bg-black/40



                  p-5



                  text-center

                "

              >

                <p

                  className="

                    text-sm

                    font-black



                    uppercase



                    text-white

                  "

                >

                  Nenhuma consulta exibida

                </p>



                <p

                  className="

                    mx-auto

                    mt-2



                    max-w-sm



                    text-xs

                    leading-6



                    text-white/35

                  "

                >

                  O histórico será

                  vinculado ao seu ID de

                  cliente conforme as

                  consultas forem

                  registradas.

                </p>

              </div>

            </div>

          </section>

        </div>



        {/* =================================================

            PRIVACIDADE

        ================================================= */}



        <section

          className="

            mt-6



            rounded-[24px]



            border

            border-[#16f06d]/15



            bg-[#16f06d]/[0.035]



            px-5

            py-4



            sm:px-6

          "

        >

          <div

            className="

              flex



              items-start



              gap-3

            "

          >

            <span className="text-lg">

              🔒

            </span>



            <div>

              <p

                className="

                  text-xs

                  font-black



                  uppercase



                  tracking-[0.12em]



                  text-[#16f06d]

                "

              >

                Seus dados estão protegidos

              </p>



              <p

                className="

                  mt-1



                  text-xs

                  leading-6



                  text-white/40

                "

              >

                Seu CPF não é exibido por

                completo e não é enviado aos

                restaurantes parceiros.

              </p>

            </div>

          </div>

        </section>



        {/* =================================================

            AÇÕES

        ================================================= */}



        <div

          className="

            mt-6



            grid

            gap-3



            sm:grid-cols-2

          "

        >

          <Link

            to="/cardapio"

            className="

              group



              flex

              min-h-[68px]



              items-center

              justify-center



              gap-3



              rounded-[18px]



              bg-[#16f06d]



              px-5



              text-center



              text-sm

              font-black



              uppercase



              tracking-[0.03em]



              text-black



              shadow-[0_12px_30px_rgba(22,240,109,.15)]



              transition-all

              duration-300



              hover:-translate-y-1

              hover:bg-[#31ff82]

            "

          >

            <img

              src="/cardapio.png"

              alt=""

              aria-hidden="true"

              draggable={false}

              className="

                h-12

                w-12



                object-contain



                transition-transform

                duration-300



                group-hover:scale-110

              "

            />



            <span>

              Acessar cardápio

            </span>



            <span>

              →

            </span>

          </Link>



          <button

            type="button"

            onClick={

              sairDaConta

            }

            disabled={

              saindo

            }

            className="

              flex

              min-h-[68px]



              items-center

              justify-center



              gap-2



              rounded-[18px]



              border

              border-red-500/40



              bg-red-500/[0.06]



              px-5



              text-sm

              font-black



              uppercase



              tracking-[0.03em]



              text-red-400



              transition-all

              duration-300



              hover:-translate-y-1

              hover:bg-red-500/10

              hover:text-red-300



              disabled:cursor-not-allowed

              disabled:opacity-50

            "

          >

            {saindo

              ? "Saindo..."

              : "Sair da conta"}

          </button>

        </div>



        {/* ERRO DE LOGOUT */}



        {erro && (

          <p

            role="alert"

            className="

              mt-5



              rounded-[18px]



              border

              border-red-500/25



              bg-red-500/[0.07]



              p-4



              text-center



              text-sm

              font-bold



              text-red-300

            "

          >

            ⚠️ {erro}

          </p>

        )}



        {/* =================================================

            RODAPÉ

        ================================================= */}



        <footer

          className="

            mt-10



            border-t

            border-white/10



            py-8



            text-center

          "

        >

          <img

            src="/coroa.png"

            alt=""

            aria-hidden="true"

            draggable={false}

            className="

              mx-auto



              h-10

              w-10



              object-contain



              opacity-70

            "

          />



          <p

            className="

              mt-4



              text-[10px]

              font-black



              uppercase



              tracking-[0.18em]



              text-white/35

            "

          >

            Império Chalés • Sabores da Chapada

          </p>



          <Link

            to="/cardapio"

            className="

              mt-4



              inline-flex



              text-xs

              font-black



              uppercase



              tracking-[0.06em]



              text-white



              transition-colors



              hover:text-[#16f06d]

            "

          >

            ← Voltar ao cardápio

          </Link>

        </footer>

      </div>

    </main>

  );

}



export default ClientePerfil;