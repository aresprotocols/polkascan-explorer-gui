import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {DocumentCollection} from 'ngx-jsonapi';
import {Block} from '../../classes/block.class';


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
  public networkURLPrefix: string;
  public assets: DocumentCollection<Block>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService
  ) {

  }

  ngOnInit(): void {
    this.showLoading = true;

    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();

      this.fragmentSubsription = this.activatedRoute.queryParams.subscribe(params => {
        this.showLoading = true;
        this.currentPage = +params.page || 1;
        this.getOnChainRequest(this.currentPage);
      });

    });
  }


  ngOnDestroy(): void {
  }


  getOnChainRequest(page: number) {
    console.log('get on chain asset page:', page);
  }

}
