import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';


@Component({
  selector: 'app-request-on-chain',
  templateUrl: './era-rewards.component.html',
  styleUrls: ['./era-rewards.component.scss']
})


export class EraRewardsComponent implements OnInit, OnDestroy {

  public showLoading: boolean;
  currentPage = 1;
  private fragmentSubsription: Subscription;
  private networkSubscription: Subscription;
  private eraRequestSubsription: Subscription;
  public networkURLPrefix: string;
  public reward: object[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {

  }

  ngOnInit(): void {
    this.showLoading = true;
    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();

      this.fragmentSubsription = this.activatedRoute.queryParams.subscribe(params => {
        this.showLoading = true;
        this.currentPage = +params.page || 1;
        this.getOnChainEraRequest(this.currentPage);
      });

      const chainAssetsCounter = interval(60000);
      this.eraRequestSubsription = chainAssetsCounter.subscribe( n => {
        this.showLoading = false;
        this.getOnChainEraRequest(this.currentPage);
      });

    });
  }

  getOnChainEraRequest(page: number) {
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/era_requests?"  + 'page[number]=' + page + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        this.reward = res['data'];
        res['data'].forEach(item => {
          item.attributes.era_total_fee = item.attributes.era_total_fee / 1000000000000;
          item.attributes.sign_fee = item.attributes.era_total_points === 0 ? 0 :
            item.attributes.era_total_fee / item.attributes.era_total_points;
        });
      });
  }

  ngOnDestroy(): void {
    this.networkSubscription.unsubscribe();
    this.eraRequestSubsription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
  }
}
