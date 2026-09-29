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
// UID ADMINISTRATIVO ANTIGO
// ==========================================
//
// Mantido para compatibilidade com arquivos antigos
// que ainda importam ADMIN_UID diretamente.
// ==========================================

export const ADMIN_UID =
  "YcRdKdXa3rUwGJW6DcbYsh3Bmo63";

// ==========================================
// LISTA DE UIDS ADMINISTRATIVOS
// ==========================================

export const ADMIN_UIDS = [
  ADMIN_UID,
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

export function isAdmin(
  uid?: string | null,
  email?: string | null
): boolean {
  return (
    isAdminEmail(email) ||
    isAdminUid(uid)
  );
}