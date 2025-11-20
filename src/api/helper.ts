// --- helper to convert query object to string ---
export function toQueryString(q: Record<string, any>) {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        // keep boolean / number / string
        params.append(k, String(v));
    });
    const s = params.toString();
    return s ? `?${s}` : '';
}

// Helper function
export async function request<T>(url: string, options?: RequestInit): Promise<T> {
    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        })

        const data = (await res.json()) as T
        return data
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Request failed',
            data: null,
        } as T
    }
}

export type SortOrder = 'ASC' | 'DESC';