import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';
import { ChainRequest } from 'src/app/classes/chain-request.class';


@Component({
  selector: 'app-request-on-chain',
  templateUrl: './request-on-chain.component.html',
  styleUrls: ['./request-on-chain.component.scss']
})


export class RequestOnChainComponent implements OnInit, OnDestroy {

  public showLoading: boolean;
  currentPage = 1;
  private fragmentSubsription: Subscription;
  private networkSubscription: Subscription;
  private requestSubsription: Subscription;
  public networkURLPrefix: string;
  public chainRequest: ChainRequest [];

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
        this.getOnChainRequest(this.currentPage);
      });


      const counter = interval(60000);
      this.requestSubsription = counter.subscribe( n => {
        this.showLoading = false;
        this.getOnChainRequest(this.currentPage);
      });

    });
  }

  getOnChainRequest(page: number) {
    console.log('get on chain asset page:', page);
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/requests?"  + 'page[number]=' + page + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        this.chainRequest = res['data'];
      });
  }

  ngOnDestroy(): void {
    this.networkSubscription.unsubscribe();
    this.requestSubsription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
  }
}
