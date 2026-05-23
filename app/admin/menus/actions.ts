"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { saveMenu } from "@/lib/data/menus";
import { menuDocumentSchema } from "@/lib/validators";
import type { MenuLocation, MenuItem } from "@/types/menus";

export type MenuActionResponse =
  | { ok: true }
  | { ok: false; error: { message: string; fieldErrors?: Record<string, string[]> } };

export async function saveMenuAction(
  location: MenuLocation,
  items: MenuItem[],
): Promise<MenuActionResponse> {
  try {
    const auth = await getCurrentAdminSession("settings:manage");
    if (!auth.ok) {
      return { ok: false, error: { message: auth.message } };
    }

    // Validate
    const parsed = menuDocumentSchema.safeParse({ location, items });
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          message: "Invalid menu data.",
          fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }

    await saveMenu(location, parsed.data.items as MenuItem[], auth.session);

    // Revalidate caches
    revalidateTag("menus");
    revalidatePath("/", "layout"); // Header + footer live in the public layout
    revalidatePath("/admin/menus");

    return { ok: true };
  } catch (error) {
    console.error("[menus] saveMenuAction error:", error);
    return {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
      },
    };
  }
}
