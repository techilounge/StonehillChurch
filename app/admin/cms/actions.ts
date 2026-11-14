"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import {
  createCmsDocument,
  updateCmsDocument,
  publishCmsDocument,
  archiveCmsDocument,
  deleteCmsDocument,
  reorderCmsDocuments,
  CmsAdminError,
  type CmsModule,
} from "@/lib/data/adminCms";
import type { CmsDocument } from "@/lib/data/adminCms";

export type CmsActionResponse<T = CmsDocument> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string; fieldErrors?: Record<string, string[]> } };

function handleCmsError(error: unknown): CmsActionResponse<any> {
  if (error instanceof CmsAdminError) {
    return {
      ok: false,
      error: {
        message: error.message,
        code: error.code,
        fieldErrors: error.fieldErrors,
      },
    };
  }
  
  console.error("[CMS Action Error]", error);
  return {
    ok: false,
    error: {
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    },
  };
}

function revalidateCmsModule(module: CmsModule, data?: Record<string, unknown> | null) {
  revalidatePath(`/admin/${module}`);

  // Public-side revalidation. Without this, editors must wait for the public
  // layout's 5-minute ISR window before their changes appear on the live site.
  switch (module) {
    case "siteSettings":
      revalidateTag("site-settings");
      revalidatePath("/", "layout");
      revalidatePath("/contact");
      revalidatePath("/im-new");
      revalidatePath("/plan-your-visit");
      revalidatePath("/give");
      revalidatePath("/live");
      break;

    case "pages": {
      // CMS pages map to public URLs by slug (e.g. "about" → /about).
      const slug = typeof data?.slug === "string" ? data.slug : null;
      if (slug) revalidatePath(`/${slug}`);
      // Menu items may link to pages by slug — flush menu cache too.
      revalidateTag("menus");
      break;
    }

    case "homepageSlides":
      revalidatePath("/");
      break;

    case "announcements":
      // TopAnnouncementBar lives in the public layout, so flush at layout level.
      revalidatePath("/", "layout");
      revalidatePath("/"); // homepage AnnouncementsPreview
      revalidatePath("/announcements");
      revalidatePath("/announcements/[slug]", "page");
      break;

    case "sermons":
      revalidatePath("/sermons");
      revalidatePath("/sermons/[slug]", "page");
      revalidatePath("/"); // home page LatestSermonSection
      break;

    case "events":
      revalidatePath("/events");
      revalidatePath("/events/[slug]", "page");
      revalidatePath("/church-calendar");
      revalidatePath("/"); // home page UpcomingEventsPreview
      break;

    case "ministries":
      revalidatePath("/ministries");
      revalidatePath("/ministries/[slug]", "page");
      revalidatePath("/"); // home page MinistriesPreview
      break;

    case "leaders":
      revalidatePath("/our-leaders");
      revalidatePath("/"); // WelcomeSection on home consumes leaders
      break;

    case "leaderCategories":
      revalidatePath("/our-leaders");
      revalidatePath("/"); // home may show leader cards grouped by category
      break;

    case "resources":
      revalidatePath("/resources");
      revalidatePath("/church-bulletin");
      break;

    case "popups":
      // PopupController sits in the public layout, so flush at layout level
      // so every page reflects the popup change immediately.
      revalidatePath("/", "layout");
      break;
  }
}

export async function createDocumentAction(
  module: CmsModule,
  input: unknown,
  options?: { id?: string }
): Promise<CmsActionResponse> {
  try {
    const auth = await getCurrentAdminSession();
    if (!auth.ok) {
      return { ok: false, error: { message: auth.message } };
    }

    const payload = input as Record<string, any>;
    if (module === "pages" && !payload.sections) {
      payload.sections = []; // Stub missing sections array
    }

    const result = await createCmsDocument(module, payload, auth.session, options);
    revalidateCmsModule(module, result as unknown as Record<string, unknown>);
    return { ok: true, data: result };
  } catch (error) {
    return handleCmsError(error);
  }
}

export async function updateDocumentAction(
  module: CmsModule,
  id: string,
  input: unknown
): Promise<CmsActionResponse> {
  try {
    const auth = await getCurrentAdminSession();
    if (!auth.ok) {
      return { ok: false, error: { message: auth.message } };
    }

    const result = await updateCmsDocument(module, id, input, auth.session);
    revalidateCmsModule(module, result as unknown as Record<string, unknown>);
    return { ok: true, data: result };
  } catch (error) {
    return handleCmsError(error);
  }
}

export async function publishDocumentAction(
  module: CmsModule,
  id: string
): Promise<CmsActionResponse> {
  try {
    const auth = await getCurrentAdminSession();
    if (!auth.ok) {
      return { ok: false, error: { message: auth.message } };
    }

    const result = await publishCmsDocument(module, id, auth.session);
    revalidateCmsModule(module, result as unknown as Record<string, unknown>);
    return { ok: true, data: result };
  } catch (error) {
    return handleCmsError(error);
  }
}

export async function archiveDocumentAction(
  module: CmsModule,
  id: string
): Promise<CmsActionResponse> {
  try {
    const auth = await getCurrentAdminSession();
    if (!auth.ok) {
      return { ok: false, error: { message: auth.message } };
    }

    const result = await archiveCmsDocument(module, id, auth.session);
    revalidateCmsModule(module, result as unknown as Record<string, unknown>);
    return { ok: true, data: result };
  } catch (error) {
    return handleCmsError(error);
  }
}

export async function deleteDocumentAction(
  module: CmsModule,
  id: string,
  hardDelete: boolean = false
): Promise<CmsActionResponse<{ id: string; archived: boolean; deleted: boolean }>> {
  try {
    const auth = await getCurrentAdminSession();
    if (!auth.ok) {
      return { ok: false, error: { message: auth.message } };
    }

    const result = await deleteCmsDocument(module, id, auth.session, { hardDelete });
    revalidateCmsModule(module);
    return { ok: true, data: result };
  } catch (error) {
    return handleCmsError(error);
  }
}

export async function reorderDocumentsAction(
  module: CmsModule,
  orderedIds: string[]
): Promise<CmsActionResponse<{ success: boolean }>> {
  try {
    const auth = await getCurrentAdminSession();
    if (!auth.ok) {
      return { ok: false, error: { message: auth.message } };
    }

    await reorderCmsDocuments(module, orderedIds, auth.session);

    revalidateCmsModule(module);
    return { ok: true, data: { success: true } };
  } catch (error) {
    return handleCmsError(error);
  }
}
