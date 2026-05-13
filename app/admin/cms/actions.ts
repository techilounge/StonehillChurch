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

function revalidateCmsModule(module: CmsModule) {
  revalidatePath(`/admin/${module}`);

  if (module === "siteSettings") {
    revalidateTag("site-settings");
    revalidatePath("/", "layout");
    revalidatePath("/contact");
    revalidatePath("/im-new");
    revalidatePath("/plan-your-visit");
    revalidatePath("/give");
    revalidatePath("/live");
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
    revalidateCmsModule(module);
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
    revalidateCmsModule(module);
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
    revalidatePath(`/admin/${module}`);
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
    revalidatePath(`/admin/${module}`);
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
    revalidatePath(`/admin/${module}`);
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

    const routePath = module.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    revalidatePath(`/admin/${routePath}`);
    revalidatePath("/"); // revalidate public homepage too
    return { ok: true, data: { success: true } };
  } catch (error) {
    return handleCmsError(error);
  }
}
