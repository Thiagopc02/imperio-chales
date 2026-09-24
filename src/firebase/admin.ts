// ==========================================
// IMPÉRIO CHALÉS
// IDENTIFICAÇÃO DO ADMINISTRADOR
// ==========================================

// UID da conta administrativa cadastrada no Firebase.
export const ADMIN_UID = "YcRdKdXa3rUwGJW6DcbYsh3Bmo63";

// Esta função serve apenas para verificações
// de interface no frontend.
//
// A segurança definitiva deve ser implementada
// nas regras do Firestore e nas operações do servidor.

export function isAdmin(uid: string | undefined | null): boolean {
  return uid === ADMIN_UID;
}