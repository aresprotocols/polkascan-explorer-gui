import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';
import { ChainRequest } from 'src/app/classes/chain-request.class';
import {ApiPromise, WsProvider} from '@polkadot/api';


@Component({
  selector: 'app-request-on-chain',
  templateUrl: './validator-on-chain.component.html',
  styleUrls: ['./validator-on-chain.component.scss']
})


export class ValidatorOnChainComponent implements OnInit, OnDestroy {

  public showLoading: boolean;
  currentPage = 1;
  private fragmentSubsription: Subscription;
  private networkSubscription: Subscription;
  private requestSubsription: Subscription;
  public networkURLPrefix: string;
  public validator: object [] = [];
  public isShowUnPassInfo = false;
  public selectedAuthorities: string;
  public HostKey: string;
  public HostKeyError: string;
  public consultLoading = false;
  public polkaAPI: ApiPromise;

  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {

  }

  ngOnInit(): void {
    this.showLoading = true;
    // this.initPolkadotApi();

    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();

      this.fragmentSubsription = this.activatedRoute.queryParams.subscribe(params => {
        this.showLoading = true;
        this.currentPage = +params.page || 1;
        this.getValidator(this.currentPage);
      });


      const counter = interval(60000);
      this.requestSubsription = counter.subscribe( n => {
        this.showLoading = false;
        this.getValidator(this.currentPage);
      });

    });
  }

  async getValidator(page: number) {
    console.log('get on chain validator page:', page);
    // await this.getWarehouse();
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/pre_check_tasks?"  + 'page[number]=' + page + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        this.validator = res['data'];
      });
  }

  async getWarehouse(){
    if (!this.polkaAPI) {
      await this.initPolkadotApi();
    }
    await this.polkaAPI.isReadyOrError;

    this.polkaAPI.query.aresOracle.localXRay(1)
      .then(res => {
        console.log('warehouse:', res.toHuman());
      })
      .catch(err => {
        console.log('warehouse err:', err);
      });
  }

  async initPolkadotApi() {
    if (this.polkaAPI) {
      return;
    }
    const provider = new WsProvider('wss://gladios.aresprotocol.io');
    try {
      await ApiPromise.create({provider}).then(api => {
        this.polkaAPI = api;
        console.log("polkaAPI:", this.polkaAPI);
      });
    } catch (e) {
      console.log('init polka api error:', e);
    }
  }

  showUnPassInfo(authorities: string) {
    this.isShowUnPassInfo = true;
    this.selectedAuthorities = authorities;
  }

  closeShowUnPassInfo() {
    this.isShowUnPassInfo = false;
  }

  consult() {
    console.log('consult', this.HostKey);
    this.consultLoading = true;
    setTimeout(() => {
      this.consultLoading = false;
    }, 3000);
  }

  ngOnDestroy(): void {
    this.networkSubscription.unsubscribe();
    this.requestSubsription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
  }
}
