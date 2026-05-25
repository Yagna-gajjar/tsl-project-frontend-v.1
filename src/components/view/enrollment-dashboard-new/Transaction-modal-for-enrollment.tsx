"use client"

import React, { useState, useEffect } from 'react'
import { X, ReceiptIndianRupee, Loader2, Hash, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { getAccounts } from '@/api/account.api'
import type { Account } from '@/types/account'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/authContext'

interface TransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialData: any;
	setPaymentData: (data: any) => void;
}

export const TransactionModalForEnrollment = ({ isOpen, onClose, initialData, setPaymentData }: TransactionModalProps) => {
	const { user } = useAuth();
	const [formData, setFormData] = useState<any>(null);
	const [drAccounts, setDrAccounts] = useState<Account[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchTransactionAccounts = async (entityId: number) => {
		setIsLoading(true);
		try {
			const res = await getAccounts({ entityId: entityId || 1, limit: 100 });
			const data = res.data ?? [];
			const filtered = data.filter((acc: Account) =>
				/cash|bank|transaction|upi|online/i.test(acc.accountName)
			);
			setDrAccounts(filtered);
		} catch (error) {
			toast({
				title: "Error fetching accounts",
				description: "Unable to load accounts for transaction.",
				variant: "destructive"
			})
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		if (isOpen && initialData) {
			setFormData({
				...initialData,
				drAccountId: initialData.drAccountId ? String(initialData.drAccountId) : "",
				typeSerialNo: initialData.typeSerialNo || 0,
				formReferenceNo: initialData.formReferenceNo || "",
				printRemarks: initialData.printRemarks || "",
				adminRemarks: initialData.adminRemarks || "",
				accApproval: initialData.accApproval || false
			});
			fetchTransactionAccounts(initialData.drEntityId);
		}
	}, [isOpen, initialData]);

	const handleChange = (field: string, value: any) => {
		setFormData((p: any) => ({ ...p, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const finalPayload = {
			...formData,
			drAccountId: Number(formData.drAccountId),
			typeSerialNo: Number(formData.typeSerialNo),
			createdBy: user?.userId || null
		};
		setPaymentData(finalPayload);
		onClose();
	};

	if (!isOpen || !formData) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
			<div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200">

				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
					<div className="flex items-center gap-2 font-bold text-slate-700">
						<ReceiptIndianRupee size={18} className="text-blue-600" />
						<span>Transaction Details</span>
					</div>
					<button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-5">

					{/* Financial Row */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Amount</Label>
							<Input
								value={`₹${formData.amount}`}
								disabled
								className="bg-slate-50 font-mono font-bold text-blue-700 border-slate-200 h-9"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Payment Mode</Label>
							<Select
								value={formData.drAccountId}
								onValueChange={(val) => handleChange('drAccountId', val)}
							>
								<SelectTrigger className="w-full border-slate-200 focus:ring-blue-500 h-9">
									<SelectValue placeholder={isLoading ? "Loading..." : "Select Mode"} />
								</SelectTrigger>
								<SelectContent className="z-[110]">
									{isLoading ? (
										<div className="flex items-center justify-center p-4">
											<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
										</div>
									) : drAccounts.length > 0 ? (
										drAccounts.map((acc) => (
											<SelectItem key={acc.accountId} value={String(acc.accountId)}>
												{acc.accountName}
											</SelectItem>
										))
									) : (
										<div className="p-2 text-xs text-center text-slate-400">No accounts found</div>
									)}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Identity & Reference Row */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
								<Hash size={10} /> Type Serial No
							</Label>
							<Input
								type="number"
								className="text-xs border-slate-200 h-9"
								value={formData.typeSerialNo}
								onChange={(e) => handleChange('typeSerialNo', e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
								<FileText size={10} /> Form Ref No
							</Label>
							<Input
								className="text-xs border-slate-200 h-9"
								value={formData.formReferenceNo}
								onChange={(e) => handleChange('formReferenceNo', e.target.value)}
								placeholder="Ref #"
							/>
						</div>
					</div>

					{/* Transaction Details */}
					<div className="space-y-1.5">
						<Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Notes / Details</Label>
						<Input
							value={formData.transactionDetails}
							onChange={(e) => handleChange('transactionDetails', e.target.value)}
							placeholder="Brief description of payment..."
							className="border-slate-200 h-9"
						/>
					</div>

					{/* Remarks Grid */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Print Remarks</Label>
							<Input
								className="text-xs border-slate-200 h-9"
								value={formData.printRemarks}
								onChange={(e) => handleChange('printRemarks', e.target.value)}
								placeholder="For Invoice"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Admin Remarks</Label>
							<Input
								className="text-xs border-slate-200 h-9"
								value={formData.adminRemarks}
								onChange={(e) => handleChange('adminRemarks', e.target.value)}
								placeholder="Internal use"
							/>
						</div>
					</div>

					{/* Checkbox */}
					<div className="flex items-center space-x-2 py-1">
						<Checkbox
							id="audit"
							checked={formData.accApproval}
							onCheckedChange={(checked) => handleChange('accApproval', !!checked)}
							className="border-slate-300"
						/>
						<label htmlFor="audit" className="text-xs font-medium text-slate-500 cursor-pointer">
							Account Approval
						</label>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-4 border-t">
						<Button type="button" variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-bold">
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!formData.drAccountId}
							className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-xs font-bold shadow-md"
						>
							Save Transaction
						</Button>
					</div>	
				</form>
			</div>
		</div>
	)
}