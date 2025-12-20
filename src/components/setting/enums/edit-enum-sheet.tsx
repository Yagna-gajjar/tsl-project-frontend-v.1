import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createEnum, updateEnum, deleteEnum } from "@/api/enums.api";
import { toast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";
import type { Enums as EnumItem } from "@/types/enums";
import { getAccounts } from "@/api/account.api";
import type { Response } from "@/types/response";
import type { Account } from "@/types/account";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	initialData: EnumItem | null;
	initialCategory: string;
	onSaved: () => void;
}

export function EditEnumSheet({ isOpen, onClose, initialData, initialCategory, onSaved }: Props) {
	const isEdit = !!initialData;
	const [loading, setLoading] = useState(false);

	const [fetchedAccounts, setFetchedAccounts] = useState<Account[]>([]);

	const [formData, setFormData] = useState<Partial<EnumItem>>({
		category: "",
		value: "",
		description: "",
		enumCase: 0,
		status: true
	});

	const isAccountCategory = (cat: string | undefined) =>
		cat === "casual_account" || cat === "walking_account";

	useEffect(() => {
		async function fetchAccounts(searchTerm: string) {
			try {
				const res: Response<Account[]> = await getAccounts({
					name: searchTerm
				});

				if (res.success) {
					setFetchedAccounts(res?.data || []);
				} else {
					setFetchedAccounts([]);
				}
			} catch {
				toast({
					title: "Error",
					description: `Failed to fetch ${searchTerm} accounts.`,
					variant: "destructive"
				});
			}
		}

		const currentCategory = initialData?.category || initialCategory || formData.category;

		if (currentCategory === "casual_account") {
			fetchAccounts("casual");
		} else if (currentCategory === "walking_account") {
			fetchAccounts("walking");
		} else {
			setFetchedAccounts([]);
		}

	}, [initialData, initialCategory, formData.category]);

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				setFormData({ ...initialData });
			} else {
				setFormData({
					category: initialCategory,
					value: "",
					description: "",
					enumCase: 0,
					status: true
				});
			}
		}
	}, [isOpen, initialData, initialCategory]);

	const handleSave = async () => {
		setLoading(true);
		
		try {
      const payload = {
        category: formData.category,
        value: formData.value,
        description: formData.description,
        enumCase: formData.enumCase,
        status: formData.status,
      };

      let res: any;
      if (isEdit && initialData?.id) {
        res = await updateEnum(initialData.id, payload);
      } else {
        console.log(payload);
        res = await createEnum(payload as any);
      }

      if (res?.success) {
        toast({
          title: "Success",
          description: "Saved successfully",
          variant: "success",
        });
        onSaved();
        onClose();
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
	};

	const handleDelete = async () => {
		if (!initialData?.id) return;
		setLoading(true);
		try {
			await deleteEnum(initialData.id);
			toast({ title: "Deleted", description: "Item removed successfully", variant: "success" });
			onSaved();
			onClose();
		} catch {
			toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Enum" : "New Enum"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update details for this lookup value."
              : "Add a new lookup value to the system."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Category Input */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              placeholder="e.g. UserRole"
            />
            <p className="text-[11px] text-muted-foreground">
              Changing this will move the item to a different group.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Item</Label>

            {isAccountCategory(formData.category) ? (
              <Select
                value={formData.value}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, value: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {fetchedAccounts.length > 0 ? (
                    fetchedAccounts.map((acc) => (
                      <SelectItem
                        key={acc.accountId}
                        value={String(acc.accountId)}
                      >
                        {acc.name || `Account ${acc.accountId}`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No accounts found
                    </div>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="value"
                value={formData.value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, value: e.target.value }))
                }
                placeholder="e.g. Admin"
              />
            )}

            {isAccountCategory(formData.category) && (
              <p className="text-[11px] text-muted-foreground">
                Selected Account ID will be saved as the Enum Value.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description..."
              className="resize-none h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enumCase">Value</Label>
            <Input
              id="desc"
              value={formData.enumCase == 0 ? "0" : formData.enumCase || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  enumCase: Number(e.target.value),
                }))
              }
              placeholder="enumCase... default 0"
              className="h-10"
            />
          </div>

          <div className="flex items-center justify-between border p-3 rounded-lg bg-slate-50 dark:bg-zinc-900">
            <div className="space-y-0.5">
              <Label>Status</Label>
              <div className="text-[12px] text-muted-foreground">
                {formData.status
                  ? "Active (Visible in app)"
                  : "Inactive (Hidden)"}
              </div>
            </div>
            <Switch
              checked={formData.status}
              onCheckedChange={(c) =>
                setFormData((prev) => ({ ...prev, status: c }))
              }
            />
          </div>
        </div>

        <SheetFooter className="flex justify-between items-center sm:justify-between gap-2">
          {isEdit ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !formData.category || !formData.value}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}