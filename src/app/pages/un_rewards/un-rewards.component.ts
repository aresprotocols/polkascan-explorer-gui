import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {web3Accounts, web3Enable, web3FromAddress} from '@polkadot/extension-dapp';

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
  public unRewards: {[key: string]: any}[];
  public blocksNum: string;
  public polkaAPI: ApiPromise;
  public showInstallPolkadot = false;
  public showNotOnlyYour = false;
  public showError = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {

  }

  ngOnInit(): void {
    this.showLoading = true;

    this.initPolkadotApi();
    this.activatedRoute.paramMap.pipe().subscribe(params => {
      if (params.get('num')) {
        this.blocksNum = params.get('num');
      }
    });

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

  async initPolkadotApi() {
    if (this.polkaAPI) {
      return;
    }
    const provider = new WsProvider('wss://gladios.aresprotocol.io');
    try {
      ApiPromise.create({provider}).then(api => {
        this.polkaAPI = api;
      });
    } catch (e) {
      console.log('init polka api error:', e);
    }
  }
  ngOnDestroy(): void {
    this.networkSubscription.unsubscribe();
    this.unRewardSubsription.unsubscribe();
    this.fragmentSubsription.unsubscribe();
    if (this.polkaAPI) {
      this.polkaAPI.disconnect().then(() => {
        console.log('disconnect polk api');
      });
    }
  }


  getUnRewards(page: number) {
    const url = this.appConfigService.getNetworkApiUrlRoot() + '/oracle/reward?'  + 'page[number]=' + page + '&page[size]=25';
    this.http.get(url)
      .subscribe(res => {
        console.log(res);
        this.unRewards = res['data']['data'];
        res['data']['data'].forEach(item => {
          item.reward = (item.reward / 1000000000000).toFixed(2);
        });
      });
  }
  claim = async (validatorAddress) => {
    console.log('claim');
    const v = this;
    await web3Enable('scan').then(async res => {
      if (res.length === 0) {
        console.log('浏览器没有安装 扩展', res);
        this.showInstallPolkadot = true;
        return;
      }
      // tslint:disable-next-line:no-shadowed-variable
      const accounts = await web3Accounts({ss58Format: 34 });
      //
      // let onlyYour = false;
      // let address = '';
      // // tslint:disable-next-line:prefer-for-of
      // for (let i = 0; i < accounts.length; i++) {
      //   if (accounts[i].address.toUpperCase() === validatorAddress.toUpperCase()) {
      //     onlyYour = true;
      //     address = accounts[i].address;
      //     break;
      //   }
      // }
      // if (!onlyYour) {
      //   v.showNotOnlyYour = true;
      //   return;
      // }

      const injector = await web3FromAddress(accounts[0].address);
      v.polkaAPI?.setSigner(injector.signer);

      const unsub = await v.polkaAPI?.tx.oracleFinance.takeAllPurchaseReward()
        .signAndSend(accounts[0].address, {}, ({status, events, dispatchError}) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = v.polkaAPI?.registry.findMetaError(dispatchError.asModule);
              // @ts-ignore
              const { docs, name, section } = decoded;
              console.log(`${section}.${name}: ${docs.join(' ')}`);
            }
            this.showError = true;
            console.log(`${dispatchError}`);
          } else if (status.isFinalized) {
            console.log('Successfully claimed rewards');
          }

          if (status.isInBlock) {
            console.log(`claim Transaction included at blockHash ${status.asInBlock}`);
          } else if (status.isFinalized) {
            console.log(`claim Transaction finalized at blockHash ${status.asFinalized}`);
            unsub();
          }
        });
    });
  }
}
