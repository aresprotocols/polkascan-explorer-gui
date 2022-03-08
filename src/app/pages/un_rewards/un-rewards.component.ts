import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {DocumentCollection} from 'ngx-jsonapi';
import {Block} from '../../classes/block.class';
import {HttpClient} from '@angular/common/http';


@Component({
  selector: 'app-request-on-chain',
  templateUrl: './un-rewards.component.html',
  styleUrls: ['./un-rewards.component.scss']
})


export class UnRewardsComponent implements OnInit, OnDestroy {

  public showLoading: boolean;
  currentPage = 1;
  private fragmentSubsription: Subscription;
  private networkSubscription: Subscription;
  private unRewardSubsription: Subscription;
  public networkURLPrefix: string;
  public unRewards: object[];

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
        this.getUnRewards(this.currentPage);
      });

      const counter = interval(60000);
      this.unRewardSubsription = counter.subscribe( n => {
        this.showLoading = false;
        this.getUnRewards(this.currentPage);
      });

    });
  }


  ngOnDestroy(): void {
    this.networkSubscription.unsubscribe();
    this.unRewardSubsription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
  }


  getUnRewards(page: number) {
    console.log('get on chain asset page:', page);
    console.log('get on chain asset page:', page);
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/reward?"  + 'page[number]=' + page + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        this.unRewards = res['data'];
      });
  }

}
