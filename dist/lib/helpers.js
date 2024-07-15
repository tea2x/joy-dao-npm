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
exports.estimateReturn = exports.getFee = exports.insertJoyIdWithnessPlaceHolder = exports.isDefaultAddress = exports.isOmnilockAddress = exports.isJoyIdAddress = exports.SeededRandom = exports.getTipEpoch = exports.enrichDaoCellInfo = exports.findDepositCellWith = exports.queryBalance = void 0;
exports.getBlockHash = getBlockHash;
exports.ckbytesToShannons = ckbytesToShannons;
exports.intToHex = intToHex;
exports.hexToInt = hexToInt;
exports.waitForTransactionConfirmation = waitForTransactionConfirmation;
const lumos_1 = require("@ckb-lumos/lumos");
const base_1 = require("@ckb-lumos/base");
const { parseSince } = base_1.since;
const config_1 = require("../config");
const helpers_1 = require("@ckb-lumos/helpers");
const ckb_indexer_1 = require("@ckb-lumos/ckb-indexer");
const config_manager_1 = require("@ckb-lumos/config-manager");
const common_scripts_1 = require("@ckb-lumos/common-scripts");
const bi_1 = require("@ckb-lumos/bi");
const codec_1 = require("@ckb-lumos/codec");
const INDEXER = new ckb_indexer_1.Indexer(config_1.INDEXER_URL);
const rpc = new lumos_1.RPC(config_1.NODE_URL);
/**
 * Get block hash based on block number.
 *
 * @param blockNumber - CKB block number.
 * @returns Block hash.
 */
function getBlockHash(blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const blockHash = yield rpc.getBlockHash(blockNumber);
        return blockHash;
    });
}
/**
 * Convert from CKB to Shannon.
 *
 * @param ckbytes - The CKB amount.
 * @returns The shannon ammount.
 */
function ckbytesToShannons(ckbytes) {
    ckbytes = BigInt(ckbytes);
    return ckbytes * BigInt(config_1.CKB_SHANNON_RATIO);
}
/**
 * Convert integer to hex string.
 *
 * @param intValue - The integer number.
 * @returns The converted hex string.
 */
function intToHex(intValue) {
    if (typeof intValue !== "bigint") {
        throw new Error("Input value must be a BigInt");
    }
    let hexString = (intValue >= 0 ? "" : "-") + intValue.toString(16);
    if (intValue < 0) {
        console.warn("Warning: A negative value was passed to intToHex()");
    }
    return "0x" + hexString;
}
/**
 * Convert hex string to integer.
 *
 * @param intValue - The hex string.
 * @returns The converted bigint.
 */
function hexToInt(hex) {
    hex = String(hex);
    if (hex.substr(0, 2) !== "0x" && hex.substr(0, 3) !== "-0x")
        throw new Error(`Invalid hex value: "${hex}"`);
    const negative = hex[0] === "-";
    const hexValue = hex.replace("-", "");
    let bigInt = BigInt(hexValue);
    if (negative)
        bigInt *= BigInt(-1);
    if (negative)
        console.warn("Warning: A negative value was passed to hexToInt()");
    return bigInt;
}
/**
 * Query balance and DAO status.
 *
 * @param ckbAddress - The ckb address.
 * @returns An object typed Balance.
 */
const queryBalance = (ckbAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c, _d, e_2, _e, _f;
    const ret = { available: "", occupied: "" };
    // query available balance
    let query = {
        lock: (0, helpers_1.addressToScript)(ckbAddress),
        type: "empty",
    };
    const cellCollector = new ckb_indexer_1.CellCollector(INDEXER, query);
    let balance = BigInt(0);
    try {
        for (var _g = true, _h = __asyncValues(cellCollector.collect()), _j; _j = yield _h.next(), _a = _j.done, !_a; _g = true) {
            _c = _j.value;
            _g = false;
            const cell = _c;
            balance += hexToInt(cell.cellOutput.capacity);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
        }
        finally { if (e_1) throw e_1.error; }
    }
    ret.available = balance.toString();
    // query dao capacity locked in
    const config = (0, config_manager_1.getConfig)();
    const DAO_SCRIPT = config.SCRIPTS.DAO;
    if (!DAO_SCRIPT) {
        throw new Error("Provided config does not have DAO script setup!");
    }
    const daoQuery = {
        lock: (0, helpers_1.addressToScript)(ckbAddress),
        type: {
            codeHash: DAO_SCRIPT.CODE_HASH,
            hashType: DAO_SCRIPT.HASH_TYPE,
            args: "0x",
        },
    };
    const daoCellCollector = new ckb_indexer_1.CellCollector(INDEXER, daoQuery);
    balance = BigInt(0);
    try {
        for (var _k = true, _l = __asyncValues(daoCellCollector.collect()), _m; _m = yield _l.next(), _d = _m.done, !_d; _k = true) {
            _f = _m.value;
            _k = false;
            const cell = _f;
            balance += hexToInt(cell.cellOutput.capacity);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (!_k && !_d && (_e = _l.return)) yield _e.call(_l);
        }
        finally { if (e_2) throw e_2.error; }
    }
    ret.occupied = balance.toString();
    return ret;
});
exports.queryBalance = queryBalance;
/**
 * Find deposit cell based on a withdrawal cell.
 *
 * @param withdrawalCell - The Withdrawal cell based on which the deposit cell is searched.
 * @returns The trace of the deposit cell.
 */
const findDepositCellWith = (withdrawalCell) => __awaiter(void 0, void 0, void 0, function* () {
    const withdrawPhase1TxRecord = yield rpc.getTransaction(withdrawalCell.outPoint.txHash);
    const depositCellTrace = withdrawPhase1TxRecord.transaction.inputs[parseInt(withdrawalCell.outPoint.index, 16)];
    const depositTxRecord = yield rpc.getTransaction(depositCellTrace.previousOutput.txHash);
    const depositCellOutput = depositTxRecord.transaction.outputs[parseInt(depositCellTrace.previousOutput.index, 16)];
    let retCell = {
        cellOutput: {
            capacity: depositCellOutput.capacity,
            lock: depositCellOutput.lock,
            type: depositCellOutput.type,
        },
        data: depositTxRecord.transaction.outputsData[parseInt(depositCellTrace.previousOutput.index, 16)],
        blockHash: depositTxRecord.txStatus.blockHash,
        outPoint: depositCellTrace.previousOutput,
    };
    return retCell;
});
exports.findDepositCellWith = findDepositCellWith;
/**
 * Query transaction and check status.
 */
function waitForConfirmation(txid_1) {
    return __awaiter(this, arguments, void 0, function* (txid, updateProgress = (_status) => { }, options) {
        const defaults = {
            timeoutMs: 300000,
            recheckMs: 250,
            throwOnNotFound: true,
        };
        options = Object.assign(Object.assign({}, defaults), options);
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let timedOut = false;
            const timeoutTimer = options.timeoutMs !== 0
                ? setTimeout(() => {
                    timedOut = true;
                }, options.timeoutMs)
                : false;
            while (true) {
                if (timedOut)
                    return reject(Error("Transaction timeout."));
                const transaction = yield rpc.getTransaction(txid);
                if (!!transaction) {
                    const status = transaction.txStatus.status;
                    updateProgress(status);
                    if (status === "committed") {
                        if (timeoutTimer)
                            clearTimeout(timeoutTimer);
                        break;
                    }
                }
                else if (transaction === null) {
                    if (options.throwOnNotFound)
                        return reject(Error("Transaction was not found."));
                    else
                        updateProgress("not_found");
                }
                yield new Promise((resolve) => setTimeout(resolve, options.recheckMs));
            }
            return resolve();
        }));
    });
}
/**
 * Wait for transaction confirmation.
 *
 * @param txid - The transaction id / transaction hash.
 * @returns none.
 */
function waitForTransactionConfirmation(txid) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Waiting for transaction to confirm.");
        yield waitForConfirmation(txid, (_status) => console.log("."), {
            recheckMs: 3000,
        });
    });
}
/**
 * Decode epoch into a readable object.
 */
function parseEpochCompatible(epoch) {
    const _epoch = bi_1.BI.from(epoch);
    return {
        length: _epoch.shr(40).and(0xfff),
        index: _epoch.shr(24).and(0xfff),
        number: _epoch.and(0xffffff),
    };
}
/**
 * Enrich deposit information for UI control.
 *
 * @param cell - The deposit/withdraw cell.
 * @param isDeposit - Is this a deposit or a withdraw?
 * @param tipEpoch - The CKB blockchain tip epoch
 * @returns A CKB raw transaction.
 */
const enrichDaoCellInfo = (cell, isDeposit, tipEpoch) => __awaiter(void 0, void 0, void 0, function* () {
    if (cell.isDeposit == null) {
        cell.isDeposit = isDeposit;
        cell.blockHash = yield getBlockHash(cell.blockNumber);
        let depositBlockHeader;
        if (isDeposit) {
            depositBlockHeader = yield rpc.getHeader(cell.blockHash);
            cell.depositEpoch = parseEpochCompatible(depositBlockHeader.epoch).number.toNumber();
            const mod = (tipEpoch - cell.depositEpoch) % 180;
            // best interest + safest time (before the deposit enters another locking cycle)
            // to make a withdraw is in epoch range (168,180]  of the current cycle which is
            // about 12 epochs ~ 2 days
            cell.ripe = mod >= 168 && mod < 180 ? true : false;
        }
        else {
            const daoDepositCell = yield (0, exports.findDepositCellWith)(cell);
            const [depositBlockHeader, withdrawBlockHeader] = yield Promise.all([
                rpc.getHeader(daoDepositCell.blockHash),
                rpc.getHeader(cell.blockHash),
            ]);
            cell.depositEpoch = parseEpochCompatible(depositBlockHeader.epoch).number.toNumber();
            const withdrawEpoch = parseEpochCompatible(withdrawBlockHeader.epoch).number.toNumber();
            // TODO ripe can also be calculated as Math.ceil( (w-d)/180 ) * 180 + d + 1
            const earliestSince = common_scripts_1.dao.calculateDaoEarliestSince(depositBlockHeader.epoch, withdrawBlockHeader.epoch);
            const parsedSince = parseSince(earliestSince.toString());
            cell.sinceEpoch = parsedSince.value.number;
            cell.maximumWithdraw = common_scripts_1.dao
                .calculateMaximumWithdraw(cell, depositBlockHeader.dao, withdrawBlockHeader.dao)
                .toString();
            cell.ripe = tipEpoch > cell.sinceEpoch;
        }
        // enrich deposit info
        const step = tipEpoch - cell.depositEpoch;
        cell.completedCycles = Math.floor(step / 180);
        if (isDeposit == false && cell.ripe) {
            // when unlocking period arrives, current cycle halt at 100%
            cell.currentCycleProgress = 100;
        }
        else {
            cell.currentCycleProgress = Math.floor(((step % 180) * 100) / 180);
        }
        cell.cycleEndInterval = 180 - (step % 180);
    }
});
exports.enrichDaoCellInfo = enrichDaoCellInfo;
/**
 * Fetch tip epoch from CKB and return it
 */
const getTipEpoch = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentEpoch = yield rpc.getCurrentEpoch();
    return parseInt(currentEpoch.number, 16);
});
exports.getTipEpoch = getTipEpoch;
/**
 * A seeded random object, used in controling UI
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next(min, max) {
        // These numbers are constants used in the LCG algorithm.
        this.seed = (this.seed * 9301 + 49297) % 233280;
        const rnd = this.seed / 233280;
        return min + rnd * (max - min);
    }
}
exports.SeededRandom = SeededRandom;
/**
 * Verify if an address is joyID address or not
 */
const isJoyIdAddress = (address) => {
    const config = (0, config_manager_1.getConfig)();
    const script = (0, helpers_1.addressToScript)(address, { config });
    return (script.codeHash == config_1.JOYID_CELLDEP.codeHash
        && script.hashType == config_1.JOYID_CELLDEP.hashType);
};
exports.isJoyIdAddress = isJoyIdAddress;
/**
 * Verify if an address is an omnilock address or not
 */
const isOmnilockAddress = (address) => {
    const config = (0, config_manager_1.getConfig)();
    const script = (0, helpers_1.addressToScript)(address, { config });
    return (script.codeHash == config_1.OMNILOCK_CELLDEP.codeHash
        && script.hashType == config_1.OMNILOCK_CELLDEP.hashType);
};
exports.isOmnilockAddress = isOmnilockAddress;
/**
 * Verify if an address is secp256k1 address or not
 */
const isDefaultAddress = (address) => {
    const config = (0, config_manager_1.getConfig)();
    const script = (0, helpers_1.addressToScript)(address, { config });
    return (script.codeHash == config_1.NETWORK_CONFIG.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH
        && script.hashType == config_1.NETWORK_CONFIG.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE);
};
exports.isDefaultAddress = isDefaultAddress;
/**
 * A workardound for joyID transaction fee since
 * joyID witness size varies + lumos doesn't support yet
 *
 * @param transaction - The transaction skeleton.
 * @returns A regulated transaction.
 */
const insertJoyIdWithnessPlaceHolder = (transaction) => {
    let inputIndex = 0;
    for (const input of transaction.inputs) {
        const keyPath = ["witnesses", inputIndex];
        let witnessRaw = transaction.getIn(keyPath);
        const lockScriptWitness = (inputIndex == 0) ? config_1.JOYID_SIGNATURE_PLACEHOLDER_DEFAULT : "0x";
        if (witnessRaw === undefined) {
            witnessRaw = codec_1.bytes.hexify(base_1.blockchain.WitnessArgs.pack({
                lock: lockScriptWitness,
            }));
            transaction = transaction.setIn(keyPath, witnessRaw);
        }
        else {
            const withnessArgs = base_1.blockchain.WitnessArgs.unpack(witnessRaw);
            withnessArgs.lock = lockScriptWitness;
            witnessRaw = codec_1.bytes.hexify(base_1.blockchain.WitnessArgs.pack(withnessArgs));
            transaction = transaction.setIn(keyPath, witnessRaw);
        }
        inputIndex++;
    }
    return transaction;
};
exports.insertJoyIdWithnessPlaceHolder = insertJoyIdWithnessPlaceHolder;
/**
 * Get transaction fee from a transaction
 *
 * @param transaction - The transaction skeleton.
 * @param reward - Reward in case of a DAO unlock transaction.
 * @returns A regulated transaction.
 */
const getFee = (transaction, reward = null) => {
    const inputCapacity = transaction.inputs
        .toArray()
        .reduce((a, c) => a + hexToInt(c.cellOutput.capacity), BigInt(0));
    const outputCapacity = transaction.outputs
        .toArray()
        .reduce((a, c) => a + hexToInt(c.cellOutput.capacity), BigInt(0));
    // dao unlocking
    if (reward != null)
        return Number(inputCapacity + reward - outputCapacity);
    return Number(inputCapacity - outputCapacity);
};
exports.getFee = getFee;
/**
 * Decode dao data from block header dao
 */
function extractDaoDataCompatible(dao) {
    if (!/^(0x)?([0-9a-fA-F]){64}$/.test(dao)) {
        throw new Error("Invalid dao format!");
    }
    const len = 8 * 2;
    const hex = dao.startsWith("0x") ? dao.slice(2) : dao;
    return ["c", "ar", "s", "u"]
        .map((key, i) => {
        return {
            [key]: codec_1.number.Uint64LE.unpack("0x" + hex.slice(len * i, len * (i + 1))),
        };
    })
        .reduce((result, c) => (Object.assign(Object.assign({}, result), c)), {});
}
/**
 * Estimate reward when withdraw transaction is requested
 *
 * @param depositCell - The deposit cell being withdrawn.
 * @param tipEpoch - The CKB blockchain tip epoch
 * @returns Reward estimation.
 */
const estimateReturn = (depositCell, tipEpoch) => __awaiter(void 0, void 0, void 0, function* () {
    const c_o = config_1.DAO_MINIMUM_CAPACITY;
    const c_t = parseInt(depositCell.cellOutput.capacity, 16) / config_1.CKB_SHANNON_RATIO;
    const [depositHeader, tipHeader] = yield Promise.all([
        rpc.getHeader(depositCell.blockHash),
        rpc.getTipHeader(),
    ]);
    const depositDaoData = extractDaoDataCompatible(depositHeader.dao);
    const tipDaoData = extractDaoDataCompatible(tipHeader.dao);
    const result = (c_t - c_o) * (bi_1.BI.from(tipDaoData.ar).toNumber()) / (bi_1.BI.from(depositDaoData.ar).toNumber()) + c_o;
    return result;
});
exports.estimateReturn = estimateReturn;
