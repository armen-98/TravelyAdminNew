"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  useAdminLocationTree,
  useCreateAdminLocation,
  useUpdateAdminLocation,
  useDeleteAdminLocation,
} from "@/hooks/use-admin-locations";
import { useUploadFile } from "@/hooks/use-files";
import type { AdminLocationNode } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronRight,
  Globe2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function statesWithCountryLabels(tree: AdminLocationNode[]) {
  const out: { id: number; label: string }[] = [];
  for (const c of tree) {
    for (const s of c.children ?? []) {
      out.push({ id: s.id, label: `${s.name} (${c.name})` });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

type DialogState =
  | { mode: "closed" }
  | {
      mode: "create";
      type: "country" | "state" | "city";
      parentId?: number;
    }
  | { mode: "edit"; node: AdminLocationNode };

type UploadResponse = { data: { id: number; url?: string } };

function LocationCoverImageFields({
  formImageId,
  setFormImageId,
  imagePreviewUrl,
  setImagePreviewUrl,
  onUploadFile,
  uploading,
  idSuffix,
}: {
  formImageId: string;
  setFormImageId: (v: string) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (v: string | null) => void;
  onUploadFile: (file: File) => Promise<void>;
  uploading: boolean;
  idSuffix: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-2">
      <Label>Cover image (optional)</Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!file.type.startsWith("image/")) {
              toast.error("Please choose an image file.");
              return;
            }
            await onUploadFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1.5" />
          )}
          Upload
        </Button>
        <span className="text-xs text-muted-foreground">or ID</span>
        <Input
          id={`loc-image-id-${idSuffix}`}
          className="h-9 w-28 font-mono text-xs"
          value={formImageId}
          onChange={(e) => {
            setFormImageId(e.target.value);
            setImagePreviewUrl(null);
          }}
          placeholder="File ID"
        />
      </div>
      {imagePreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagePreviewUrl}
          alt=""
          className="h-20 w-28 object-cover rounded-md border mt-1"
        />
      ) : null}
    </div>
  );
}

function countCitiesInCountry(country: AdminLocationNode): number {
  return (country.children ?? []).reduce(
    (acc, s) => acc + (s.children?.length ?? 0),
    0
  );
}

export default function LocationsPage() {
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(
    null
  );
  const [formName, setFormName] = useState("");
  const [formCountryCode, setFormCountryCode] = useState("");
  const [formImageId, setFormImageId] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [formParentId, setFormParentId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<AdminLocationNode | null>(
    null
  );

  const { data: tree, isLoading } = useAdminLocationTree();
  const create = useCreateAdminLocation();
  const update = useUpdateAdminLocation();
  const del = useDeleteAdminLocation();
  const uploadFile = useUploadFile();

  const stateOptions = useMemo(() => statesWithCountryLabels(tree ?? []), [tree]);

  const activeCountry = useMemo(() => {
    if (selectedCountryId == null || !tree) return null;
    return tree.find((c) => c.id === selectedCountryId) ?? null;
  }, [tree, selectedCountryId]);

  useEffect(() => {
    if (selectedCountryId != null && tree && !tree.some((c) => c.id === selectedCountryId)) {
      setSelectedCountryId(null);
    }
  }, [tree, selectedCountryId]);

  useEffect(() => {
    if (dialog.mode === "closed") return;
    if (dialog.mode === "create") {
      setFormName("");
      setFormCountryCode("");
      setFormImageId("");
      setFormParentId("");
      setImagePreviewUrl(null);
      return;
    }
    const n = dialog.node;
    setFormName(n.name);
    setFormCountryCode(
      n.type === "country" && n.countryCode ? String(n.countryCode) : ""
    );
    const hasImageId =
      (n.type === "country" || n.type === "city") && n.imageId != null;
    setFormImageId(hasImageId ? String(n.imageId!) : "");
    setImagePreviewUrl(
      (n.type === "country" || n.type === "city") && n.image?.url
        ? n.image.url
        : null
    );
    if (n.type === "state") {
      setFormParentId(n.parentId != null ? String(n.parentId) : "");
    } else if (n.type === "city") {
      setFormParentId(n.parentId != null ? String(n.parentId) : "");
    } else {
      setFormParentId("");
    }
  }, [dialog]);

  const closeDialog = () => {
    setDialog({ mode: "closed" });
    setImagePreviewUrl(null);
  };

  const handleLocationImageUpload = async (file: File) => {
    const res = (await uploadFile.mutateAsync({
      file,
      folder: "locations",
    })) as UploadResponse;
    const row = res?.data;
    if (row?.id != null) {
      setFormImageId(String(row.id));
      if (row.url) setImagePreviewUrl(row.url);
    }
  };

  const handleSubmit = () => {
    const name = formName.trim();
    if (!name) return;

    const codeRaw = formCountryCode.trim().toUpperCase();
    if (codeRaw.length === 1) {
      toast.error("Country code must be 2 letters (e.g. AM) or empty.");
      return;
    }

    if (dialog.mode === "create") {
      if (dialog.type === "country") {
        const t = formImageId.trim();
        const img =
          t === "" ? undefined : Number(t);
        const payload: {
          name: string;
          type: "country";
          imageId?: number | null;
          countryCode?: string;
        } = { name, type: "country" };
        if (t !== "" && Number.isFinite(img)) payload.imageId = img;
        if (codeRaw.length === 2) payload.countryCode = codeRaw;
        create.mutate(payload, { onSuccess: closeDialog });
        return;
      }
      if (dialog.type === "state" && dialog.parentId != null) {
        create.mutate(
          { name, type: "state", parentId: dialog.parentId },
          { onSuccess: closeDialog }
        );
        return;
      }
      if (dialog.type === "city" && dialog.parentId != null) {
        const t = formImageId.trim();
        const payload: {
          name: string;
          type: "city";
          parentId: number;
          imageId?: number | null;
        } = { name, type: "city", parentId: dialog.parentId };
        if (t !== "") {
          const img = Number(t);
          if (Number.isFinite(img)) payload.imageId = img;
        }
        create.mutate(payload, { onSuccess: closeDialog });
      }
      return;
    }

    if (dialog.mode === "edit") {
      const node = dialog.node;
      const body: {
        name: string;
        parentId?: number;
        imageId?: number | null;
        countryCode?: string | null;
      } = { name };

      if (node.type === "country" || node.type === "city") {
        const t = formImageId.trim();
        if (t === "") body.imageId = null;
        else {
          const n = Number(t);
          if (Number.isFinite(n)) body.imageId = n;
        }
      }

      if (node.type === "country") {
        if (codeRaw.length === 0) body.countryCode = null;
        else if (codeRaw.length === 2) body.countryCode = codeRaw;
      }

      if (node.type === "state" && formParentId) {
        body.parentId = Number(formParentId);
      }
      if (node.type === "city" && formParentId) {
        body.parentId = Number(formParentId);
      }

      update.mutate(
        { id: node.id, body },
        { onSuccess: closeDialog }
      );
    }
  };

  const dialogBusy =
    create.isPending || update.isPending || uploadFile.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100">
            <Globe2 className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Locations</h1>
            <p className="text-muted-foreground text-sm">
              Select a country to manage its states and cities
            </p>
          </div>
        </div>
        <Button onClick={() => setDialog({ mode: "create", type: "country" })}>
          <Plus className="mr-2 h-4 w-4" />
          Add country
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
          ))}
        </div>
      ) : tree && tree.length > 0 ? (
        <Card>
          <CardContent className="p-2 sm:p-3">
            <ul className="divide-y divide-border rounded-lg border bg-card overflow-hidden">
              {tree.map((country) => {
                const nStates = country.children?.length ?? 0;
                const nCities = countCitiesInCountry(country);
                return (
                  <li
                    key={country.id}
                    className="flex items-stretch min-h-[4.5rem] divide-x divide-border"
                  >
                    <button
                      type="button"
                      className="flex-1 flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-w-0"
                      onClick={() => setSelectedCountryId(country.id)}
                    >
                      {country.image?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={country.image.url}
                          alt=""
                          className="h-14 w-[4.5rem] object-cover rounded-md border shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-[4.5rem] rounded-md border bg-muted flex items-center justify-center shrink-0">
                          <MapPin className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold truncate">{country.name}</p>
                          {country.countryCode ? (
                            <Badge
                              variant="secondary"
                              className="shrink-0 font-mono text-[0.65rem] px-1.5 py-0"
                            >
                              {country.countryCode}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {nStates} {nStates === 1 ? "state" : "states"}
                          <span className="mx-1.5">·</span>
                          {nCities} {nCities === 1 ? "city" : "cities"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                    </button>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 p-1.5 bg-muted/30 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0"
                        aria-label={`Edit ${country.name}`}
                        onClick={() =>
                          setDialog({ mode: "edit", node: country })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                        aria-label={`Delete ${country.name}`}
                        onClick={() => setDeleteTarget(country)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Globe2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No countries yet. Add a country to get started.</p>
          </CardContent>
        </Card>
      )}

      <Sheet
        open={selectedCountryId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedCountryId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg flex flex-col gap-0 p-0 h-full max-h-[100dvh]"
        >
          {activeCountry ? (
            <>
              <div className="p-6 pb-4 border-b shrink-0 space-y-4">
                <SheetHeader className="space-y-3 text-left pr-8">
                  <div className="flex items-start gap-3">
                    {activeCountry.image?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeCountry.image.url}
                        alt=""
                        className="h-16 w-24 object-cover rounded-lg border shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-24 rounded-lg border bg-muted shrink-0 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="text-xl leading-tight">
                        {activeCountry.name}
                      </SheetTitle>
                      <SheetDescription>
                        {activeCountry.countryCode ? (
                          <span className="font-mono font-medium text-foreground">
                            ISO {activeCountry.countryCode}
                          </span>
                        ) : (
                          <span>No ISO country code set.</span>
                        )}
                        <span className="block mt-1 text-muted-foreground font-normal">
                          States and cities used when users pick a location for
                          places.
                        </span>
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDialog({ mode: "edit", node: activeCountry })
                    }
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit country
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      setDialog({
                        mode: "create",
                        type: "state",
                        parentId: activeCountry.id,
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add state
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 p-6 pt-4">
                {(activeCountry.children ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg border-dashed">
                    No states yet. Add a state to add cities under it.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {(activeCountry.children ?? []).map((state) => (
                      <div
                        key={state.id}
                        className="rounded-lg border bg-card p-3 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">
                              {state.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              State
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() =>
                                setDialog({ mode: "edit", node: state })
                              }
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8"
                              onClick={() =>
                                setDialog({
                                  mode: "create",
                                  type: "city",
                                  parentId: state.id,
                                })
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              City
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive"
                              onClick={() => setDeleteTarget(state)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <ul className="text-sm pl-2 border-l-2 border-muted space-y-1 ml-1">
                          {(state.children ?? []).length === 0 ? (
                            <li className="text-muted-foreground py-1">
                              No cities
                            </li>
                          ) : (
                            (state.children ?? []).map((city) => (
                              <li
                                key={city.id}
                                className="flex flex-wrap items-center justify-between gap-2 py-1"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {city.image?.url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={city.image.url}
                                      alt=""
                                      className="h-8 w-11 object-cover rounded border shrink-0"
                                    />
                                  ) : (
                                    <div className="h-8 w-11 rounded border bg-muted/60 shrink-0" />
                                  )}
                                  <span className="truncate">{city.name}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2"
                                    onClick={() =>
                                      setDialog({ mode: "edit", node: city })
                                    }
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-destructive"
                                    onClick={() => setDeleteTarget(city)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6">
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={dialog.mode !== "closed"}
        onOpenChange={(o) => !o && closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "create" && dialog.type === "country" && "New country"}
              {dialog.mode === "create" && dialog.type === "state" && "New state"}
              {dialog.mode === "create" && dialog.type === "city" && "New city"}
              {dialog.mode === "edit" && `Edit ${dialog.node.type}`}
            </DialogTitle>
            <DialogDescription>
              {dialog.mode === "create" && dialog.type === "state" && (
                <>Parent country is set from where you clicked.</>
              )}
              {dialog.mode === "create" && dialog.type === "city" && (
                <>Parent state is set from where you clicked.</>
              )}
              {dialog.mode === "edit" &&
                (dialog.node.type === "country" ||
                  dialog.node.type === "city") && (
                <>
                  Upload a cover image or set a file ID. Clear the ID and save
                  to remove the image.
                </>
              )}
              {dialog.mode === "create" && dialog.type === "country" && (
                <>Optional cover image for this country.</>
              )}
              {dialog.mode === "create" && dialog.type === "city" && (
                <>Optional cover image for this city.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="loc-name">Name</Label>
              <Input
                id="loc-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Name"
              />
            </div>
            {((dialog.mode === "create" && dialog.type === "country") ||
              (dialog.mode === "edit" && dialog.node.type === "country")) && (
              <div className="grid gap-2">
                <Label htmlFor="loc-country-code">ISO country code (optional)</Label>
                <Input
                  id="loc-country-code"
                  className="font-mono uppercase max-w-[8rem]"
                  maxLength={2}
                  value={formCountryCode}
                  onChange={(e) =>
                    setFormCountryCode(
                      e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase()
                    )
                  }
                  placeholder="e.g. AM"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Two-letter code (ISO 3166-1 alpha-2). Clear to remove.
                </p>
              </div>
            )}
            {dialog.mode === "create" && dialog.type === "country" && (
              <LocationCoverImageFields
                formImageId={formImageId}
                setFormImageId={setFormImageId}
                imagePreviewUrl={imagePreviewUrl}
                setImagePreviewUrl={setImagePreviewUrl}
                onUploadFile={handleLocationImageUpload}
                uploading={uploadFile.isPending}
                idSuffix="create-country"
              />
            )}
            {dialog.mode === "create" && dialog.type === "city" && (
              <LocationCoverImageFields
                formImageId={formImageId}
                setFormImageId={setFormImageId}
                imagePreviewUrl={imagePreviewUrl}
                setImagePreviewUrl={setImagePreviewUrl}
                onUploadFile={handleLocationImageUpload}
                uploading={uploadFile.isPending}
                idSuffix="create-city"
              />
            )}
            {dialog.mode === "edit" && dialog.node.type === "country" && (
              <LocationCoverImageFields
                formImageId={formImageId}
                setFormImageId={setFormImageId}
                imagePreviewUrl={imagePreviewUrl}
                setImagePreviewUrl={setImagePreviewUrl}
                onUploadFile={handleLocationImageUpload}
                uploading={uploadFile.isPending}
                idSuffix="edit-country"
              />
            )}
            {dialog.mode === "edit" && dialog.node.type === "city" && (
              <LocationCoverImageFields
                formImageId={formImageId}
                setFormImageId={setFormImageId}
                imagePreviewUrl={imagePreviewUrl}
                setImagePreviewUrl={setImagePreviewUrl}
                onUploadFile={handleLocationImageUpload}
                uploading={uploadFile.isPending}
                idSuffix="edit-city"
              />
            )}
            {dialog.mode === "edit" && dialog.node.type === "state" && tree && (
              <div className="grid gap-2">
                <Label>Country</Label>
                <Select value={formParentId} onValueChange={setFormParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {tree.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dialog.mode === "edit" && dialog.node.type === "city" && (
              <div className="grid gap-2">
                <Label>State</Label>
                <Select value={formParentId} onValueChange={setFormParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {stateOptions.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                dialogBusy ||
                !formName.trim() ||
                (dialog.mode === "edit" &&
                  dialog.node.type === "state" &&
                  !formParentId) ||
                (dialog.mode === "edit" &&
                  dialog.node.type === "city" &&
                  !formParentId)
              }
            >
              {dialogBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : dialog.mode === "create" ? (
                "Create"
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be removed. You cannot delete a location that still has children or is linked to places.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  del.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  });
                }
              }}
            >
              {del.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
