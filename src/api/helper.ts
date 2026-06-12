export function toQueryString(q: Record<string, any>) {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        params.append(k, String(v));
    });
    const s = params.toString();
    return s ? `?${s}` : '';
}

export function getSelectedDb(): string | null {
    return localStorage.getItem('selected_db_name');
}

export async function request<T>(url: string, options?: RequestInit, token?: string): Promise<T> {
    try {
        const authToken = token ?? localStorage.getItem('token');
        const selectedDb = getSelectedDb();

        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { "authorization": `Bearer ${authToken}` } : {}),
                ...(selectedDb ? { 'x-db-name': selectedDb } : {}),
                ...(options?.headers as Record<string, string> | undefined),
            },
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