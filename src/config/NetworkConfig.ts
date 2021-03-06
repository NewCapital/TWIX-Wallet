/*
 * Copyright 2020 NEM (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */

export interface NodeConfig {
    roles: number;
    friendlyName: string;
    url: string;
}

export interface NetworkConfigurationDefaults {
    maxTransactionsPerAggregate: number;
    maxMosaicDuration: number;
    lockedFundsPerAggregate: string;
    maxNamespaceDuration: number;
    maxCosignatoriesPerAccount: number;
    maxMosaicAtomicUnits: number;
    blockGenerationTargetTime: number;
    currencyMosaicId: string;
    namespaceGracePeriodDuration: number;
    harvestingMosaicId: string;
    minNamespaceDuration: number;
    maxCosignedAccountsPerAccount: number;
    maxNamespaceDepth: number;
    defaultDynamicFeeMultiplier: number;
    maxMosaicDivisibility: number;
    maxMessageSize: number;
    epochAdjustment: number;
    totalChainImportance: number;
    generationHash: string;
}

export interface NetworkConfig {
    faucetUrl: string;
    nodes: NodeConfig[];
    defaultNetworkType: number;
    explorerUrl: string;
    networkConfigurationDefaults: NetworkConfigurationDefaults;
}

export const defaultTestnetNetworkConfig: NetworkConfig = {
    explorerUrl: 'http://e.twix.live',
    faucetUrl: 'https://f.twix.live',
    defaultNetworkType: 152,
    networkConfigurationDefaults: {
        maxMosaicDivisibility: 8,
        namespaceGracePeriodDuration: 60,
        lockedFundsPerAggregate: '10000000',
        maxCosignatoriesPerAccount: 25,
        blockGenerationTargetTime: 30,
        maxNamespaceDepth: 3,
        maxMosaicDuration: 315360000,
        minNamespaceDuration: 60,
        maxNamespaceDuration: 6307200,
        maxTransactionsPerAggregate: 100,
        maxCosignedAccountsPerAccount: 25,
        maxMessageSize: 4096,
        maxMosaicAtomicUnits: 100000000000000,
        currencyMosaicId: '7831128EAA6516FC',
        harvestingMosaicId: '7831128EAA6516FC',
        defaultDynamicFeeMultiplier: 100,
        epochAdjustment: 1514757600,
        totalChainImportance: 1000000000000000,
        generationHash: '9249D4D090E32363E1817F737EDDE828184CFA95DA084A94C6CD59053CDDB19E',
    },
    nodes: [
        { friendlyName: 'TWIX-dual-0', roles: 2, url: 'http://20.52.157.15:3000' },
        { friendlyName: 'TWIX-dual-1', roles: 2, url: 'http://20.52.233.206:3000' },
    ],
};

export const defaultMainnetNetworkConfig: NetworkConfig = {
    explorerUrl: 'http://e.twix.live',
    faucetUrl: 'https://f.twix.live',
    defaultNetworkType: 104,
    networkConfigurationDefaults: {
        maxMosaicDivisibility: 8,
        namespaceGracePeriodDuration: 60,
        lockedFundsPerAggregate: '10000000',
        maxCosignatoriesPerAccount: 25,
        blockGenerationTargetTime: 30,
        maxNamespaceDepth: 3,
        maxMosaicDuration: 315360000,
        minNamespaceDuration: 60,
        maxNamespaceDuration: 6307200,
        maxTransactionsPerAggregate: 100,
        maxCosignedAccountsPerAccount: 25,
        maxMessageSize: 4096,
        maxMosaicAtomicUnits: 100000000000000,
        currencyMosaicId: '7831128EAA6516FC',
        harvestingMosaicId: '7831128EAA6516FC',
        defaultDynamicFeeMultiplier: 100,
        epochAdjustment: 1514757600,
        totalChainImportance: 1000000000000000,
        generationHash: '9249D4D090E32363E1817F737EDDE828184CFA95DA084A94C6CD59053CDDB19E',
    },
    nodes: [
        { friendlyName: 'TWIX-dual-0', roles: 2, url: 'http://20.52.157.15:3000' },
        { friendlyName: 'TWIX-dual-1', roles: 2, url: 'http://20.52.233.206:3000' },
    ],
};


const defaultNetworkConfig: Record<number, NetworkConfig> = {
    152: defaultTestnetNetworkConfig,
    104: defaultMainnetNetworkConfig,
};

const resolvedNetworkConfig: NetworkConfig = window['networkConfig'] || defaultNetworkConfig;
console.log('networkConfig resolved!', resolvedNetworkConfig);
export const networkConfig = resolvedNetworkConfig;
