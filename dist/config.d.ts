export declare const ISMAINNET = false;
export declare const NODE_URL: string;
export declare const INDEXER_URL: string;
export declare const JOYID_CELLDEP: {
    codeHash: string;
    hashType: string;
    outPoint: {
        txHash: string;
        index: string;
    };
    depType: string;
};
export declare const OMNILOCK_CELLDEP: {
    codeHash: string;
    hashType: string;
    outPoint: {
        txHash: string;
        index: string;
    };
    depType: string;
};
export declare const NETWORK_CONFIG: {
    PREFIX: string;
    SCRIPTS: {
        SECP256K1_BLAKE160: {
            CODE_HASH: string;
            HASH_TYPE: string;
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: string;
            SHORT_ID?: undefined;
        };
        SECP256K1_BLAKE160_MULTISIG: {
            CODE_HASH: string;
            HASH_TYPE: string;
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: string;
            SHORT_ID?: undefined;
        };
        DAO: {
            CODE_HASH: string;
            HASH_TYPE: string;
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: string;
        };
    };
} | {
    PREFIX: string;
    SCRIPTS: {
        SECP256K1_BLAKE160: {
            CODE_HASH: string;
            HASH_TYPE: string;
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: string;
            SHORT_ID: number;
        };
        SECP256K1_BLAKE160_MULTISIG: {
            CODE_HASH: string;
            HASH_TYPE: string;
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: string;
            SHORT_ID: number;
        };
        DAO: {
            CODE_HASH: string;
            HASH_TYPE: string;
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: string;
        };
    };
};
export declare const FEE_RATE: number;
export declare const MIN_FEE_RATE = 1000;
export declare const DAO_MINIMUM_CAPACITY = 104;
export declare const MINIMUM_CHANGE_CAPACITY = 63;
export declare const CKB_SHANNON_RATIO = 100000000;
export declare const JOYID_SIGNATURE_PLACEHOLDER_DEFAULT: string;
export declare const EXPLORER_PREFIX: string;
export declare const COTA_AGGREGATOR_URL: string;
