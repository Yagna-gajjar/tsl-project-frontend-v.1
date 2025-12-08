export function toQueryString(q: Record<string, any>) {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        params.append(k, String(v));
    });
    const s = params.toString();
    return s ? `?${s}` : '';
}

export async function request<T>(url: string, options?: RequestInit, token?: string): Promise<T> {
    try {
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                "authorization": `Bearer ${token}`
            },
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