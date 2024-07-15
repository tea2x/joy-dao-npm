"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchDaoCells = exports.buildUnlockTransaction = exports.buildWithdrawTransaction = exports.buildDepositTransaction = exports.collectWithdrawals = exports.collectDeposits = void 0;
const ckb_indexer_1 = require("@ckb-lumos/ckb-indexer");
const config_manager_1 = require("@ckb-lumos/config-manager");
const common_scripts_1 = require("@ckb-lumos/common-scripts");
const lumos_patcher_1 = require("./lumos-patcher"); // TODO to be replaced
const lumos_patches_1 = require("@ckb-ccc/lumos-patches");
const config_1 = require("./config");
const common_1 = require("@ckb-lumos/common-scripts/lib/common");
const helpers_1 = require("@ckb-lumos/helpers");
const helpers_2 = require("./lib/helpers");
const indexer = new ckb_indexer_1.Indexer(config_1.INDEXER_URL);
(0, common_1.registerCustomLockScriptInfos)((0, lumos_patches_1.generateDefaultScriptInfos)());
/**
 * Fetch DAO deposits.
 *
 * @param ckbAddress - The ckb address from which deposit cells are queried.
 * @returns An array of deposit cells.
 */
const collectDeposits = (ckbAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    let depositCells = [];
    const daoCellCollector = new common_scripts_1.dao.CellCollector(ckbAddress, indexer, "deposit");
    try {
        for (var _d = true, _e = __asyncValues(daoCellCollector.collect()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
            _c = _f.value;
            _d = false;
            const inputCell = _c;
            depositCells.push(inputCell);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return depositCells;
});
exports.collectDeposits = collectDeposits;
/**
 * Fetch DAO withdrawals.
 *
 * @param ckbAddress - The ckb address from which withdrawal cells are queried.
 * @returns An array of withdrawal cells.
 */
const collectWithdrawals = (ckbAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_2, _b, _c;
    let depositCells = [];
    const daoCellCollector = new common_scripts_1.dao.CellCollector(ckbAddress, indexer, "withdraw");
    try {
        for (var _d = true, _e = __asyncValues(daoCellCollector.collect()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
            _c = _f.value;
            _d = false;
            const inputCell = _c;
            depositCells.push(inputCell);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return depositCells;
});
exports.collectWithdrawals = collectWithdrawals;
/**
 * Buid DAO deposit transaction.
 *
 * @param ckbAddress - The ckb address that will holds the deposit
 * @param amount - The amount to deposit.
 * @returns A CKB raw transaction.
 */
const buildDepositTransaction = (ckbAddress, amount) => __awaiter(void 0, void 0, void 0, function* () {
    amount = (0, helpers_2.ckbytesToShannons)(amount);
    if (amount < (0, helpers_2.ckbytesToShannons)(BigInt(config_1.DAO_MINIMUM_CAPACITY)))
        throw new Error("Minimum DAO deposit is 104 CKB.");
    const configuration = config_1.ISMAINNET ? config_manager_1.predefined.LINA : config_manager_1.predefined.AGGRON4;
    let txSkeleton = new helpers_1.TransactionSkeleton({ cellProvider: indexer });
    txSkeleton = yield common_scripts_1.dao.deposit(txSkeleton, ckbAddress, ckbAddress, amount, {
        config: configuration,
        enableNonSystemScript: true,
    });
    // patching joyID tx fee and lumos::common-script::dao::unlock
    if ((0, helpers_2.isJoyIdAddress)(ckbAddress))
        txSkeleton = (0, helpers_2.insertJoyIdWithnessPlaceHolder)(txSkeleton);
    txSkeleton = yield common_scripts_1.common.payFeeByFeeRate(txSkeleton, [ckbAddress], BigInt(config_1.FEE_RATE), undefined, {
        config: configuration,
    });
    const txFee = (0, helpers_2.getFee)(txSkeleton);
    const daoDepositTx = (0, helpers_1.createTransactionFromSkeleton)(txSkeleton);
    return { tx: daoDepositTx, fee: txFee };
});
exports.buildDepositTransaction = buildDepositTransaction;
/**
 * Buid DAO withdraw raw transaction.
 *
 * @param ckbAddress - The ckb address that owns the cell to be withdrawn.
 * @param daoDepositCell - The deposit cell.
 * @returns A CKB raw transaction.
 */
const buildWithdrawTransaction = (ckbAddress, daoDepositCell) => __awaiter(void 0, void 0, void 0, function* () {
    const configuration = config_1.ISMAINNET ? config_manager_1.predefined.LINA : config_manager_1.predefined.AGGRON4;
    let txSkeleton = new helpers_1.TransactionSkeleton({ cellProvider: indexer });
    txSkeleton = yield common_scripts_1.dao.withdraw(txSkeleton, daoDepositCell, ckbAddress, {
        config: configuration,
        enableNonSystemScript: true,
    });
    // patching joyID tx fee and lumos::common-script::dao::unlock
    if ((0, helpers_2.isJoyIdAddress)(ckbAddress))
        txSkeleton = (0, helpers_2.insertJoyIdWithnessPlaceHolder)(txSkeleton);
    txSkeleton = yield common_scripts_1.common.payFeeByFeeRate(txSkeleton, [ckbAddress], BigInt(config_1.FEE_RATE), undefined, {
        config: configuration,
    });
    const txFee = (0, helpers_2.getFee)(txSkeleton);
    const daoWithdrawTx = (0, helpers_1.createTransactionFromSkeleton)(txSkeleton);
    return { tx: daoWithdrawTx, fee: txFee };
});
exports.buildWithdrawTransaction = buildWithdrawTransaction;
/**
 * Buid DAO unlock raw transaction.
 *
 * @param ckbAddress - The ckb address that owns the cell to be unlocked.
 * @param daoWithdrawalCell - The withdrawal cell.
 * @returns A CKB raw transaction.
 */
const buildUnlockTransaction = (ckbAddress, daoWithdrawalCell) => __awaiter(void 0, void 0, void 0, function* () {
    const configuration = config_1.ISMAINNET ? config_manager_1.predefined.LINA : config_manager_1.predefined.AGGRON4;
    let txSkeleton = (0, helpers_1.TransactionSkeleton)({ cellProvider: indexer });
    txSkeleton = yield (0, lumos_patcher_1.unlock)(txSkeleton, ckbAddress, daoWithdrawalCell);
    // patching joyID tx fee and lumos::common-script::dao::unlock
    if ((0, helpers_2.isJoyIdAddress)(ckbAddress))
        txSkeleton = (0, helpers_2.insertJoyIdWithnessPlaceHolder)(txSkeleton);
    const inputCapacity = txSkeleton.inputs
        .toArray()
        .reduce((a, c) => a + (0, helpers_2.hexToInt)(c.cellOutput.capacity), BigInt(0));
    const outputCapacity = txSkeleton.outputs
        .toArray()
        .reduce((a, c) => a + (0, helpers_2.hexToInt)(c.cellOutput.capacity), BigInt(0));
    const reward = outputCapacity - inputCapacity;
    txSkeleton = yield common_scripts_1.common.payFeeByFeeRate(txSkeleton, [ckbAddress], BigInt(config_1.FEE_RATE), undefined, {
        config: configuration,
    });
    const txFee = (0, helpers_2.getFee)(txSkeleton, reward);
    const daoUnlockTx = (0, helpers_1.createTransactionFromSkeleton)(txSkeleton);
    return { tx: daoUnlockTx, fee: txFee };
});
exports.buildUnlockTransaction = buildUnlockTransaction;
/**
 * Batch deposits or/with cells to withdraw or/and unlock at once.
 *
 * @param ckbAddress - The ckb address that owns the cells to be batched.
 * @param cells - An array of deposit cells or/with at-end-cycle withdrawal cells.
 * @returns A CKB raw transaction.
 */
const batchDaoCells = (ckbAddress, cells) => __awaiter(void 0, void 0, void 0, function* () {
    let txSkeleton = (0, helpers_1.TransactionSkeleton)({ cellProvider: indexer });
    const depositCells = cells.filter((cell) => cell.data == "0x0000000000000000");
    const withdrawCells = cells.filter((cell) => cell.data != "0x0000000000000000");
    const configuration = config_1.ISMAINNET ? config_manager_1.predefined.LINA : config_manager_1.predefined.AGGRON4;
    // Batching deposit cells
    for (const cell of depositCells) {
        txSkeleton = yield common_scripts_1.dao.withdraw(txSkeleton, cell, ckbAddress, {
            config: configuration,
            enableNonSystemScript: true,
        });
    }
    // patching joyID tx fee and lumos::common-script::dao::unlock
    if ((0, helpers_2.isJoyIdAddress)(ckbAddress))
        txSkeleton = (0, helpers_2.insertJoyIdWithnessPlaceHolder)(txSkeleton);
    // Batching withdrawal cells
    for (const cell of withdrawCells) {
        //TODO replace when lumos supports joyID for dao unlocking
        txSkeleton = yield (0, lumos_patcher_1.unlock)(txSkeleton, ckbAddress, cell);
    }
    // patching joyID tx fee and lumos::common-script::dao::unlock
    if ((0, helpers_2.isJoyIdAddress)(ckbAddress))
        txSkeleton = (0, helpers_2.insertJoyIdWithnessPlaceHolder)(txSkeleton);
    txSkeleton = yield common_scripts_1.common.payFeeByFeeRate(txSkeleton, [ckbAddress], BigInt(config_1.FEE_RATE), undefined, {
        config: configuration,
    });
    const txFee = (0, helpers_2.getFee)(txSkeleton);
    const daoWithdrawTx = (0, helpers_1.createTransactionFromSkeleton)(txSkeleton);
    return { tx: daoWithdrawTx, fee: txFee };
});
exports.batchDaoCells = batchDaoCells;
