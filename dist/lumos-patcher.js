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
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlock = void 0;
//////////////////////////////////////////////////////////////////////////////////////////
// This is a temporary code since lumos::common-script::unlock doesn't work with joyID
//////////////////////////////////////////////////////////////////////////////////////////
const base_1 = require("@ckb-lumos/base");
const rpc_1 = require("@ckb-lumos/rpc");
const bi_1 = require("@ckb-lumos/bi");
const helpers_1 = require("./lib/helpers");
const common_scripts_1 = require("@ckb-lumos/common-scripts");
const codec_1 = require("@ckb-lumos/codec");
const helpers_2 = require("./lib/helpers");
const config_manager_1 = require("@ckb-lumos/config-manager");
const config_1 = require("./config");
const helpers_3 = require("@ckb-lumos/helpers");
const DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE = bi_1.BI.from(180);
const rpc = new rpc_1.RPC(config_1.NODE_URL);
/**
 * Add celldep to transaction.
 */
function _addCellDep(txSkeleton, newCellDep) {
    const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
        return (cellDep.depType === newCellDep.depType &&
            new base_1.values.OutPointValue(cellDep.outPoint, { validate: false }).equals(new base_1.values.OutPointValue(newCellDep.outPoint, { validate: false })));
    });
    if (!cellDep) {
        txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
            return cellDeps.push({
                outPoint: newCellDep.outPoint,
                depType: newCellDep.depType,
            });
        });
    }
    return txSkeleton;
}
/**
 * unlock helper
 */
function _epochSinceCompatible({ length, index, number, }) {
    const _length = bi_1.BI.from(length);
    const _index = bi_1.BI.from(index);
    const _number = bi_1.BI.from(number);
    return bi_1.BI.from(0x20)
        .shl(56)
        .add(_length.shl(40))
        .add(_index.shl(24))
        .add(_number);
}
/**
 * unlock helper
 */
function _parseEpochCompatible(epoch) {
    const _epoch = bi_1.BI.from(epoch);
    return {
        length: _epoch.shr(40).and(0xfff),
        index: _epoch.shr(24).and(0xfff),
        number: _epoch.and(0xffffff),
    };
}
/**
 * Generate DAO unlock transaction structure with zero fee added.
 * This is a modified version and a temporary replacement for
 * lumos::common-script::unlock function
 */
const unlock = (txSkeleton, fromAddress, daoWithdrawalCell) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const config = (0, config_manager_1.getConfig)();
    const DAO_SCRIPT = config.SCRIPTS.DAO;
    if (!DAO_SCRIPT)
        throw new Error("Provided config does not have DAO script setup!");
    // add celldeps
    const template = config.SCRIPTS.DAO;
    const daoCellDep = {
        outPoint: {
            txHash: template.TX_HASH,
            index: template.INDEX,
        },
        depType: template.DEP_TYPE,
    };
    txSkeleton = _addCellDep(txSkeleton, daoCellDep);
    const fromScript = (0, helpers_3.addressToScript)(fromAddress, { config });
    if (fromScript.codeHash == config_1.JOYID_CELLDEP.codeHash) {
        txSkeleton = _addCellDep(txSkeleton, {
            outPoint: config_1.JOYID_CELLDEP.outPoint,
            depType: config_1.JOYID_CELLDEP.depType,
        });
    }
    else if (fromScript.codeHash == config_1.OMNILOCK_CELLDEP.codeHash) {
        txSkeleton = _addCellDep(txSkeleton, {
            outPoint: config_1.OMNILOCK_CELLDEP.outPoint,
            depType: config_1.OMNILOCK_CELLDEP.depType,
        });
        txSkeleton = _addCellDep(txSkeleton, {
            outPoint: {
                txHash: config.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
                index: config.SCRIPTS.SECP256K1_BLAKE160.INDEX,
            },
            depType: (_a = config.SCRIPTS.SECP256K1_BLAKE160) === null || _a === void 0 ? void 0 : _a.DEP_TYPE,
        });
    }
    else {
        throw new Error("Only joyId and omnilock addresses are supported");
    }
    // find the deposit cell and
    // enrich DAO withdrawal cell data with block hash info
    const [daoDepositCell, withdrawBlkHash] = yield Promise.all([
        (0, helpers_2.findDepositCellWith)(daoWithdrawalCell),
        (0, helpers_1.getBlockHash)(daoWithdrawalCell.blockNumber),
    ]);
    daoWithdrawalCell.blockHash = withdrawBlkHash;
    // calculate since & capacity (interest)
    const [depositBlockHeader, withdrawBlockHeader] = yield Promise.all([
        rpc.getHeader(daoDepositCell.blockHash),
        rpc.getHeader(daoWithdrawalCell.blockHash),
    ]);
    const depositEpoch = _parseEpochCompatible(depositBlockHeader.epoch);
    const withdrawEpoch = _parseEpochCompatible(withdrawBlockHeader.epoch);
    const withdrawFraction = withdrawEpoch.index.mul(depositEpoch.length);
    const depositFraction = depositEpoch.index.mul(withdrawEpoch.length);
    let depositedEpochs = withdrawEpoch.number.sub(depositEpoch.number);
    if (withdrawFraction.gt(depositFraction)) {
        depositedEpochs = depositedEpochs.add(1);
    }
    const lockEpochs = depositedEpochs
        .add(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE)
        .sub(1)
        .div(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE)
        .mul(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE);
    const minimalSinceEpoch = {
        number: bi_1.BI.from(depositEpoch.number.add(lockEpochs)),
        index: bi_1.BI.from(depositEpoch.index),
        length: bi_1.BI.from(depositEpoch.length),
    };
    const minimalSince = _epochSinceCompatible(minimalSinceEpoch);
    const since = "0x" + minimalSince.toString(16);
    // adding dao withdrawal cell as the first input
    txSkeleton = txSkeleton.update("inputs", (i) => i.push(daoWithdrawalCell));
    if (since) {
        txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
            return inputSinces.set(txSkeleton.get("inputs").size - 1, since);
        });
    }
    // add dao unlock header deps
    let headerDeps = txSkeleton.get("headerDeps");
    if (!headerDeps.contains(daoDepositCell.blockHash)) {
        txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
            return headerDeps.push(daoDepositCell.blockHash);
        });
    }
    if (!headerDeps.contains(daoWithdrawalCell.blockHash)) {
        txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
            return headerDeps.push(daoWithdrawalCell.blockHash);
        });
    }
    // add dao unlock witness
    headerDeps = txSkeleton.get("headerDeps");
    const depositHeaderDepIndex = headerDeps.indexOf(daoDepositCell.blockHash);
    const defaultWitnessArgs = {
        inputType: codec_1.bytes.hexify(codec_1.number.Uint64LE.pack(depositHeaderDepIndex)),
    };
    const defaultWitness = codec_1.bytes.hexify(base_1.blockchain.WitnessArgs.pack(defaultWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
        return witnesses.push(defaultWitness);
    });
    // adding output
    const outputCapacity = "0x" +
        common_scripts_1.dao
            .calculateMaximumWithdrawCompatible(daoWithdrawalCell, depositBlockHeader.dao, withdrawBlockHeader.dao)
            .toString(16);
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.push({
            cellOutput: {
                capacity: outputCapacity,
                lock: (0, helpers_3.addressToScript)(fromAddress),
                type: undefined,
            },
            data: "0x",
            outPoint: undefined,
            blockHash: undefined,
        });
    });
    return txSkeleton;
});
exports.unlock = unlock;
exports.default = {
    unlock: exports.unlock,
};
