import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { hasPermission } from "../../lib/permissions";
import { useAdminAuth } from "../auth/AdminAuthContext";
import {
  cmsModules,
  defaultModuleKey,
  getCmsModule,
  type CmsField,
  type CmsModuleConfig,
  type CmsStatus,
} from "../cms/contentModules";
import { db } from "../firebase";
import type { MediaAsset } from "../media/types";

type CmsDocument = {
  id: string;
  [key: string]: unknown;
};

type CmsContentManagerProps = {
  moduleKey?: string;
};

const statusOptions: CmsStatus[] = ["draft", "published", "archived"];

function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("popstate"));
}

function createEmptyForm(moduleConfig: CmsModuleConfig): Record<string, unknown> {
  return moduleConfig.fields.reduce<Record<string, unknown>>((accumulator, field) => {
    if (field.type === "boolean") {
      accumulator[field.name] = false;
    } else if (field.type === "number") {
      accumulator[field.name] = "";
    } else if (field.name === "status") {
      accumulator[field.name] = "draft";
    } else {
      accumulator[field.name] = "";
    }

    return accumulator;
  }, {});
}

function valueToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeFieldValue(field: CmsField, value: unknown): unknown {
  if (field.type === "boolean") {
    return Boolean(value);
  }

  if (field.type === "number") {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }

  return typeof value === "string" ? value.trim() : value;
}

function validateUrl(value: string): boolean {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function validateEmail(value: string): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fieldNeedsAltText(field: CmsField, fields: CmsField[]) {
  return (
    field.type === "media" &&
    fields.some(
      (candidate) =>
        candidate.name.toLowerCase().includes("alt") &&
        candidate.name.toLowerCase().includes(field.name.replace(/url$/i, "").toLowerCase()),
    )
  );
}

async function checkUniqueField(
  moduleConfig: CmsModuleConfig,
  field: CmsField,
  value: string,
  currentId: string | null,
): Promise<boolean> {
  const uniqueQuery = query(
    collection(db, moduleConfig.collection),
    where(field.name, "==", value),
    limit(2),
  );
  const snapshot = await getDocs(uniqueQuery);

  return snapshot.docs.every((snapshotDoc) => snapshotDoc.id === currentId);
}

export function CmsContentManager({ moduleKey }: CmsContentManagerProps) {
  const activeModuleKey = moduleKey || defaultModuleKey;
  const moduleConfig = useMemo(() => getCmsModule(activeModuleKey), [activeModuleKey]);
  const { profile } = useAdminAuth();
  const [documents, setDocuments] = useState<CmsDocument[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    createEmptyForm(moduleConfig),
  );
  const [editingDocument, setEditingDocument] = useState<CmsDocument | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CmsStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);

  const mayCreate = profile
    ? hasPermission(profile, moduleConfig.permission.create)
    : false;
  const mayUpdate = profile
    ? hasPermission(profile, moduleConfig.permission.update)
    : false;
  const mayDelete = profile
    ? hasPermission(profile, moduleConfig.permission.delete)
    : false;
  const mayPublish = profile
    ? hasPermission(profile, moduleConfig.permission.publish)
    : false;

  useEffect(() => {
    setFormData(createEmptyForm(moduleConfig));
    setEditingDocument(null);
    setShowForm(false);
    setSearchTerm("");
    setStatusFilter("all");
    setError(null);
    setSuccess(null);
  }, [moduleConfig]);

  useEffect(() => {
    setLoading(true);
    const documentsQuery = query(
      collection(db, moduleConfig.collection),
      orderBy("updatedAt", "desc"),
    );

    return onSnapshot(
      documentsQuery,
      (snapshot) => {
        setDocuments(
          snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          })),
        );
        setLoading(false);
      },
      () => {
        setError(`Could not load ${moduleConfig.title}.`);
        setLoading(false);
      },
    );
  }, [moduleConfig]);

  useEffect(() => {
    const mediaQuery = query(collection(db, "mediaAssets"), orderBy("createdAt", "desc"));

    return onSnapshot(mediaQuery, (snapshot) => {
      setMediaAssets(
        snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...(snapshotDoc.data() as Omit<MediaAsset, "id">),
        })),
      );
    });
  }, []);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return documents.filter((documentData) => {
      const documentStatus = valueToString(documentData[moduleConfig.statusField ?? "status"]);
      const matchesStatus =
        statusFilter === "all" || !moduleConfig.statusField || documentStatus === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return moduleConfig.searchFields.some((fieldName) =>
        valueToString(documentData[fieldName]).toLowerCase().includes(normalizedSearch),
      );
    });
  }, [documents, moduleConfig, searchTerm, statusFilter]);

  const writeAuditLog = async (
    action: string,
    targetId: string,
    metadata: Record<string, unknown> = {},
  ) => {
    if (!profile) {
      return;
    }

    try {
      await addDoc(collection(db, "auditLogs"), {
        action,
        actorEmail: profile.email,
        actorRole: profile.role,
        actorUid: profile.uid,
        createdAt: serverTimestamp(),
        metadata,
        targetId,
        targetType: moduleConfig.collection,
      });
    } catch {
      // Audit logging is best-effort on the client; trusted server logs remain preferred.
    }
  };

  const openCreateForm = () => {
    if (!mayCreate) {
      setError("Your role cannot create content in this module.");
      return;
    }

    setEditingDocument(null);
    setFormData(createEmptyForm(moduleConfig));
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const openEditForm = (documentData: CmsDocument) => {
    if (!mayUpdate) {
      setError("Your role cannot edit this module.");
      return;
    }

    setEditingDocument(documentData);
    setFormData({
      ...createEmptyForm(moduleConfig),
      ...documentData,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleFieldChange = (field: CmsField, value: unknown) => {
    setFormData((current) => {
      const next = { ...current, [field.name]: value };

      if (
        moduleConfig.slugField &&
        !editingDocument &&
        field.name === "title" &&
        !valueToString(next[moduleConfig.slugField])
      ) {
        next[moduleConfig.slugField] = slugify(valueToString(value));
      }

      if (
        moduleConfig.slugField &&
        !editingDocument &&
        field.name === "name" &&
        !valueToString(next[moduleConfig.slugField])
      ) {
        next[moduleConfig.slugField] = slugify(valueToString(value));
      }

      return next;
    });
  };

  const validateForm = async (): Promise<string | null> => {
    for (const field of moduleConfig.fields) {
      const value = normalizeFieldValue(field, formData[field.name]);
      const stringValue = valueToString(value);

      if (field.required && !stringValue && field.type !== "boolean") {
        return `${field.label} is required.`;
      }

      if (field.type === "url" && !validateUrl(stringValue)) {
        return `${field.label} must be a valid URL.`;
      }

      if (field.type === "email" && !validateEmail(stringValue)) {
        return `${field.label} must be a valid email address.`;
      }

      if (field.type === "number" && value !== null) {
        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {
          return `${field.label} must be a number.`;
        }

        if (field.min !== undefined && numberValue < field.min) {
          return `${field.label} must be at least ${field.min}.`;
        }

        if (field.max !== undefined && numberValue > field.max) {
          return `${field.label} must be no more than ${field.max}.`;
        }
      }

      if (field.unique && stringValue) {
        const unique = await checkUniqueField(
          moduleConfig,
          field,
          stringValue,
          editingDocument?.id ?? null,
        );

        if (!unique) {
          return `${field.label} must be unique.`;
        }
      }

      if (fieldNeedsAltText(field, moduleConfig.fields) && stringValue) {
        const altField = moduleConfig.fields.find(
          (candidate) =>
            candidate.name.toLowerCase().includes("alt") &&
            candidate.name.toLowerCase().includes(field.name.replace(/url$/i, "").toLowerCase()),
        );

        if (altField && !valueToString(formData[altField.name]).trim()) {
          return `${altField.label} is required when ${field.label} is set.`;
        }
      }
    }

    return null;
  };

  const buildPayload = () => {
    return moduleConfig.fields.reduce<Record<string, unknown>>((payload, field) => {
      payload[field.name] = normalizeFieldValue(field, formData[field.name]);
      return payload;
    }, {});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) {
      setError("Your admin session is not available.");
      return;
    }

    if (editingDocument ? !mayUpdate : !mayCreate) {
      setError("Your role cannot save this content.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const validationError = await validateForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      const payload = {
        ...buildPayload(),
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      };

      if (editingDocument) {
        await updateDoc(doc(db, moduleConfig.collection, editingDocument.id), payload);
        await writeAuditLog("cms.update", editingDocument.id);
        setSuccess(`${moduleConfig.title} item updated.`);
      } else {
        const created = await addDoc(collection(db, moduleConfig.collection), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: profile.uid,
        });
        await writeAuditLog("cms.create", created.id);
        setSuccess(`${moduleConfig.title} item created.`);
      }

      setShowForm(false);
      setEditingDocument(null);
      setFormData(createEmptyForm(moduleConfig));
    } catch {
      setError(`Could not save ${moduleConfig.title}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (documentData: CmsDocument, status: CmsStatus) => {
    if (!mayPublish) {
      setError("Your role cannot publish or archive this content.");
      return;
    }

    if (!moduleConfig.statusField) {
      return;
    }

    setBusyDocumentId(documentData.id);
    setError(null);
    setSuccess(null);

    try {
      await updateDoc(doc(db, moduleConfig.collection, documentData.id), {
        [moduleConfig.statusField]: status,
        updatedAt: serverTimestamp(),
        updatedBy: profile?.uid ?? null,
      });
      await writeAuditLog(`cms.status.${status}`, documentData.id);
      setSuccess(`Status changed to ${status}.`);
    } catch {
      setError("Could not update status.");
    } finally {
      setBusyDocumentId(null);
    }
  };

  const handleDelete = async (documentData: CmsDocument) => {
    if (!mayDelete) {
      setError("Your role cannot delete this content.");
      return;
    }

    const title =
      valueToString(documentData.title) ||
      valueToString(documentData.name) ||
      documentData.id;

    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setBusyDocumentId(documentData.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteDoc(doc(db, moduleConfig.collection, documentData.id));
      await writeAuditLog("cms.delete", documentData.id, { title });
      setSuccess("Item deleted.");
    } catch {
      setError("Could not delete item.");
    } finally {
      setBusyDocumentId(null);
    }
  };

  const renderField = (field: CmsField) => {
    const fieldId = `${moduleConfig.key}-${field.name}`;
    const value = formData[field.name];

    if (field.type === "boolean") {
      return (
        <label className="checkbox-row" key={field.name}>
          <input
            checked={Boolean(value)}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleFieldChange(field, event.target.checked)
            }
            type="checkbox"
          />
          <span>{field.label}</span>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <div className="field" key={field.name}>
          <label htmlFor={fieldId}>{field.label}</label>
          <textarea
            id={fieldId}
            onChange={(event) => handleFieldChange(field, event.target.value)}
            required={field.required}
            rows={field.name === "content" || field.name === "sections" ? 8 : 4}
            value={valueToString(value)}
          />
          {field.helpText && <p className="help-text">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div className="field" key={field.name}>
          <label htmlFor={fieldId}>{field.label}</label>
          <select
            id={fieldId}
            onChange={(event) => handleFieldChange(field, event.target.value)}
            required={field.required}
            value={valueToString(value) || field.options?.[0] || ""}
          >
            {(field.options ?? statusOptions).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "media") {
      return (
        <div className="field" key={field.name}>
          <label htmlFor={fieldId}>{field.label}</label>
          <div className="media-url-row">
            <input
              id={fieldId}
              onChange={(event) => handleFieldChange(field, event.target.value)}
              placeholder="Select from Media Library or enter URL"
              required={field.required}
              type="url"
              value={valueToString(value)}
            />
            <select
              aria-label={`Select existing media for ${field.label}`}
              onChange={(event) => handleFieldChange(field, event.target.value)}
              value=""
            >
              <option value="">Choose media</option>
              {mediaAssets.map((asset) => (
                <option key={asset.id} value={asset.url}>
                  {asset.originalFilename}
                </option>
              ))}
            </select>
          </div>
          <p className="help-text">
            Existing media can be selected now; richer media picker support can reuse this URL later.
          </p>
        </div>
      );
    }

    return (
      <div className="field" key={field.name}>
        <label htmlFor={fieldId}>{field.label}</label>
        <input
          id={fieldId}
          max={field.max}
          min={field.min}
          onChange={(event) => handleFieldChange(field, event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          step={field.type === "number" ? "any" : undefined}
          type={
            field.type === "datetime"
              ? "datetime-local"
              : field.type === "date"
                ? "date"
                : field.type === "email"
                  ? "email"
                  : field.type === "url"
                    ? "url"
                    : field.type === "number"
                      ? "number"
                      : "text"
          }
          value={valueToString(value)}
        />
      </div>
    );
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <h1>{moduleConfig.title}</h1>
          <p className="muted">{moduleConfig.description}</p>
        </div>

        {mayCreate && (
          <button className="button" onClick={openCreateForm} type="button">
            Create
          </button>
        )}
      </div>

      <section className="module-tabs" aria-label="CMS modules">
        {cmsModules.map((moduleItem) => (
          <button
            className={moduleItem.key === moduleConfig.key ? "active" : ""}
            key={moduleItem.key}
            onClick={() => navigate(`/admin/content/${moduleItem.key}`)}
            type="button"
          >
            {moduleItem.title}
          </button>
        ))}
      </section>

      {showForm && (
        <form className="card cms-form stack" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>{editingDocument ? "Edit Item" : "Create Item"}</h2>
            <button
              className="button secondary"
              onClick={() => setShowForm(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="form-grid">{moduleConfig.fields.map(renderField)}</div>

          {error && <div className="error">{error}</div>}

          <button className="button" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      <section className="card media-toolbar" aria-label="Content filters">
        <input
          aria-label={`Search ${moduleConfig.title}`}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={`Search ${moduleConfig.title.toLowerCase()}`}
          type="search"
          value={searchTerm}
        />

        {moduleConfig.statusField ? (
          <select
            aria-label="Filter by status"
            onChange={(event) => setStatusFilter(event.target.value as CmsStatus | "all")}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ) : (
          <span className="muted">No status filter</span>
        )}
      </section>

      {success && <div className="success">{success}</div>}
      {!showForm && error && <div className="error">{error}</div>}

      <section className="card table-card">
        {loading ? (
          <p>Loading...</p>
        ) : filteredDocuments.length === 0 ? (
          <p className="muted">No records found.</p>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  {moduleConfig.listFields.map((fieldName) => (
                    <th key={fieldName}>{fieldName}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((documentData) => (
                  <tr key={documentData.id}>
                    {moduleConfig.listFields.map((fieldName) => (
                      <td key={fieldName}>{valueToString(documentData[fieldName]) || "-"}</td>
                    ))}
                    <td>
                      <div className="table-actions">
                        {mayUpdate && (
                          <button
                            className="button secondary"
                            onClick={() => openEditForm(documentData)}
                            type="button"
                          >
                            Edit
                          </button>
                        )}

                        {moduleConfig.statusField && mayPublish && (
                          <>
                            <button
                              className="button secondary"
                              disabled={busyDocumentId === documentData.id}
                              onClick={() => handleStatusChange(documentData, "published")}
                              type="button"
                            >
                              Publish
                            </button>
                            <button
                              className="button secondary"
                              disabled={busyDocumentId === documentData.id}
                              onClick={() => handleStatusChange(documentData, "draft")}
                              type="button"
                            >
                              Unpublish
                            </button>
                            <button
                              className="button secondary"
                              disabled={busyDocumentId === documentData.id}
                              onClick={() => handleStatusChange(documentData, "archived")}
                              type="button"
                            >
                              Archive
                            </button>
                          </>
                        )}

                        {mayDelete && (
                          <button
                            className="button danger"
                            disabled={busyDocumentId === documentData.id}
                            onClick={() => handleDelete(documentData)}
                            type="button"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
