// ==========================================
// IMPÉRIO CHALÉS
// IDENTIFICAÇÃO DOS ADMINISTRADORES
// ==========================================

// ==========================================
// E-MAILS ADMINISTRATIVOS AUTORIZADOS
// ==========================================

export const ADMIN_EMAILS = [
  "proprietario123@gmail.com",
  "imperioilimitada3015@gmail.com",
];

// ==========================================
// UID ANTIGO
// ==========================================
//
// Mantemos o UID antigo temporariamente para
// compatibilidade com partes antigas do sistema.
//
// Caso essa conta ainda seja utilizada, ela
// continuará sendo reconhecida como administrador.
// ==========================================

export const ADMIN_UIDS = [
  "YcRdKdXa3rUwGJW6DcbYsh3Bmo63",
];

// ==========================================
// VERIFICAÇÃO POR E-MAIL
// ==========================================

export function isAdminEmail(
  email: string | undefined | null
): boolean {
  if (!email) {
    return false;
  }

  const emailNormalizado = email
    .trim()
    .toLowerCase();

  return ADMIN_EMAILS.includes(emailNormalizado);
}

// ==========================================
// VERIFICAÇÃO POR UID
// ==========================================

export function isAdminUid(
  uid: string | undefined | null
): boolean {
  if (!uid) {
    return false;
  }

  return ADMIN_UIDS.includes(uid);
}

// ==========================================
// VERIFICAÇÃO COMPLETA
// ==========================================
//
// Podemos informar UID, e-mail ou ambos.
//
// Isso permite manter compatibilidade com o código
// antigo enquanto migramos o painel para utilizar
// a validação por e-mail.
// ==========================================

export function isAdmin(
  uid?: string | null,
  email?: string | null
): boolean {
  return (
    isAdminEmail(email) ||
    isAdminUid(uid)
  );
}