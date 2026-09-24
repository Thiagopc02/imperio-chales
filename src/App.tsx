
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ==========================================
// PÁGINAS PÚBLICAS
// ==========================================

import { Home } from "./pages/Home";
import { Cardapio } from "./Cardapio";

// ==========================================
// PÁGINAS ADMINISTRATIVAS
// ==========================================

import { AdminLogin } from "./admin/AdminLogin";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminRestaurantes } from "./admin/AdminRestaurantes";
import { AdminPratos } from "./admin/AdminPratos";

// ==========================================
// PROTEÇÃO ADMINISTRATIVA
// ==========================================

import { AdminRoute } from "./admin/AdminRoute";

// ==========================================
// PORTAL DO PARCEIRO
// ==========================================

// Cadastro do restaurante
import { ParceiroCadastro } from "./parceiro/ParceiroCadastro";

// Login do restaurante
import { ParceiroLogin } from "./parceiro/ParceiroLogin";

// Acompanhamento da aprovação
import { ParceiroSolicitacao } from "./parceiro/ParceiroSolicitacao";

// Dashboard do restaurante
import { ParceiroDashboard } from "./parceiro/ParceiroDashboard";

// Consultas recebidas
import { ParceiroPedidos } from "./parceiro/ParceiroPedidos";

// Gerenciamento de pratos
import { ParceiroPratos } from "./parceiro/ParceiroPratos";

// ==========================================
// PROTEÇÃO DO PARCEIRO
// ==========================================

import { ParceiroRoute } from "./parceiro/ParceiroRoute";

// ==========================================
// ÁREA DO CLIENTE
// ==========================================

// Cadastro do cliente
import { ClienteCadastro } from "./cliente/ClienteCadastro";

// Login do cliente
import { ClienteLogin } from "./cliente/ClienteLogin";

// Perfil do cliente
import { ClientePerfil } from "./cliente/ClientePerfil";

// Proteção das rotas privadas do cliente
import { ClienteRoute } from "./cliente/ClienteRoute";

// ==========================================
// APLICAÇÃO PRINCIPAL
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================================= */}
        {/* PÁGINAS PÚBLICAS                  */}
        {/* ================================= */}

        {/* Site principal de hospedagem */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* Catálogo gastronômico */}

        <Route
          path="/cardapio"
          element={<Cardapio />}
        />

        {/* ================================= */}
        {/* ÁREA DO CLIENTE                   */}
        {/* ================================= */}

        {/*
          CADASTRO

          Cria a conta no Firebase Authentication
          e grava o perfil privado em:

          clientes/{uid}

          O número do chalé não é armazenado
          permanentemente no cadastro.
        */}

        <Route
          path="/cliente/cadastro"
          element={<ClienteCadastro />}
        />

        {/*
          LOGIN

          Realiza autenticação com e-mail e senha.

          Também verifica se existe um perfil
          válido em clientes/{uid}.
        */}

        <Route
          path="/cliente/login"
          element={<ClienteLogin />}
        />

        {/* ================================= */}
        {/* ROTAS PROTEGIDAS DO CLIENTE       */}
        {/* ================================= */}

        {/*
          ClienteRoute verifica:

          1. Existência de sessão autenticada.

          2. Existência do documento clientes/{uid}.

          3. Correspondência entre o UID do
             documento e o usuário autenticado.

          4. Tipo de conta igual a "cliente".

          Somente após essa verificação
          libera a página do perfil.

          As regras do Firestore continuam sendo
          responsáveis por restringir o acesso
          aos documentos no banco de dados.
        */}

        <Route element={<ClienteRoute />}>

          {/* Entrada principal do cliente */}

          <Route
            path="/cliente"
            element={
              <Navigate
                to="/cliente/perfil"
                replace
              />
            }
          />

          {/* Perfil privado do cliente */}

          <Route
            path="/cliente/perfil"
            element={<ClientePerfil />}
          />

        </Route>

        {/* ================================= */}
        {/* LOGIN ADMINISTRATIVO              */}
        {/* ================================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* ================================= */}
        {/* ROTAS ADMINISTRATIVAS PROTEGIDAS  */}
        {/* ================================= */}

        <Route element={<AdminRoute />}>

          {/* Entrada da administração */}

          <Route
            path="/admin"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Central administrativa */}

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          {/* Cadastro e aprovação de restaurantes */}

          <Route
            path="/admin/restaurantes"
            element={<AdminRestaurantes />}
          />

          {/* Gerenciamento de pratos */}

          <Route
            path="/admin/pratos"
            element={<AdminPratos />}
          />

        </Route>

        {/* ================================= */}
        {/* PORTAL DO PARCEIRO                */}
        {/* ================================= */}

        {/* ================================= */}
        {/* LOGIN DO ESTABELECIMENTO          */}
        {/* ================================= */}

        <Route
          path="/parceiro/login"
          element={<ParceiroLogin />}
        />

        {/* ================================= */}
        {/* CADASTRO DO ESTABELECIMENTO       */}
        {/* ================================= */}

        <Route
          path="/parceiro/cadastro"
          element={<ParceiroCadastro />}
        />

        {/* ================================= */}
        {/* ACOMPANHAMENTO DA SOLICITAÇÃO     */}
        {/* ================================= */}

        <Route
          path="/parceiro/solicitacao"
          element={<ParceiroSolicitacao />}
        />

        {/* ================================= */}
        {/* ROTAS PROTEGIDAS DO PARCEIRO      */}
        {/* ================================= */}

        <Route element={<ParceiroRoute />}>

          {/* Entrada principal do parceiro */}

          <Route
            path="/parceiro"
            element={
              <Navigate
                to="/parceiro/dashboard"
                replace
              />
            }
          />

          {/* Dashboard do restaurante */}

          <Route
            path="/parceiro/dashboard"
            element={<ParceiroDashboard />}
          />

          {/* Central de consultas */}

          <Route
            path="/parceiro/pedidos"
            element={<ParceiroPedidos />}
          />

          {/* Cadastro e gerenciamento de pratos */}

          <Route
            path="/parceiro/pratos"
            element={<ParceiroPratos />}
          />

        </Route>

        {/* ================================= */}
        {/* PÁGINAS NÃO ENCONTRADAS           */}
        {/* ================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;