import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {ChainAssets} from '../../classes/chain-asstes.class';
import * as echarts from 'echarts';

@Component({
  selector: 'app-assets-chain-info',
  templateUrl: './assets-chain-info.component.html',
  styleUrls: ['./assets-chain-info.component.scss']
})


export class AssetsChainInfoComponent implements OnInit, OnDestroy {
  public showLoading: boolean;
  currentPage = 1;

  public networkURLPrefix: string;
  private fragmentSubsription: Subscription;
  private networkSubscription: Subscription;
  public symbolInfo: string;
  public showAuthInfoKey: string;
  public assetInfo: ChainAssets[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {

  }


  ngOnInit(): void {
    this.showLoading = true;

    this.activatedRoute.paramMap.pipe().subscribe(params => {
      if (params.get("symbol")) {
        this.symbolInfo = params.get("symbol");
      }
    });

    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();

      this.fragmentSubsription = this.activatedRoute.queryParams.subscribe(params => {
        this.showLoading = true;
        this.currentPage = +params.page || 1;
        this.getChainAssetInfo(this.currentPage);
        this.getHistoryPrice(this.currentPage);
      });
    });
    // this.initChart();
  }

  initChart(xData, yData) {
    const chartDom = document.getElementById('history-chart');
    const myChart = echarts.init(chartDom);
    let option;
    option = {
      title: {
        text: 'Token Price History',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#5a8ff8'
          }
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xData
      },
      yAxis: {
        type: 'value',
        scale: true,
      },
      series: [
        {
          data: yData,
          type: 'line',
          stack: 'Total',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 1,
            color: '#5a8ff8'
          },
          areaStyle: {
            opacity: 0.8,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(219, 229, 254 ,0.95)'
              },
              {
                offset: 1,
                color: 'rgba(219, 229, 254 ,0.35)'
              }
            ])
          },
          emphasis: {
            focus: 'series'
          },
        }
      ]
    };
    if (option) {
      myChart.setOption(option);
    }
  }

  getHistoryPrice(pageIndex) {
    const url = this.appConfigService.getNetworkApiUrlRoot() + '/oracle/symbol/' + this.symbolInfo + '?' + 'page[number]=' + pageIndex + '&page[size]=' + 25 * pageIndex;
    this.http.get(url)
      .subscribe(res => {
        const historyDate = [];
        const historyPrice = [];
        res['data']['data'].forEach(item => {
          const asset = {};
          asset['symbol'] = this.symbolInfo;
          asset['price'] = item[1] / 10000;
          asset['auth'] = item[4];
          asset['block'] = item[0];
          asset['precision'] = item[2];
          asset['time'] = new Date(item[3] * 1000).toLocaleString();
          historyDate.push(asset['time']);
          historyPrice.push(asset['price']);
        });
        this.initChart(historyDate.reverse(), historyPrice.reverse());
      });
  }

  getChainAssetInfo(pageIndex) {
    console.log('get on chain asset page:', pageIndex);
    const url = this.appConfigService.getNetworkApiUrlRoot() + '/oracle/symbol/' + this.symbolInfo + '?' + 'page[number]=' + pageIndex + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        const assets = [];
        res['data']['data'].forEach(item => {
          const asset = {};
          asset['symbol'] = this.symbolInfo;
          asset['price'] = item[1] / 10000;
          asset['auth'] = item[4];
          asset['block'] = item[0];
          asset['precision'] = item[2];
          asset['time'] = new Date(item[3] * 1000).toLocaleString();
          assets.push(asset);
        });
        this.assetInfo = assets;
      });
  }

  showAuthInfo(key: string) {
    if (key === this.showAuthInfoKey) {
      this.showAuthInfoKey = '';
    } else {
      this.showAuthInfoKey = key;
    }
  }

  ngOnDestroy(): void {
    this.networkSubscription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
  }


}
