import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {ChainAssets} from '../../classes/chain-asstes.class';


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
      });
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
