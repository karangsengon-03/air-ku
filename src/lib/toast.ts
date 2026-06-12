/**
 * #9a — Toast utility wrapper
 * Bridge dari Sonner ke pattern addToast lama.
 * Semua komponen cukup: import { toast } from "@/lib/toast"
 * lalu: toast.success("...") / toast.error("...") / toast.info("...")
 * Tidak perlu ubah call signature.
 */
import { toast as sonner } from "sonner";

export const toast = {
  success: (message: string) => sonner.success(message),
  error: (message: string) => sonner.error(message),
  info: (message: string) => sonner.info(message),
};
