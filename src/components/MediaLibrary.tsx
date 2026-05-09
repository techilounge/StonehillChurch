import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { canManageMedia, canUploadMedia } from "../../lib/permissions";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { db, storage } from "../firebase";
import {
  buildMediaStoragePath,
  optimizeImageForUpload,
  validateImageFile,
} from "../media/imageProcessing";
import type { MediaAsset } from "../media/types";

type MediaLibraryProps = {
  openUploadByDefault?: boolean;
};

type VisibilityFilter = "all" | "public" | "private";
type ViewMode = "grid" | "list";

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isObjectNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String(error.code) === "storage/object-not-found"
  );
}

export function MediaLibrary({ openUploadByDefault = false }: MediaLibraryProps) {
  const { profile } = useAdminAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(openUploadByDefault);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [draftAltText, setDraftAltText] = useState("");
  const [savingAssetId, setSavingAssetId] = useState<string | null>(null);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const mayUpload = profile ? canUploadMedia(profile) : false;
  const mayManageMedia = profile ? canManageMedia(profile) : false;

  useEffect(() => {
    setShowUpload(openUploadByDefault);
  }, [openUploadByDefault]);

  useEffect(() => {
    const mediaQuery = query(
      collection(db, "mediaAssets"),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(
      mediaQuery,
      (snapshot) => {
        setAssets(
          snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...(snapshotDoc.data() as Omit<MediaAsset, "id">),
          })),
        );
        setLibraryError(null);
        setLoading(false);
      },
      () => {
        setLibraryError("Could not load media assets.");
        setLoading(false);
      },
    );
  }, []);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "public" && asset.public) ||
        (visibilityFilter === "private" && !asset.public);

      if (!matchesVisibility) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        asset.altText,
        asset.originalFilename,
        asset.uploadedByEmail,
        asset.contentType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [assets, searchTerm, visibilityFilter]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError(file ? validateImageFile(file) : null);
    setSuccessMessage(null);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile || !mayUpload) {
      setUploadError("Your role cannot upload media.");
      return;
    }

    if (!selectedFile) {
      setUploadError("Choose an image to upload.");
      return;
    }

    const trimmedAltText = altText.trim();

    if (!trimmedAltText || (isPublic && trimmedAltText.length < 8)) {
      setUploadError("Public images need meaningful alt text.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setSuccessMessage(null);

    try {
      const optimized = await optimizeImageForUpload(selectedFile);
      const storagePath = buildMediaStoragePath(profile.uid, selectedFile.name);
      const assetRef = ref(storage, storagePath);
      const publicAsset = mayManageMedia && isPublic;

      await uploadBytes(assetRef, optimized.blob, {
        contentType: optimized.contentType,
        customMetadata: {
          approved: publicAsset ? "true" : "false",
          compression: "auto",
          originalFilename: selectedFile.name,
          public: publicAsset ? "true" : "false",
          uploadPipeline: "compressed",
          uploadedBy: profile.uid,
        },
      });

      const url = await getDownloadURL(assetRef);

      await addDoc(collection(db, "mediaAssets"), {
        altText: trimmedAltText,
        contentType: optimized.contentType,
        createdAt: serverTimestamp(),
        height: optimized.height,
        originalFilename: selectedFile.name,
        originalSize: selectedFile.size,
        public: publicAsset,
        size: optimized.blob.size,
        status: publicAsset ? "approved" : "private",
        storagePath,
        updatedAt: serverTimestamp(),
        uploadedBy: profile.uid,
        uploadedByEmail: profile.email,
        url,
        width: optimized.width,
      });

      setSelectedFile(null);
      setAltText("");
      setIsPublic(false);
      setSuccessMessage("Image optimized and uploaded.");
      const input = document.getElementById("media-file") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not upload image.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedAssetId(asset.id);
      window.setTimeout(() => setCopiedAssetId(null), 1800);
    } catch {
      setLibraryError("Could not copy the media URL.");
    }
  };

  const startEditingAltText = (asset: MediaAsset) => {
    setEditingAssetId(asset.id);
    setDraftAltText(asset.altText);
  };

  const handleSaveAltText = async (asset: MediaAsset) => {
    if (asset.public && !mayManageMedia) {
      setLibraryError("Your role cannot edit public media assets.");
      return;
    }

    const trimmedAltText = draftAltText.trim();

    if (!trimmedAltText || (asset.public && trimmedAltText.length < 8)) {
      setLibraryError("Public images need meaningful alt text.");
      return;
    }

    setSavingAssetId(asset.id);
    setLibraryError(null);

    try {
      await updateDoc(doc(db, "mediaAssets", asset.id), {
        altText: trimmedAltText,
        updatedAt: serverTimestamp(),
      });
      setEditingAssetId(null);
      setDraftAltText("");
    } catch {
      setLibraryError("Could not update alt text.");
    } finally {
      setSavingAssetId(null);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!mayManageMedia) {
      setLibraryError("Your role cannot delete media.");
      return;
    }

    setDeletingAssetId(asset.id);
    setLibraryError(null);

    try {
      try {
        await deleteObject(ref(storage, asset.storagePath));
      } catch (error) {
        if (!isObjectNotFound(error)) {
          throw error;
        }
      }

      await deleteDoc(doc(db, "mediaAssets", asset.id));
    } catch {
      setLibraryError("Could not delete media asset.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <h1>Media Library</h1>
          <p className="muted">
            Optimized images are stored in Firebase Storage with metadata in
            Firestore `mediaAssets`.
          </p>
        </div>

        {mayUpload && (
          <button
            className="button"
            onClick={() => setShowUpload((current) => !current)}
            type="button"
          >
            {showUpload ? "Close Upload" : "Upload Image"}
          </button>
        )}
      </div>

      {showUpload && mayUpload && (
        <form className="card upload-panel stack" onSubmit={handleUpload}>
          <div className="field">
            <label htmlFor="media-file">Image</label>
            <input
              accept="image/webp,image/jpeg,image/png"
              disabled={!mayUpload || isUploading}
              id="media-file"
              onChange={handleFileChange}
              type="file"
            />
            <p className="help-text">
              WEBP, JPEG, or PNG. Images are compressed and uploaded as WEBP.
            </p>
          </div>

          <div className="field">
            <label htmlFor="media-alt">Alt Text</label>
            <input
              disabled={!mayUpload || isUploading}
              id="media-alt"
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe the image for people using assistive technology"
              required
              value={altText}
            />
          </div>

          <label className="checkbox-row">
            <input
              checked={isPublic && mayManageMedia}
              disabled={!mayManageMedia || isUploading}
              onChange={(event) => setIsPublic(event.target.checked)}
              type="checkbox"
            />
            <span>Make public after upload</span>
          </label>

          {!mayManageMedia && (
            <p className="help-text">
              Your role can upload private assets, but public approval is limited
              to admins with media management permission.
            </p>
          )}

          {selectedFile && (
            <div className="upload-summary">
              <strong>{selectedFile.name}</strong>
              <span>{formatBytes(selectedFile.size)}</span>
            </div>
          )}

          {uploadError && <div className="error">{uploadError}</div>}
          {successMessage && <div className="success">{successMessage}</div>}

          <button className="button" disabled={!mayUpload || isUploading} type="submit">
            {isUploading ? "Optimizing and Uploading..." : "Upload Optimized Image"}
          </button>
        </form>
      )}

      <section className="card media-toolbar" aria-label="Media filters">
        <input
          aria-label="Search media"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search filename, alt text, uploader, or type"
          type="search"
          value={searchTerm}
        />

        <select
          aria-label="Filter by visibility"
          onChange={(event) =>
            setVisibilityFilter(event.target.value as VisibilityFilter)
          }
          value={visibilityFilter}
        >
          <option value="all">All media</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <div className="segmented-control" aria-label="View mode">
          <button
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            Grid
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
            type="button"
          >
            List
          </button>
        </div>
      </section>

      {libraryError && <div className="error">{libraryError}</div>}

      {loading ? (
        <div className="card">Loading media...</div>
      ) : filteredAssets.length === 0 ? (
        <div className="card empty-state">No media assets match this view.</div>
      ) : (
        <section
          className={viewMode === "grid" ? "media-grid" : "media-list"}
          aria-label="Media assets"
        >
          {filteredAssets.map((asset) => (
            <article className="media-card" key={asset.id}>
              <img src={asset.url} alt={asset.altText} loading="lazy" />

              <div className="media-card-body">
                <div>
                  <h2>{asset.originalFilename}</h2>
                  <p className="muted">
                    {asset.width} x {asset.height} · {formatBytes(asset.size)}
                  </p>
                  <span className={asset.public ? "badge public" : "badge"}>
                    {asset.public ? "Public" : "Private"}
                  </span>
                </div>

                {editingAssetId === asset.id ? (
                  <div className="stack compact">
                    <input
                      aria-label={`Alt text for ${asset.originalFilename}`}
                      onChange={(event) => setDraftAltText(event.target.value)}
                      value={draftAltText}
                    />
                    <div className="button-row">
                      <button
                        className="button"
                        disabled={savingAssetId === asset.id}
                        onClick={() => handleSaveAltText(asset)}
                        type="button"
                      >
                        Save Alt Text
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => setEditingAssetId(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>{asset.altText}</p>
                )}

                <div className="button-row">
                  <button
                    className="button secondary"
                    onClick={() => handleCopyUrl(asset)}
                    type="button"
                  >
                    {copiedAssetId === asset.id ? "Copied" : "Copy URL"}
                  </button>

                  {mayUpload && (!asset.public || mayManageMedia) && editingAssetId !== asset.id && (
                    <button
                      className="button secondary"
                      onClick={() => startEditingAltText(asset)}
                      type="button"
                    >
                      Edit Alt
                    </button>
                  )}

                  {mayManageMedia && (
                    <button
                      className="button danger"
                      disabled={deletingAssetId === asset.id}
                      onClick={() => handleDelete(asset)}
                      type="button"
                    >
                      {deletingAssetId === asset.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
