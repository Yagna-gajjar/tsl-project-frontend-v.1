import * as XLSX from "xlsx";

const prettifyKey = (key: string) =>
	key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export function exportToExcel<T extends Record<string, any>>(
	rows: T[],
	columns: { key: keyof T; header: string }[],
	exportFileName: string
) {
	if (!rows.length) return;

	const data = rows.map((row) =>
		Object.fromEntries(
			columns.map((col) => {
				let value: any = row[col.key];

				if (value instanceof Date) {
					value = value.toLocaleDateString();
				} else if (
					typeof value === "string" &&
					!isNaN(Date.parse(value))
				) {
					value = new Date(value).toLocaleDateString();
				}

				return [col.header || prettifyKey(String(col.key)), value ?? "-"];
			})
		)
	);

	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();

	XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
	XLSX.writeFile(
		workbook,
		`${exportFileName}_${new Date().toISOString().split("T")[0]}.xlsx`
	);
}
