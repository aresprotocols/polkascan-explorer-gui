import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';
import {ChainAssets} from '../../classes/chain-asstes.class';
import {switchMap} from 'rxjs/operators';


@Component({
  selector: 'app-assets-on-chain',
  templateUrl: './assets-on-chain.component.html',
  styleUrls: ['./assets-on-chain.component.scss']
})


export class AssetsOnChainComponent implements OnInit, OnDestroy {

  public showLoading: boolean;
  currentPage = 1;
  private fragmentSubsription: Subscription;
  private networkSubscription: Subscription;
  private chainAssetsSubsription: Subscription;
  public networkURLPrefix: string;
  public chainAssets: ChainAssets[] = [];
  public tradePairsNum: string;
  public showAuthInfoKey: string;
  public showNoMoreData = false;


  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {

  }

  ngOnInit(): void {
    this.showLoading = true;

    this.activatedRoute.paramMap.pipe().subscribe(params => {
      if (params.get("num")) {
        this.tradePairsNum = params.get("num");
      }
    });


    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();

      this.fragmentSubsription = this.activatedRoute.queryParams.subscribe(params => {
        this.showLoading = true;
        this.currentPage = +params.page || 1;
        this.getOnChainAsset(this.currentPage);
      });

      const chainAssetsCounter = interval(60000);
      this.chainAssetsSubsription = chainAssetsCounter.subscribe( n => {
        this.showLoading = false;
        this.getOnChainAsset(this.currentPage);
      });

    });
  }

  getOnChainAsset(page: number) {
    console.log('get on chain asset page:', page);
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/symbols?" + 'page[number]=' + page + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        res['data'].forEach(item => {
          item.price = item.price / 10000;
        });
        this.chainAssets = res['data'];
        if (this.chainAssets.length === 0) {
          this.showNoMoreData = true;
        }
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
    this.chainAssetsSubsription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
  }
}
