import { Address, Cell } from "@ckb-lumos/base";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
export interface Balance {
    available: string;
    occupied: string;
}
export interface DaoCell extends Cell {
    isDeposit: boolean;
    depositEpoch: number;
    sinceEpoch: number;
    maximumWithdraw: string;
    ripe: boolean;
    completedCycles: number;
    currentCycleProgress: number;
    cycleEndInterval: number;
}
/**
 * Get block hash based on block number.
 *
 * @param blockNumber - CKB block number.
 * @returns Block hash.
 */
export declare function getBlockHash(blockNumber: string): Promise<string>;
/**
 * Convert from CKB to Shannon.
 *
 * @param ckbytes - The CKB amount.
 * @returns The shannon ammount.
 */
export declare function ckbytesToShannons(ckbytes: bigint): bigint;
/**
 * Convert integer to hex string.
 *
 * @param intValue - The integer number.
 * @returns The converted hex string.
 */
export declare function intToHex(intValue: bigint): string;
/**
 * Convert hex string to integer.
 *
 * @param intValue - The hex string.
 * @returns The converted bigint.
 */
export declare function hexToInt(hex: string): bigint;
/**
 * Query balance and DAO status.
 *
 * @param ckbAddress - The ckb address.
 * @returns An object typed Balance.
 */
export declare const queryBalance: (ckbAddress: Address) => Promise<Balance>;
/**
 * Find deposit cell based on a withdrawal cell.
 *
 * @param withdrawalCell - The Withdrawal cell based on which the deposit cell is searched.
 * @returns The trace of the deposit cell.
 */
export declare const findDepositCellWith: (withdrawalCell: Cell) => Promise<Cell>;
/**
 * Wait for transaction confirmation.
 *
 * @param txid - The transaction id / transaction hash.
 * @returns none.
 */
export declare function waitForTransactionConfirmation(txid: string): Promise<void>;
/**
 * Enrich deposit information for UI control.
 *
 * @param cell - The deposit/withdraw cell.
 * @param isDeposit - Is this a deposit or a withdraw?
 * @param tipEpoch - The CKB blockchain tip epoch
 * @returns A CKB raw transaction.
 */
export declare const enrichDaoCellInfo: (cell: DaoCell, isDeposit: boolean, tipEpoch: number) => Promise<void>;
/**
 * Fetch tip epoch from CKB and return it
 */
export declare const getTipEpoch: () => Promise<number>;
/**
 * A seeded random object, used in controling UI
 */
export declare class SeededRandom {
    private seed;
    constructor(seed: number);
    next(min: number, max: number): number;
}
/**
 * Verify if an address is joyID address or not
 */
export declare const isJoyIdAddress: (address: string) => boolean;
/**
 * Verify if an address is an omnilock address or not
 */
export declare const isOmnilockAddress: (address: string) => boolean;
/**
 * Verify if an address is secp256k1 address or not
 */
export declare const isDefaultAddress: (address: string) => boolean;
/**
 * A workardound for joyID transaction fee since
 * joyID witness size varies + lumos doesn't support yet
 *
 * @param transaction - The transaction skeleton.
 * @returns A regulated transaction.
 */
export declare const insertJoyIdWithnessPlaceHolder: (transaction: TransactionSkeletonType) => TransactionSkeletonType;
/**
 * Get transaction fee from a transaction
 *
 * @param transaction - The transaction skeleton.
 * @param reward - Reward in case of a DAO unlock transaction.
 * @returns A regulated transaction.
 */
export declare const getFee: (transaction: TransactionSkeletonType, reward?: bigint | null) => number;
/**
 * Estimate reward when withdraw transaction is requested
 *
 * @param depositCell - The deposit cell being withdrawn.
 * @param tipEpoch - The CKB blockchain tip epoch
 * @returns Reward estimation.
 */
export declare const estimateReturn: (depositCell: DaoCell, tipEpoch: number) => Promise<number>;
