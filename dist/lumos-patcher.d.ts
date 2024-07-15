import { Address, Cell } from "@ckb-lumos/base";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
/**
 * Generate DAO unlock transaction structure with zero fee added.
 * This is a modified version and a temporary replacement for
 * lumos::common-script::unlock function
 */
export declare const unlock: (txSkeleton: TransactionSkeletonType, fromAddress: Address, daoWithdrawalCell: Cell) => Promise<TransactionSkeletonType>;
declare const _default: {
    unlock: (txSkeleton: TransactionSkeletonType, fromAddress: Address, daoWithdrawalCell: Cell) => Promise<TransactionSkeletonType>;
};
export default _default;
