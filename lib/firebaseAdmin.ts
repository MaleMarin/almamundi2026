/**
 * Capa de compatibilidad: re-export para código que importa @/lib/firebaseAdmin.
 * Usar: adminDb() y adminBucket() para obtener instancias.
 */
export { getAdminDb as adminDb, getAdminBucket as adminBucket } from "@/lib/firebase/admin";
