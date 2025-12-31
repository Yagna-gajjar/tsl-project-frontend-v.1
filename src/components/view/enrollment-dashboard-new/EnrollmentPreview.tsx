import React from 'react';
import * as XLSX from 'xlsx';

const ExcelPreview = () => {
	// Configuration for dimensions (10 columns)
	const colWidths = [80, 120, 30, 100, 100, 100, 100, 100, 120, 150];
	const rowHeights = [40, 40, 40, 60, 40, 40];

	const handleExport = () => {
		const wb = XLSX.utils.book_new();
		// Initialize 6 rows and 10 columns
		const data = Array(6).fill(null).map(() => Array(10).fill(""));

		// Row 1-3 Labels
		data[0][8] = "Enr No"; data[0][9] = 1001;
		data[1][8] = "Date"; data[1][9] = 20251231;
		data[2][8] = "Enr ID"; data[2][9] = 5588;

		// Row 4
		data[3][3] = "Debit Note";

		// Row 5: Reg No, Value, Merge(3,4), Merge(5-10)
		data[4][0] = "Reg No";
		data[4][1] = 12345;
		data[4][2] = "Booking Done By"; // Cell start for merge
		data[4][4] = "hemang baldha - 9017466283"; // Cell start for merge

		// Row 6: Reg No, Value, Merge(3,4), Merge(5-8), Merge(9,10)
		data[5][0] = "Reg No";
		data[5][1] = 67890;
		data[5][2] = "User Details"; // Placeholder for merged 3-4
		data[5][4] = "Hemangkumar Mathurbhai Sanandiya"; // Full Name (5-8)
		data[5][8] = "Age: 20"; // Age (9-10)

		const ws = XLSX.utils.aoa_to_sheet(data);

		// Define Merges for XLSX
		ws['!merges'] = [
			{ s: { r: 0, c: 0 }, e: { r: 3, c: 1 } }, // Logo
			{ s: { r: 0, c: 3 }, e: { r: 2, c: 7 } }, // Booking Details
			{ s: { r: 3, c: 3 }, e: { r: 3, c: 9 } }, // Debit Note row extend
			// Row 5 Merges
			{ s: { r: 4, c: 2 }, e: { r: 4, c: 3 } }, // Booking Done By
			{ s: { r: 4, c: 4 }, e: { r: 4, c: 9 } }, // Hemang contact info
			// Row 6 Merges
			{ s: { r: 5, c: 2 }, e: { r: 5, c: 3 } }, // Row 6 User label
			{ s: { r: 5, c: 4 }, e: { r: 5, c: 7 } }, // Row 6 Full Name
			{ s: { r: 5, c: 8 }, e: { r: 5, c: 9 } }  // Row 6 Age
		];

		ws[XLSX.utils.encode_cell({ r: 0, c: 3 })] = { v: "Booking Details", t: 's' };
		ws['!cols'] = colWidths.map(w => ({ wch: w / 7 }));

		XLSX.utils.book_append_sheet(wb, ws, "BookingSheet");
		XLSX.writeFile(wb, "Booking_Details.xlsx");
	};

	// Shared CSS for Grid Cells
	const cellStyle: React.CSSProperties = {
		border: '1px solid #ddd',
		display: 'flex',
		alignItems: 'center',
		padding: '0 8px',
		fontSize: '13px'
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h2 style={{ marginBottom: '10px' }}>Invoice Preview</h2>

			<div style={{
				display: 'grid',
				gridTemplateColumns: colWidths.map(w => `${w}px`).join(' '),
				border: '2px solid #333',
				width: 'fit-content',
				backgroundColor: '#fff'
			}}>
				{/* --- ROWS 1-4 --- */}
				<div style={{ ...cellStyle, gridColumn: 'span 2', gridRow: 'span 4', justifyContent: 'center', background: '#fcfcfc' }}>
					<img src="/src/assets/tsl.png" alt="tsl_logo" style={{ maxWidth: '90%' }} />
				</div>

				<div style={{ ...cellStyle, gridColumn: '3', gridRow: '1 / span 4', background: '#f9f9f9' }}></div>

				<div style={{
					...cellStyle,
					gridColumn: '4 / span 5',
					gridRow: '1 / span 3',
					justifyContent: 'center',
					fontSize: '28px',
					fontWeight: '900',
					color: '#1a1a1a',
					textTransform: 'uppercase'
				}}>
					Booking Details
				</div>

				{/* Sidebar Info */}
				<div style={cellStyle}>Enr No</div><div style={cellStyle}>1001</div>
				<div style={cellStyle}>Date</div><div style={cellStyle}>20251231</div>
				<div style={cellStyle}>Enr ID</div><div style={cellStyle}>5588</div>

				{/* Debit Note Row */}
				<div style={{ ...cellStyle, gridColumn: '4 / span 7', fontWeight: 'bold', height: '60px', fontSize: '18px' }}>
					Debit Note
				</div>

				{/* --- ROW 5 --- */}
				<div style={cellStyle}>Reg No</div>
				<div style={{ ...cellStyle, fontWeight: 'bold' }}>12345</div>
				<div style={{ ...cellStyle, gridColumn: 'span 2', background: '#f0f0f0', fontWeight: '600' }}>Booking Done By</div>
				<div style={{ ...cellStyle, gridColumn: 'span 6', color: '#2c3e50' }}>hemang baldha - 9017466283</div>

				{/* --- ROW 6 --- */}
				<div style={cellStyle}>Reg No</div>
				<div style={{ ...cellStyle, fontWeight: 'bold' }}>67890</div>
				<div style={{ ...cellStyle, gridColumn: 'span 2', background: '#f0f0f0', fontWeight: '600' }}>Participant Name</div>
				<div style={{ ...cellStyle, gridColumn: 'span 4' }}>Hemangkumar Mathurbhai Sanandiya</div>
				<div style={{ ...cellStyle, gridColumn: 'span 2', justifyContent: 'center', fontWeight: 'bold', background: '#fdfdfd' }}>Age: 20</div>
			</div>

			<button
				onClick={handleExport}
				style={{
					marginTop: '20px',
					padding: '12px 24px',
					cursor: 'pointer',
					background: '#107c41',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					fontWeight: 'bold'
				}}
			>
				Download Excel File
			</button>
		</div>
	);
};

export default ExcelPreview;