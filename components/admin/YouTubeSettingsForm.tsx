"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ExternalLink, Save, Youtube } from "lucide-react";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/Button";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { getYouTubeChannelUrl, getYouTubeLiveUrl } from "@/lib/youtube";
import type { YoutubeSettingsConfig } from "@/types/settings";

type YouTubeSettingsFormProps = {
  initialSettings: YoutubeSettingsConfig;
  apiConfigured: boolean;
};

type FormState = {
  channelId: string;
  channelUrl: string;
  liveStreamUrl: string;
  uploadsPlaylistId: string;
  featuredVideoId: string;
  autoFetchLatestSermons: boolean;
  showLiveBanner: boolean;
};

function formStateFromSettings(settings: YoutubeSettingsConfig): FormState {
  return {
    channelId: settings.channelId,
    channelUrl: settings.channelUrl,
    liveStreamUrl: settings.liveStreamUrl ?? "",
    uploadsPlaylistId: settings.uploadsPlaylistId ?? "",
    featuredVideoId: settings.featuredVideoId ?? "",
    autoFetchLatestSermons: settings.autoFetchLatestSermons,
    showLiveBanner: settings.showLiveBanner,
  };
}

function payloadFromForm(form: FormState): YoutubeSettingsConfig {
  const optional = (value: string) => {
    const cleaned = value.trim();
    return cleaned ? cleaned : null;
  };

  return {
    channelId: form.channelId.trim(),
    channelUrl: form.channelUrl.trim(),
    liveStreamUrl: optional(form.liveStreamUrl),
    uploadsPlaylistId: optional(form.uploadsPlaylistId),
    featuredVideoId: optional(form.featuredVideoId),
    autoFetchLatestSermons: form.autoFetchLatestSermons,
    showLiveBanner: form.showLiveBanner,
  };
}

export function YouTubeSettingsForm({
  initialSettings,
  apiConfigured,
}: YouTubeSettingsFormProps) {
  const [form, setForm] = useState<FormState>(() => formStateFromSettings(initialSettings));
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  const previewSettings = useMemo(() => payloadFromForm(form), [form]);
  const channelUrl = getYouTubeChannelUrl(previewSettings);
  const liveUrl = getYouTubeLiveUrl(previewSettings);

  const updateText =
    (field: keyof Pick<FormState, "channelId" | "channelUrl" | "liveStreamUrl" | "uploadsPlaylistId" | "featuredVideoId">) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const updateToggle =
    (field: keyof Pick<FormState, "autoFetchLatestSermons" | "showLiveBanner">) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.checked }));
    };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!authReady) {
      setError("Admin session is still loading. Please try again in a moment.");
      return;
    }

    setSaving(true);

    try {
      const token = user ? await user.getIdToken() : null;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/youtube", {
        method: "POST",
        headers,
        body: JSON.stringify(payloadFromForm(form)),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Could not save YouTube settings.");
      }

      setMessage("YouTube settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save YouTube settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5">
          <FormField
            id="channelId"
            label="Channel ID"
            description="Example: UC... from the church YouTube channel URL."
          >
            <TextInput
              id="channelId"
              value={form.channelId}
              onChange={updateText("channelId")}
              placeholder="UC..."
            />
          </FormField>

          <FormField
            id="channelUrl"
            label="Channel URL"
            description="Used for the fallback channel button across the public site."
          >
            <TextInput
              id="channelUrl"
              type="url"
              value={form.channelUrl}
              onChange={updateText("channelUrl")}
              placeholder="https://www.youtube.com/@stonehillsda"
            />
          </FormField>

          <FormField
            id="liveStreamUrl"
            label="Livestream URL"
            description="Use a scheduled live video URL, a channel live URL, or leave blank to use the channel fallback."
          >
            <TextInput
              id="liveStreamUrl"
              type="url"
              value={form.liveStreamUrl}
              onChange={updateText("liveStreamUrl")}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="uploadsPlaylistId"
              label="Uploads Playlist ID"
              description="Usually starts with UU."
            >
              <TextInput
                id="uploadsPlaylistId"
                value={form.uploadsPlaylistId}
                onChange={updateText("uploadsPlaylistId")}
                placeholder="UU..."
              />
            </FormField>

            <FormField
              id="featuredVideoId"
              label="Featured Video ID"
              description="Used when no specific livestream video is configured."
            >
              <TextInput
                id="featuredVideoId"
                value={form.featuredVideoId}
                onChange={updateText("featuredVideoId")}
                placeholder="11-character video ID"
              />
            </FormField>
          </div>

          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <CheckboxField
              id="showLiveBanner"
              checked={form.showLiveBanner}
              onChange={updateToggle("showLiveBanner")}
              label="Show live banner"
              description="Shows a livestream callout on the public site."
            />
            <CheckboxField
              id="autoFetchLatestSermons"
              checked={form.autoFetchLatestSermons}
              onChange={updateToggle("autoFetchLatestSermons")}
              label="Auto-fetch latest sermons"
              description="Uses the YouTube Data API and uploads playlist to show recent videos."
            />
          </div>

          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-900/65">
              {authReady && !user
                ? "Your secure admin session cookie will be used to save changes."
                : "Changes are stored in youtubeSettings/default."}
            </p>
            <Button type="submit" disabled={saving || !authReady}>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {saving ? "Saving..." : "Save YouTube Settings"}
            </Button>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-stonehill-primary">
            <Youtube className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Connection</h2>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-900">YouTube API key</dt>
              <dd className={apiConfigured ? "text-green-700" : "text-slate-900/65"}>
                {apiConfigured ? "Configured in environment" : "Not configured"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Latest videos</dt>
              <dd className="text-slate-900/65">
                {form.autoFetchLatestSermons
                  ? "Enabled when API key and uploads playlist are present"
                  : "Manual sermon records will be used as fallback"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stonehill-primary">Public Links</h2>
          <div className="mt-5 grid gap-3">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 hover:border-stonehill-primary hover:text-stonehill-primary"
            >
              Livestream fallback
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 hover:border-stonehill-primary hover:text-stonehill-primary"
            >
              Channel fallback
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </aside>
    </form>
  );
}
