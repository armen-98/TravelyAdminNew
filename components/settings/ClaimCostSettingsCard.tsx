"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useClaimCostSetting,
  useUpdateClaimCostSetting,
} from "@/hooks/use-claims";

export function ClaimCostSettingsCard() {
  const { data: claimCost, isLoading } = useClaimCostSetting();
  const updateMutation = useUpdateClaimCostSetting();
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (claimCost == null) {
      setEnabled(false);
      setValue("");
    } else {
      setEnabled(true);
      setValue(String(claimCost));
    }
  }, [claimCost]);

  const onSave = async () => {
    try {
      const payload = enabled
        ? value.trim() === ""
          ? null
          : Math.max(0, Number(value))
        : null;
      if (enabled && payload != null && !Number.isFinite(payload)) {
        toast.error("Enter a valid claim cost or disable the fee");
        return;
      }
      await updateMutation.mutateAsync(payload);
      toast.success("Claim cost saved");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save claim cost");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Place claim fee</CardTitle>
        <CardDescription>
          Optional fee shown on the web claim form. Payment collection is not
          enabled yet — leave empty for free claims.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                id="claimCostEnabled"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="claimCostEnabled">Require claim fee (USD)</Label>
            </div>
            {enabled ? (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="claimCost">Amount</Label>
                <Input
                  id="claimCost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ) : null}
            <Button
              type="button"
              onClick={onSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save claim settings"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
