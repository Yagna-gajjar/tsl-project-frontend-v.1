export interface Enums {
    id: number;
    category: string;
    value: string;
    status: boolean;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface EnumGroup {
    category: string;
    values: string[];
    ids: number[];
    status: boolean[];
    description: (string | null)[];
}

export interface EnumResponse {
    success: boolean;
    data: EnumGroup[];
}