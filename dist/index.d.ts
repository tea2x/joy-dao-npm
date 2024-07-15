import { CKBTransaction } from "@joyid/ckb";
import { Address, Cell } from "@ckb-lumos/base";
/**
 * Fetch DAO deposits.
 *
 * @param ckbAddress - The ckb address from which deposit cells are queried.
 * @returns An array of deposit cells.
 */
export declare const collectDeposits: (ckbAddress: Address) => Promise<Cell[]>;
/**
 * Fetch DAO withdrawals.
 *
 * @param ckbAddress - The ckb address from which withdrawal cells are queried.
 * @returns An array of withdrawal cells.
 */
export declare const collectWithdrawals: (ckbAddress: Address) => Promise<Cell[]>;
/**
 * Buid DAO deposit transaction.
 *
 * @param ckbAddress - The ckb address that will holds the deposit
 * @param amount - The amount to deposit.
 * @returns A CKB raw transaction.
 */
export declare const buildDepositTransaction: (ckbAddress: Address, amount: bigint) => Promise<{
    tx: CKBTransaction;
    fee: number;
}>;
/**
 * Buid DAO withdraw raw transaction.
 *
 * @param ckbAddress - The ckb address that owns the cell to be withdrawn.
 * @param daoDepositCell - The deposit cell.
 * @returns A CKB raw transaction.
 */
export declare const buildWithdrawTransaction: (ckbAddress: Address, daoDepositCell: Cell) => Promise<{
    tx: CKBTransaction;
    fee: number;
}>;
/**
 * Buid DAO unlock raw transaction.
 *
 * @param ckbAddress - The ckb address that owns the cell to be unlocked.
 * @param daoWithdrawalCell - The withdrawal cell.
 * @returns A CKB raw transaction.
 */
export declare const buildUnlockTransaction: (ckbAddress: Address, daoWithdrawalCell: Cell) => Promise<{
    tx: CKBTransaction;
    fee: number;
}>;
/**
 * Batch deposits or/with cells to withdraw or/and unlock at once.
 *
 * @param ckbAddress - The ckb address that owns the cells to be batched.
 * @param cells - An array of deposit cells or/with at-end-cycle withdrawal cells.
 * @returns A CKB raw transaction.
 */
export declare const batchDaoCells: (ckbAddress: Address, cells: Cell[]) => Promise<{
    tx: CKBTransaction;
    fee: number;
}>;
