import React from 'react';
import * as XLSX from 'xlsx';
import type { Enrollment } from '@/types/enrollment';

interface Props {
	enrollmentData?: Enrollment;
}

const ExcelInvoice = ({
	enrollmentData
}: Props) => {
	const colWidths = [120, 110, 20, 130, 100, 20, 110, 60, 60, 120];

	// Helper to handle numeric calculations safely
	const n = (val: any) => Number(val) || 0;

	const handleExport = () => {
		const wb = XLSX.utils.book_new();
		const data = Array(33).fill(null).map(() => Array(10).fill(""));

		// --- SECTION 1: HEADER ---
		data[0][8] = "Enr No"; data[0][9] = enrollmentData?.enrollmentNo ?? "-";
		data[1][8] = "Date"; data[1][9] = enrollmentData?.enrollmentDate ?? "-";
		data[2][8] = "Enr ID"; data[2][9] = enrollmentData?.enrollmentId ?? "-";
		data[0][3] = "BOOKING DETAILS";
		data[2][3] = "Debit Note";

		// --- SECTION 2: PERSONAL & SERVICE ---
		data[4][0] = "Reg No"; data[4][1] = enrollmentData?.member?.memberId ?? "-";
		data[4][2] = "Booking Done By";
		data[4][4] = `${enrollmentData?.walkingName ?? ""} ${enrollmentData?.walkingContact ?? ""}`;

		data[5][0] = "Reg No"; data[5][1] = enrollmentData?.member?.memberId ?? "-";
		data[5][2] = "User Name";
		data[5][4] = enrollmentData?.member?.memberFirstName ?? "-";
		data[5][8] = `Age: ${enrollmentData?.member?.dob ?? "-"}`;

		data[6][0] = "Member A/C"; data[6][1] = enrollmentData?.accountName ?? "-";
		data[6][2] = "member debited A/c"; data[6][4] = enrollmentData?.accountId ?? "-";
		data[6][8] = enrollmentData?.accountName ? `${enrollmentData.accountName} Type` : "-";

		data[7][0] = "MS No"; data[7][1] = enrollmentData?.membershipMasterId ?? "-";
		data[7][2] = "Membership Details"; data[7][4] = "Premium Membership"; data[7][8] = enrollmentData?.membershipMasterId ?? "-";

		data[9][0] = "RSCA Ac No"; data[9][1] = enrollmentData?.course?.entityId ?? "-";
		data[9][2] = "Service Provider"; data[9][4] = enrollmentData?.course?.entityName ?? "-";
		data[10][0] = "Code"; data[10][1] = enrollmentData?.rackPrice ?? "-";
		data[10][2] = "Service Name"; data[10][4] = enrollmentData?.course?.courseName ?? "-";
		data[10][9] = enrollmentData?.course?.activityId ?? "-";

		// --- SECTION 3: ATTENDANCE & TIMELINE ---
		data[12][0] = enrollmentData?.attendingPattern ?? "-";
		data[12][3] = "Billing Pattern"; data[12][4] = enrollmentData?.course?.chargingPattern ?? "-";
		data[12][6] = "Members"; data[12][7] = "Signature"; data[12][8] = "For TSL";

		data[13][3] = "No Of Participants"; data[13][4] = enrollmentData?.membersEnrolled ?? 1;
		data[13][6] = enrollmentData?.academyApprovalStatus ?? "Pending";
		data[13][8] = "Authorized Signatory";

		data[14][0] = "Calendar Days"; data[14][1] = enrollmentData?.permittedDays ?? "-";
		data[14][3] = "Units Booked"; data[14][4] = enrollmentData?.billingDaysSessions ?? "-";

		data[15][0] = "Start Date"; data[15][1] = enrollmentData?.attendingStartDate ?? "-";
		data[15][3] = "Total Units"; data[15][4] = n(enrollmentData?.membersEnrolled) * n(enrollmentData?.billingDaysSessions);

		data[16][0] = "End Date"; data[16][1] = enrollmentData?.endDate ?? "-";
		data[16][3] = "Billing Rate"; data[16][4] = enrollmentData?.billingRate ?? "-";

		data[17][0] = "Weekly Days"; data[17][1] = enrollmentData?.attendingPatternDays ?? "-";
		data[17][3] = "Booking Amount"; data[17][4] = enrollmentData?.billingAmount ?? 0;

		data[18][0] = "Session Minutes"; data[18][1] = enrollmentData?.course?.sessionMinutes ?? "-";
		data[18][3] = "Rounded"; data[18][4] = enrollmentData?.roundedAmount ?? 0;
		data[18][6] = "Invalid Without TSL Seal and Signature.";

		// --- SECTION 4: FINANCIAL ---
		const financials = [
			["From", enrollmentData?.startTime, "Processing Charge", enrollmentData?.processingCharge, "Amount Being Debited", enrollmentData?.totalDebitAmount],
			["To", enrollmentData?.endTime, "Total Charge", n(enrollmentData?.billingAmount) + n(enrollmentData?.roundedAmount) + n(enrollmentData?.processingCharge), "Member Amount", enrollmentData?.totalDebitAmount],
			["Batch", enrollmentData?.batch?.batchName, "CGST", enrollmentData?.cgstAmount, enrollmentData?.dnAccountId ?? "DN/Discount", enrollmentData?.dnOrDiscount],
			["Offered Rate", enrollmentData?.rackPrice, "SGST", enrollmentData?.sgstAmount, "Walking Customer", enrollmentData?.totalDebitAmount],
			["Booking Discount", enrollmentData?.dnOrDiscount, "Total Receivable", n(enrollmentData?.cgstAmount) + n(enrollmentData?.sgstAmount) + n(enrollmentData?.billingAmount) + n(enrollmentData?.roundedAmount) + n(enrollmentData?.processingCharge), "Total Debited Amount", ">>>>>>"]
		];

		financials.forEach((row, i) => {
			const r = 19 + i;
			data[r][0] = row[0]; data[r][1] = row[1];
			data[r][3] = row[2]; data[r][4] = row[3];
			data[r][6] = row[4]; data[r][9] = row[5];
		});

		// --- SECTION 5: FOOTER ---
		data[25][0] = "Terms and Conditions: 1. Computer generated summary. 2. Disputes must be reported within 7 days.";
		data[31][0] = "Remarks: Transaction processed successfully.";

		const ws = XLSX.utils.aoa_to_sheet(data);
		ws['!merges'] = [
			{ s: { r: 0, c: 0 }, e: { r: 2, c: 1 } }, { s: { r: 0, c: 3 }, e: { r: 1, c: 7 } }, { s: { r: 2, c: 3 }, e: { r: 2, c: 7 } },
			{ s: { r: 12, c: 0 }, e: { r: 13, c: 1 } }, { s: { r: 13, c: 6 }, e: { r: 14, c: 7 } }, { s: { r: 13, c: 8 }, e: { r: 14, c: 9 } },
			{ s: { r: 15, c: 6 }, e: { r: 17, c: 7 } }, { s: { r: 15, c: 8 }, e: { r: 17, c: 9 } }, { s: { r: 18, c: 6 }, e: { r: 18, c: 9 } },
			{ s: { r: 19, c: 6 }, e: { r: 19, c: 8 } }, { s: { r: 20, c: 6 }, e: { r: 20, c: 8 } }, { s: { r: 21, c: 6 }, e: { r: 21, c: 8 } },
			{ s: { r: 22, c: 6 }, e: { r: 22, c: 8 } }, { s: { r: 23, c: 6 }, e: { r: 23, c: 8 } },
			{ s: { r: 25, c: 0 }, e: { r: 29, c: 9 } }, { s: { r: 31, c: 0 }, e: { r: 32, c: 9 } }
		];

		ws['!cols'] = colWidths.map(w => ({ wch: w / 7 }));
		XLSX.utils.book_append_sheet(wb, ws, "TSL_Invoice");
		XLSX.writeFile(wb, `Invoice_${enrollmentData?.enrollmentNo || 'export'}.xlsx`);
	};

	const handlePdf = () => {
		window.print();
	}

	const cellStyle: React.CSSProperties = { border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', padding: '6px', fontSize: '10px', overflow: 'hidden' };
	const labelStyle: React.CSSProperties = { ...cellStyle, backgroundColor: '#f5f5f5', fontWeight: 'bold' };
	const gutterStyle: React.CSSProperties = { border: '1px solid #eee', background: '#f9f9f9' };

	return (
		<div style={{ backgroundColor: '#f0f2f5', width:'100%',minHeight: '100vh', fontFamily: 'sans-serif' }}>
			<div style={{ background: '#fff', borderRadius: '8px', width: 'fit-content', margin: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
				<div style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => `${w}px`).join(' '), border: '2px dotted #333' }}>

					{/* HEADER */}
					<div style={{ gridColumn: '1 / span 2', gridRow: '1 / span 3', ...cellStyle, justifyContent: 'center' }}>
						<img src="/src/assets/tsl.png" alt="LOGO" style={{ maxWidth: '90%', height: 'auto' }} />
					</div>
					<div style={{ gridColumn: '3', gridRow: '1 / span 4', ...gutterStyle }}></div>
					<div style={{ gridColumn: '4 / span 5', gridRow: '1 / span 2', ...cellStyle, justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#107c41' }}>BOOKING DETAILS</div>
					<div style={labelStyle}>Enr No</div><div style={cellStyle}>{enrollmentData?.enrollmentNo ?? "-"}</div>
					<div style={labelStyle}>Date</div><div style={cellStyle}>{enrollmentData?.enrollmentDate ?? "-"}</div>
					<div style={{ gridColumn: '4 / span 5', gridRow: '3', ...cellStyle, justifyContent: 'center', fontWeight: 'bold', background: '#fff8e1', fontSize: '14px' }}>Debit Note</div>
					<div style={labelStyle}>Enr ID</div><div style={cellStyle}>{enrollmentData?.enrollmentId ?? "-"}</div>

					<div style={{ gridColumn: '1 / span 10', gridRow: '4', height: '15px', background: '#fff', borderBottom: '1px solid #ddd' }}></div>

					{/* PERSONAL DATA */}
					<div style={labelStyle}>Reg No</div><div style={cellStyle}>{enrollmentData?.member?.memberId ?? "-"}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2' }}>Booking Done By</div>
					<div style={{ ...cellStyle, gridColumn: 'span 6' }}>{enrollmentData?.walkingName} {enrollmentData?.walkingContact}</div>

					<div style={labelStyle}>Reg No</div><div style={cellStyle}>{enrollmentData?.member?.memberId ?? "-"}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2' }}>User Name</div>
					<div style={{ ...cellStyle, gridColumn: 'span 4' }}>{enrollmentData?.member?.memberFirstName}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2', justifyContent: 'center' }}>Age: {enrollmentData?.member?.dob as string}</div>

					<div style={labelStyle}>Member A/C</div><div style={cellStyle}>{enrollmentData?.accountName ?? "-"}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2' }}>member debited A/c</div>
					<div style={{ ...cellStyle, gridColumn: 'span 4' }}>{enrollmentData?.accountId}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2', justifyContent: 'center' }}>{enrollmentData?.accountName} Type</div>

					<div style={labelStyle}>MS No</div><div style={cellStyle}>{enrollmentData?.membershipMasterId ?? "-"}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2' }}>Membership Details</div>
					<div style={{ ...cellStyle, gridColumn: 'span 4' }}>Premium Membership</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2', justifyContent: 'center' }}>{enrollmentData?.membershipMasterId}</div>

					<div style={{ gridColumn: 'span 10', height: '10px' }}></div>

					{/* SERVICE DATA */}
					<div style={labelStyle}>RSCA Ac No</div><div style={cellStyle}>{enrollmentData?.course?.entityId}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2' }}>Service Provider</div>
					<div style={{ ...cellStyle, gridColumn: 'span 5' }}>{enrollmentData?.course?.entityName}</div>
					<div style={{ ...labelStyle, justifyContent: 'center' }}>{enrollmentData?.course?.entityName}</div>

					<div style={labelStyle}>Code</div><div style={cellStyle}>{enrollmentData?.rackPrice}</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2' }}>Service Name</div>
					<div style={{ ...cellStyle, gridColumn: 'span 5' }}>{enrollmentData?.course?.courseName}</div>
					<div style={{ ...labelStyle, justifyContent: 'center' }}>{enrollmentData?.course?.activityId}</div>

					<div style={{ gridColumn: 'span 10', height: '10px' }}></div>

					{/* ATTENDANCE */}
					<div style={{ gridColumn: 'span 2', gridRow: 'span 2', ...cellStyle, background: '#e3f2fd', fontWeight: 'bold', justifyContent: 'center' }}>{enrollmentData?.attendingPattern}</div>
					<div style={{ ...gutterStyle, gridRow: 'span 2' }}></div>
					<div style={labelStyle}>Billing Pattern</div><div style={cellStyle}>{enrollmentData?.course?.chargingPattern}</div><div style={{ ...gutterStyle, gridRow: 'span 2' }}></div>
					<div style={labelStyle}>Members</div><div style={labelStyle}>Signature</div>
					<div style={{ ...labelStyle, gridColumn: 'span 2', justifyContent: 'center' }}>For TSL</div>

					<div style={labelStyle}>Participants</div><div style={cellStyle}>{enrollmentData?.membersEnrolled ?? 1}</div>
					<div style={{ gridColumn: 'span 2', gridRow: 'span 2', ...cellStyle, justifyContent: 'center', fontWeight: 'bold' }}>{enrollmentData?.memberApprovalStatus}</div>
					<div style={{ gridColumn: 'span 2', gridRow: 'span 2', ...cellStyle, justifyContent: 'center', fontStyle: 'italic', background: '#f9f9f9' }}>Authorized Signatory</div>

					<div style={labelStyle}>Calendar Days</div><div style={cellStyle}>{enrollmentData?.permittedDays}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Units Booked</div><div style={cellStyle}>{enrollmentData?.billingDaysSessions}</div><div style={gutterStyle}></div>

					{/* SIGNATURE/TIMELINE AREA */}
					<div style={labelStyle}>Start Date</div><div style={cellStyle}>{enrollmentData?.attendingStartDate}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Total Units</div><div style={cellStyle}>{n(enrollmentData?.membersEnrolled) * n(enrollmentData?.billingDaysSessions)}</div><div style={gutterStyle}></div>
					<div style={{ gridColumn: 'span 2', gridRow: 'span 3', ...cellStyle, background: '#fff', justifyContent: 'center' }}>[ Seal ]</div>
					<div style={{ gridColumn: 'span 2', gridRow: 'span 3', ...cellStyle, background: '#fff', justifyContent: 'center' }}>[ Signature ]</div>

					<div style={labelStyle}>End Date</div><div style={cellStyle}>{enrollmentData?.endDate}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Billing Rate</div><div style={cellStyle}>{enrollmentData?.billingRate}</div><div style={gutterStyle}></div>

					<div style={labelStyle}>Weekly Days</div><div style={cellStyle}>{enrollmentData?.attendingPatternDays}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Booking Amount</div><div style={cellStyle}>{enrollmentData?.billingAmount}</div><div style={gutterStyle}></div>

					<div style={labelStyle}>Session Minutes</div><div style={cellStyle}>{enrollmentData?.course?.sessionMinutes}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Rounded</div><div style={cellStyle}>{enrollmentData?.roundedAmount}</div><div style={gutterStyle}></div>
					<div style={{ gridColumn: 'span 4', ...cellStyle, color: 'red', fontWeight: 'bold', justifyContent: 'center' }}>Invalid Without TSL Seal and Signature.</div>

					{/* FINANCIALS */}
					<div style={labelStyle}>From</div><div style={cellStyle}>{enrollmentData?.startTime}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Processing</div><div style={cellStyle}>{enrollmentData?.processingCharge}</div><div style={gutterStyle}></div>
					<div style={{ ...labelStyle, gridColumn: 'span 3' }}>Amount Being Debited</div><div style={cellStyle}>{enrollmentData?.totalDebitAmount}</div>

					<div style={labelStyle}>To</div><div style={cellStyle}>{enrollmentData?.endTime}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Total Charge</div><div style={cellStyle}>{n(enrollmentData?.billingAmount) + n(enrollmentData?.roundedAmount) + n(enrollmentData?.processingCharge)}</div><div style={gutterStyle}></div>
					<div style={{ ...labelStyle, gridColumn: 'span 3' }}>Member Amount</div><div style={cellStyle}>{enrollmentData?.totalDebitAmount}</div>

					<div style={labelStyle}>Batch</div><div style={cellStyle}>{enrollmentData?.batch?.batchName}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>CGST</div><div style={cellStyle}>{enrollmentData?.cgstAmount}</div><div style={gutterStyle}></div>
					<div style={{ ...labelStyle, gridColumn: 'span 3' }}>{enrollmentData?.dnAccountId || "A/C ID"}</div><div style={cellStyle}>{enrollmentData?.dnOrDiscount}</div>

					<div style={labelStyle}>Offered Rate</div><div style={cellStyle}>{enrollmentData?.rackPrice}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>SGST</div><div style={cellStyle}>{enrollmentData?.sgstAmount}</div><div style={gutterStyle}></div>
					<div style={{ ...labelStyle, gridColumn: 'span 3' }}>Walking Customer</div><div style={cellStyle}>{enrollmentData?.totalDebitAmount}</div>

					<div style={labelStyle}>Discount</div><div style={cellStyle}>{enrollmentData?.dnOrDiscount}</div><div style={gutterStyle}></div>
					<div style={labelStyle}>Receivable</div><div style={cellStyle}>{n(enrollmentData?.cgstAmount) + n(enrollmentData?.sgstAmount) + n(enrollmentData?.billingAmount) + n(enrollmentData?.roundedAmount)}</div><div style={gutterStyle}></div>
					<div style={{ ...labelStyle, gridColumn: 'span 3' }}>Total Debited Amount</div><div style={cellStyle}>>>>>></div>

					{/* FOOTER */}
					<div style={{ gridColumn: 'span 10', height: '15px' }}></div>
					<div style={{ gridColumn: 'span 10', gridRow: 'span 5', ...cellStyle, alignItems: 'flex-start', background: '#fafafa', fontSize: '11px', padding: '10px' }}>
						<strong>Terms and Conditions:</strong><br />
						1. This document is a computer-generated summary.<br />
						2. Disputes must be reported within 7 days of generation.
					</div>
					<div style={{ gridColumn: 'span 10', height: '15px' }}></div>
					<div style={{ gridColumn: 'span 10', gridRow: 'span 2', ...cellStyle, fontWeight: 'bold', fontStyle: 'italic' }}>
						Remarks: Transaction processed successfully.
					</div>
				</div>

				<button onClick={handleExport} style={{ marginTop: '20px', padding: '15px 30px', width: '100%', background: '#107c41', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
					Download Complete Excel Report
				</button>
				<button onClick={handlePdf} style={{ marginTop: '20px', padding: '15px 30px', width: '100%', background: '#FF3A3A', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
					Download Complete PDF Report
				</button>
			</div>
		</div>
	);
};

export default ExcelInvoice;