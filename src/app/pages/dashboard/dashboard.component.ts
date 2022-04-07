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
 * dashboard.component.ts
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Block} from '../../classes/block.class';
import {interval, Observable, Subscription, of} from 'rxjs';
import {Networkstats} from '../../classes/networkstats.class';
import {BlockService} from '../../services/block.service';
import {ChainAssetsService} from '../../services/chain-assets.service';
import {NetworkstatsService} from '../../services/networkstats.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {AppConfigService} from '../../services/app-config.service';
import {environment} from '../../../environments/environment';
import {AnalyticsChart} from '../../classes/analytics-chart.class';
import {AnalyticsChartService} from '../../services/analytics-chart.service';
import { ChainAssets } from 'src/app/classes/chain-asstes.class';
import {ChainRequestService} from '../../services/chain-request.service';
import {ChainRequest} from '../../classes/chain-request.class';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  public blocks: DocumentCollection<Block>;
  // public chainAssets: DocumentCollection<ChainAssets>;
  public balanceTransfers: DocumentCollection<BalanceTransfer>;
  public networkstats$: Observable<Networkstats>;

  blockSearchText: string;
  private blockUpdateSubsription: Subscription;

  private networkSubscription: Subscription;
  public networkURLPrefix: string;
  public networkTokenDecimals = 0;
  public networkTokenSymbol = '';
  public networkColor: string;

  public averageBlocktimeDaychart$: Observable<AnalyticsChart>;
  public totalTransactionsDaychart$: Observable<AnalyticsChart>;
  public cumulativeAccountsDayChart$: Observable<AnalyticsChart>;

  public aresRank: number;
  public aresCap: number;
  public aresVol: number;
  public chainData: object = {};
  public chainAssets: ChainAssets[] = [];
  public chainRequest: ChainRequest[] = [];
  public chainEraRequest: object [] = [];
  public chainReward: object [] = [];
  isLoadingEraRequest = false;
  isLoadingChart = false;
  public validator: object [] = [];

  constructor(
    private blockService: BlockService,
    private balanceTransferService: BalanceTransferService,
    private networkstatsService: NetworkstatsService,
    private appConfigService: AppConfigService,
    private analyticsChartService: AnalyticsChartService,
    private chainAssetsService: ChainAssetsService,
    private chainRequestService: ChainRequestService,
    private router: Router,
    private http: HttpClient) {

  }

  ngOnInit() {
    this.blockSearchText = '';

    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();
      this.networkTokenDecimals = +network.attributes.token_decimals;
      this.networkTokenSymbol = network.attributes.token_symbol;
      this.getBlocks();
      this.networkstats$ = this.networkstatsService.get('latest');

      // Retrieve charts
      // if (environment.jsonApiDiscoveryRootUrl) {

      this.networkColor = '#' + network.attributes.color_code;

      // this.chainAssetsService.all().subscribe( assets => {
      //   console.log('assets', assets);
      // });

      this.getChainAsset();
      this.getChainRequest();
      // this.getChainEraRequest();
      this.getChainReward();
      this.getValidator();

      // this.totalTransactionsDaychart$ = this.analyticsChartService.get('utcday-extrinsics_signed-sum-line-14');
      // this.cumulativeAccountsDayChart$ = this.analyticsChartService.get('utcday-accounts_new-sum-line-14');
      // this.averageBlocktimeDaychart$ = this.analyticsChartService.get('utcday-blocktime-avg-line-14');
    });

    const blockUpdateCounter = interval(6000);

    this.blockUpdateSubsription = blockUpdateCounter.subscribe( n => {
      this.getBlocks();
      this.networkstats$ = this.networkstatsService.get('latest');
    });

    this.getAresData();
    this.getChainData();

    window.addEventListener('scroll', (event) => {
      let scrollTop = 0;
      if (document.documentElement && document.documentElement.scrollTop) {
        scrollTop = document.documentElement.scrollTop;
      } else if (document.body) {
        scrollTop = document.body.scrollTop;
      }

      if (scrollTop > 200 && this.chainEraRequest.length === 0 && !this.isLoadingEraRequest) {
        this.getChainEraRequest();
      }

      if (scrollTop > 300 && !this.averageBlocktimeDaychart$ && !this.isLoadingChart) {
        this.getChart();
      }
    });
  }

  getAresData(): void {
    this.http.get('https://api.aresprotocol.io/api/getAresAll')
      .subscribe(res => {
        const result = res;
        this.aresCap = result['data'].market_cap.toFixed(0);
        this.aresRank = result['data'].rank;
        this.aresVol = result['data'].volume.toFixed(0);
      });
  }


  getChainData(): void {
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/chain";
    this.http.get(url)
      .subscribe(res => {
        this.chainData = res['data'];
      });

  }

  getChart() {
    this.isLoadingChart = true;
    this.analyticsChartService.all().subscribe(chartData => {
      chartData.data.forEach(chart => {
        if (chart.id === 'utcday-extrinsics_signed-sum-line-14') {
          this.totalTransactionsDaychart$ = of(chart);
        }

        if (chart.id === 'utcday-accounts_new-sum-line-14') {
          this.cumulativeAccountsDayChart$ = of(chart);
        }

        if (chart.id === 'utcday-blocktime-avg-line-14') {
          this.averageBlocktimeDaychart$ = of(chart);
        }
      });
    });
  }

  getChainAsset(): void {
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/symbols";
    this.http.get(url)
      .subscribe(res => {
        res['data'].forEach(item => {
          item.price = item.price / 10000;
        });
        this.chainAssets = res['data'];
      });
  }

  getChainRequest(): void {
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/requests";
    this.http.get(url)
      .subscribe(res => {
        this.chainRequest = res['data'];
        res['data'].forEach(item => {
          item.attributes.prepayment = item.attributes.prepayment / 1000000000000;
          item.attributes.payment = item.attributes.payment / 1000000000000;
          item.attributes.keys = item.attributes.result ? Object.keys(item.attributes.result) : "-";
          if (item.attributes.symbols.length > 0) {
            item.attributes.requester = item.attributes.auth[item.attributes.symbols[0]].length;
          } else {
            item.attributes.requester = "-";
          }
        });
      });
  }

  getChainEraRequest(): void {
    this.isLoadingEraRequest = true;
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/era_requests";
    this.http.get(url)
      .subscribe(res => {
        this.chainEraRequest = res['data'];
        res['data'].forEach(item => {
          item.attributes.era_total_fee = item.attributes.era_total_fee / 1000000000000;
        });
      });
  }

  getChainReward(): void {
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/reward";
    this.http.get(url)
      .subscribe(res => {
        this.chainReward = res['data']['data'];
        res['data']['data'].forEach(item => {
          item.reward = (item.reward / 1000000000000).toFixed(2);
        });
      });
  }

  getValidator(): void {
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/pre_check_tasks";
    this.http.get(url)
      .subscribe(res => {
        this.validator = res['data'];
      });
  }

  getBlocks(): void {
    this.blockService.all({
      page: {number: 0}
    }).subscribe(blocks => (this.blocks = blocks));


    this.balanceTransferService.all({
      page: {number: 0}
    }).subscribe(balanceTransfers => (this.balanceTransfers = balanceTransfers));

  }

  search(): void {
    // Strip whitespace from search text
    this.blockSearchText = this.blockSearchText.trim();
    if (this.blockSearchText !== '') {
      this.router.navigate([this.networkURLPrefix, 'analytics', 'search', this.blockSearchText]);
    }
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    this.blockUpdateSubsription.unsubscribe();
    this.networkSubscription.unsubscribe();
  }
}
