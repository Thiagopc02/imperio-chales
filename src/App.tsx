import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// ======================================================
// PÁGINAS PÚBLICAS
// ======================================================

import { Home } from "./pages/Home";
import { Cardapio } from "./Cardapio";

// ======================================================
// ADMINISTRAÇÃO
// ======================================================

import { AdminLogin } from "./admin/AdminLogin";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminRestaurantes } from "./admin/AdminRestaurantes";
import { AdminPratos } from "./admin/AdminPratos";
import { AdminRoute } from "./admin/AdminRoute";

// ======================================================
// PARCEIROS
// ======================================================

import { ParceiroCadastro } from "./parceiro/ParceiroCadastro";
import { ParceiroLogin } from "./parceiro/ParceiroLogin";
import { ParceiroSolicitacao } from "./parceiro/ParceiroSolicitacao";
import { ParceiroDashboard } from "./parceiro/ParceiroDashboard";
import { ParceiroPedidos } from "./parceiro/ParceiroPedidos";
import { ParceiroPratos } from "./parceiro/ParceiroPratos";
import { ParceiroRoute } from "./parceiro/ParceiroRoute";

// ======================================================
// CLIENTES
// ======================================================

import { ClienteCadastro } from "./cliente/ClienteCadastro";
import { ClienteLogin } from "./cliente/ClienteLogin";
import { ClientePerfil } from "./cliente/ClientePerfil";
import { ClienteRoute } from "./cliente/ClienteRoute";

// ======================================================
// APLICAÇÃO
// ======================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================================================
            SITE PÚBLICO
        ================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/cardapio"
          element={<Cardapio />}
        />

        {/* ==================================================
            ÁREA DO CLIENTE
        ================================================== */}

        <Route
          path="/cliente/cadastro"
          element={<ClienteCadastro />}
        />

        <Route
          path="/cliente/login"
          element={<ClienteLogin />}
        />

        {/* ==================================================
            ROTAS PROTEGIDAS DO CLIENTE
        ================================================== */}

        <Route element={<ClienteRoute />}>
          <Route
            path="/cliente"
            element={
              <Navigate
                to="/cliente/perfil"
                replace
              />
            }
          />

          <Route
            path="/cliente/perfil"
            element={<ClientePerfil />}
          />
        </Route>

        {/* ==================================================
            LOGIN ADMINISTRATIVO
        ================================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* ==================================================
            ROTAS PROTEGIDAS DO ADMINISTRADOR
        ================================================== */}

        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/restaurantes"
            element={<AdminRestaurantes />}
          />

          <Route
            path="/admin/pratos"
            element={<AdminPratos />}
          />
        </Route>

        {/* ==================================================
            PORTAL DO PARCEIRO
        ================================================== */}

        <Route
          path="/parceiro/login"
          element={<ParceiroLogin />}
        />

        <Route
          path="/parceiro/cadastro"
          element={<ParceiroCadastro />}
        />

        <Route
          path="/parceiro/solicitacao"
          element={<ParceiroSolicitacao />}
        />

        {/* ==================================================
            ROTAS PROTEGIDAS DO PARCEIRO
        ================================================== */}

        <Route element={<ParceiroRoute />}>
          <Route
            path="/parceiro"
            element={
              <Navigate
                to="/parceiro/dashboard"
                replace
              />
            }
          />

          <Route
            path="/parceiro/dashboard"
            element={<ParceiroDashboard />}
          />

          <Route
            path="/parceiro/pedidos"
            element={<ParceiroPedidos />}
          />

          <Route
            path="/parceiro/pratos"
            element={<ParceiroPratos />}
          />
        </Route>

        {/* ==================================================
            ROTA NÃO ENCONTRADA
        ================================================== */}

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