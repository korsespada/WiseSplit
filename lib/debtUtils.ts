export type Transaction = {
    from: number; // User ID
    to: number;   // User ID
    amount: number;
};

export type Balance = {
    [userId: number]: number; // Positive = owed, Negative = owes
};

export function calculateSimplifiedDebts(balances: Balance): Transaction[] {
    const debtors: { id: number; amount: number }[] = [];
    const creditors: { id: number; amount: number }[] = [];

    // Separate users into debtors and creditors
    Object.entries(balances).forEach(([userId, amount]) => {
        const id = Number(userId);
        if (amount < -0.01) debtors.push({ id, amount });
        else if (amount > 0.01) creditors.push({ id, amount });
    });

    // Sort by magnitude (descending) to optimize matching
    debtors.sort((a, b) => a.amount - b.amount); // Most negative first (e.g. -100, -50)
    creditors.sort((a, b) => b.amount - a.amount); // Most positive first (e.g. 100, 50)

    const transactions: Transaction[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];

        // The amount to settle is the minimum of what the debtor owes and what the creditor is owed
        const creditAmount = creditor.amount;
        const debitAmount = Math.abs(debtor.amount);
        const settleAmount = Math.min(creditAmount, debitAmount);

        transactions.push({
            from: debtor.id,
            to: creditor.id,
            amount: Number(settleAmount.toFixed(2)),
        });

        // Update balances
        debtor.amount += settleAmount;
        creditor.amount -= settleAmount;

        // Move to next if settled (checking for near-zero due to floating point)
        if (Math.abs(debtor.amount) < 0.01) debtorIndex++;
        if (creditor.amount < 0.01) creditorIndex++;
    }

    return transactions;
}
