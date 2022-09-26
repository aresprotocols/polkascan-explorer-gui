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
  public HostKey: number;
  public HostKeyError: string;
  public consultLoading = false;
  public showNoMoreData = false;
  public isLoading = false;
  public polkaAPI: ApiPromise;
  public wareHouseStatus = '';
  public nodeType: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {

  }

  ngOnInit(): void {
    this.showLoading = true;
    this.initPolkadotApi();

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
    this.isLoading = true;
    this.validator = [];
    const url = this.appConfigService.getNetworkApiUrlRoot() + "/oracle/pre_check_tasks?"  + 'page[number]=' + page + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        this.validator = res['data'];
        this.isLoading = false;
        if (this.validator.length === 0) {
          this.showNoMoreData = true;
        } else {
          this.validator.sort((a, b) => {
            return b['block_number'] - a['block_number'];
          })
        }
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

  async consult() {
    console.log('consult', this.HostKey);
    this.consultLoading = true;
    fetch(`${this.appConfigService.getNetworkApiUrlRoot()}/oracle/ares/author/${this.HostKey}/${this.selectedAuthorities}`)
      .then(res => res.json())
      .then(res => {
        console.log('consult res:', res);
        if (res.data === 'The set time did not exceed 1 era, please wait') {
          this.HostKeyError = 'exceed';
        } else if (res.data === 'Submit feedback to the project') {
          this.HostKeyError = 'feedback';
        } else {
          this.HostKeyError = 'notMatch';
        }
        this.consultLoading = false;
      })
      .catch(err => {
        console.log('consult err:', err);
        this.consultLoading = false;
      });

    // tslint:disable-next-line:no-eval
    const key = Number(this.HostKey).toString(10);
    await this.polkaAPI?.query.aresOracle.localXRay(key)
      .then(res => {
        console.log('localXRay res:', res.toHuman());
        const url = res.toHuman()[1];
        this.nodeType = res.toHuman()[3];
        fetch(url + '/api/getAresAll')
          .then(res => res.json())
          .then(res => {
            if (res.code === 0) {
              this.wareHouseStatus = 'Available';
            } else {
              this.wareHouseStatus = 'Not Available';
            }
          })
          .catch(err => {
            console.log('warehouse err:', err);
          });
      })
      .catch(err => {
        this.wareHouseStatus = 'Not Available';
        console.log('warehouse err:', err);
      });
  }

  ngOnDestroy(): void {
    this.networkSubscription.unsubscribe();
    this.requestSubsription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
    this.polkaAPI?.disconnect();
  }
}
