export interface User {
    id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
}

export interface Group {
    id: string;
    name: string;
    created_by: number;
    created_at?: string;
}

export interface Expense {
    id: string;
    group_id: string;
    payer_id: number;
    description: string;
    amount: number;
    created_at: string;
    splits: Split[];
}

export interface Split {
    id: string;
    expense_id: string;
    user_id: number;
    amount: number;
    is_paid: boolean;
}

export interface Member extends User {
    joined_at?: string;
}
