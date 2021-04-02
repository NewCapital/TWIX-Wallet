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
// configuration
import { appConfig } from '@/config';
// internal dependencies
import { BroadcastResult } from '@/core/transactions/BroadcastResult';
import i18n from '@/language';
import { from, Observable, of, OperatorFunction, throwError } from 'rxjs';
import { catchError, flatMap, map, switchMap, tap, timeoutWith } from 'rxjs/operators';
import {
    Account,
    CosignatureSignedTransaction,
    CosignatureTransaction,
    IListener,
    NetworkType,
    RepositoryFactory,
    SignedTransaction,
    Transaction,
    TransactionService,
    TransactionType,
} from 'symbol-sdk';
import { TransactionAnnounceResponse } from 'symbol-sdk/dist/src/model/transaction/TransactionAnnounceResponse';
import { Store } from 'vuex';

const { ANNOUNCE_TRANSACTION_TIMEOUT } = appConfig.constants;

/// end-region custom types

export interface TransactionSigner {
    signTransaction(t: Transaction, generationHash: string): Observable<SignedTransaction>;

    signCosignatureTransaction(t: CosignatureTransaction): Observable<CosignatureSignedTransaction>;
}

export class AccountTransactionSigner implements TransactionSigner {
    constructor(private readonly account: Account) {}

    signTransaction(t: Transaction, generationHash: string): Observable<SignedTransaction> {
        return of(this.account.sign(t, generationHash));
    }
    signCosignatureTransaction(t: CosignatureTransaction): Observable<CosignatureSignedTransaction> {
        return of(this.account.signCosignatureTransaction(t));
    }
}

export class TransactionAnnouncerService {
    /**
     * Vuex Store
     * @var {Vuex.Store}
     */
    public $store: Store<any>;

    private readonly transactionTimeout = ANNOUNCE_TRANSACTION_TIMEOUT;

    private networkType: NetworkType;

    /**
     * Construct a service instance around \a store
     * @param store
     */
    constructor(store: Store<any>) {
        this.$store = store;
        this.networkType = this.$store.getters['network/networkType'];
    }

    public announce(signedTransaction: SignedTransaction): Observable<BroadcastResult> {
        const listener: IListener = this.$store.getters['account/listener'];
        const service = this.createService();
        return service
            .announce(signedTransaction, listener)
            .pipe(this.timeout(this.timeoutMessage(signedTransaction.type)))
            .pipe(map((t) => this.createBroadcastResult(signedTransaction, t)));
    }

    private retrySubscribe() {
        const address = this.$store.getters['account/currentAccountAddress'];
        this.$store.dispatch('account/UNSUBSCRIBE', address);
        this.$store.dispatch('account/SUBSCRIBE', address);
    }

    private timeout<T, R>(message: string): OperatorFunction<T, T> {
        const listener: IListener = this.$store.getters['account/listener'];
        if (!listener.isOpen()) {
            this.retrySubscribe();
        }
        if (!this.transactionTimeout) {
            return (o) => o;
        }
        const operatorFunction: any = timeoutWith(this.transactionTimeout, throwError(new Error(message)));
        return operatorFunction as OperatorFunction<T, T>;
    }

    private timeoutMessage(transactionType: TransactionType): string {
        return `${i18n.t(`transaction_descriptor_${transactionType}`)} Transaction has timed out.`;
    }

    private createService() {
        const repositoryFactory: RepositoryFactory = this.$store.getters['network/repositoryFactory'];
        return new TransactionService(repositoryFactory.createTransactionRepository(), repositoryFactory.createReceiptRepository());
    }

    public announceHashAndAggregateBonded(
        signedHashLockTransaction: SignedTransaction,
        signedAggregateTransaction: SignedTransaction,
    ): Observable<BroadcastResult> {
        const repositoryFactory = this.$store.getters['network/repositoryFactory'] as RepositoryFactory;
        const hashLockListener: IListener = repositoryFactory.createListener();
        return from(hashLockListener.open()).pipe(
            switchMap(() => {
                hashLockListener.unconfirmedAdded(this.$store.getters['account/currentAccountAddress']);
                const service = this.createService();
                return service
                    .announceHashLockAggregateBonded(signedHashLockTransaction, signedAggregateTransaction, hashLockListener)
                    .pipe(this.timeout(this.timeoutMessage(signedHashLockTransaction.type)))
                    .pipe(
                        tap(() => {
                            hashLockListener.close();
                            console.log('hashAndAggregateBonded listener is closed!');
                        }),
                    )
                    .pipe(
                        catchError((e) => {
                            hashLockListener.close();
                            console.log('hashAndAggregateBonded listener is closed due to error!');
                            return of(e as Error);
                        }),
                    )
                    .pipe(map((t) => this.createBroadcastResult(signedAggregateTransaction, t)));
            }),
        );
    }

    public announceChainedBinary(first: SignedTransaction, second: SignedTransaction): Observable<BroadcastResult> {
        const listener: IListener = this.$store.getters['account/listener'];
        const service = this.createService();
        return service
            .announce(first, listener)
            .pipe(this.timeout(this.timeoutMessage(first.type)))
            .pipe(flatMap(() => service.announce(second, listener).pipe(this.timeout(this.timeoutMessage(second.type)))))

            .pipe(catchError((e) => of(e as Error)))
            .pipe(map((t) => this.createBroadcastResult(second, t)));
    }

    public announceAggregateBondedCosignature(singedTransaction: CosignatureSignedTransaction): Observable<BroadcastResult> {
        const repositoryFactory = this.$store.getters['network/repositoryFactory'] as RepositoryFactory;
        const transactionHttp = repositoryFactory.createTransactionRepository();
        return transactionHttp
            .announceAggregateBondedCosignature(singedTransaction)
            .pipe(this.timeout('Cosignature Transaction has timed out'))
            .pipe(map((t) => this.createBroadcastResult(singedTransaction, t)));
    }

    private createBroadcastResult(
        signedTransaction: SignedTransaction | CosignatureSignedTransaction,
        transactionOrError: Error | Transaction | TransactionAnnounceResponse,
    ): BroadcastResult {
        if (transactionOrError instanceof Error) {
            return new BroadcastResult(signedTransaction, undefined, false, transactionOrError.message);
        } else if (transactionOrError instanceof Transaction) {
            return new BroadcastResult(signedTransaction, transactionOrError, true);
        } else {
            return new BroadcastResult(signedTransaction, undefined, true);
        }
    }
}
