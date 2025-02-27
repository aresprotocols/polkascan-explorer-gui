/*
 * Polkascan Explorer GUI
 *
 * Copyright 2018-2020 openAware BV (NL).
 * This file is part of Polkascan.
 *
 * Polkascan is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Polkascan is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Polkascan. If not, see <http://www.gnu.org/licenses/>.
 *
 * transaction-detail.component.ts
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subscription} from 'rxjs';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {switchMap, tap} from 'rxjs/operators';
import {Extrinsic} from '../../classes/extrinsic.class';
import {ExtrinsicService} from '../../services/extrinsic.service';
import {AppConfigService} from '../../services/app-config.service';
import {EventService} from '../../services/event.service';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss']
})
export class TransactionDetailComponent implements OnInit, OnDestroy {

  extrinsic$: Observable<Extrinsic>;

  private networkSubscription: Subscription;
  public networkURLPrefix: string;
  public networkTokenDecimals: number;
  public networkTokenSymbol: string;
  public resourceNotFound: boolean;
  public transactionHash: string;
  public countDown: number;

  constructor(
    private route: ActivatedRoute,
    private extrinsicService: ExtrinsicService,
    private eventService: EventService,
    private appConfigService: AppConfigService
  ) { }

  ngOnInit() {
    this.countDown = 6;

    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();

      this.networkTokenDecimals = +network.attributes.token_decimals;
      this.networkTokenSymbol = network.attributes.token_symbol;

      this.resourceNotFound = false;

      this.extrinsic$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
          this.transactionHash = params.get('id');
          return this.extrinsicService.get(params.get('id'), { include: ['events'] });
        })
      ).pipe(
        tap((extrinsic: Extrinsic) => {
          let fee;
          // console.log("extrinsic", extrinsic);
          extrinsic['relationships']['events']['data'].forEach((item) => {
            if (item['attributes']['event_id'] === 'Withdraw') {
              try {
                // console.log("item", item['attributes']['attributes']);
                fee = item['attributes']['attributes'][1]['value'];
              } catch (e) {
                console.log('parse fee error');
              }
            }
          });
          // console.log("fee", fee);
          if (fee) {
            extrinsic['attributes']['fee'] = fee;
          }
          return extrinsic;
        })
      );

      this.extrinsic$.subscribe(res => {}, error => {
        if (error.status === 404) {
          this.resourceNotFound = true;

          this.processCountDown();

          setTimeout(() => {
            window.location.reload();
          }, 6000);
        }
      });
    });
  }

  processCountDown() {
    setTimeout(() => {
      this.countDown--;
      this.processCountDown();
    }, 1000);
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    this.networkSubscription.unsubscribe();
  }
}
