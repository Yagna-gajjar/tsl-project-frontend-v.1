import { request } from "./helper";

const API_URL = import.meta.env.VITE_APP_API_URL + '/billing';

export interface Billing {
	academyId: number,
	startDate: Date,
	endDate: Date
}

async function getBills(params?: Billing) {
	try {
		const url = `${API_URL}?academyId=${params?.academyId}&startDate=${params?.startDate}&endDate=${params?.endDate}`;
		return request<any>(url);
	} catch (err) {
		console.error("Error fetching coaches:", err);
		throw err;
	}
}

export { getBills };
