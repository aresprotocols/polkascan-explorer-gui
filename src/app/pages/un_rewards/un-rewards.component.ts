import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '../../services/app-config.service';
import {HttpClient} from '@angular/common/http';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {web3Accounts, web3Enable, web3FromAddress} from '@polkadot/extension-dapp';
import {InjectedAccountWithMeta} from '@polkadot/extension-inject/types';

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
  public showSelectAccount = false;
  public accounts: string[];
  public selectedAccount: string;
  public claimLoading = false;
  public showSuccess = false;
  public showNoMoreData = false;
  public stakingMap: Map<string, string>;
  public extendsAccount = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {

  }

  ngOnInit(): void {
    this.showLoading = true;

    this.activatedRoute.paramMap.pipe().subscribe(params => {
      if (params.get('num')) {
        this.blocksNum = params.get('num');
      }
    });

    this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();
      this.initPolkadotApi();

      this.fragmentSubsription = this.activatedRoute.queryParams.subscribe(params => {
        this.showLoading = true;
        this.currentPage = +params.page || 1;
        this.getUnRewards(this.currentPage);
      });

      const counter = interval(60000);
      this.unRewardSubsription = counter.subscribe( n => {
        // this.showLoading = false;
        // this.getUnRewards(this.currentPage);
      });

    });
  }

  async initPolkadotApi() {
    if (this.polkaAPI) {
      return;
    }
    const network = this.networkURLPrefix.replace('/', '');
    const url = `wss://${network}.aresprotocol.io`;
    console.log('network url', url);
    const provider = new WsProvider(url);
    try {
      ApiPromise.create({provider}).then(api => {
        this.polkaAPI = api;
        this.getStakingInfo();
        this.getAccounts();
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
    this.unRewards = [];
    this.http.get(url)
      .subscribe(res => {
        console.log(res);
        const unRewards = res['data']['data'];
        res['data']['data'].forEach(item => {
          item.reward = (item.reward / 1000000000000).toFixed(2);
          item.controller = this.stakingMap?.get(item.account) || 'unknown';
        });
        unRewards.sort((a, b) => {
          return b.era - a.era;
        });

        let temp = null;
        const tempAccounts = [];
        const result = [];
        unRewards.forEach(item => {
          if (!tempAccounts.includes(item.account)) {
            tempAccounts.push(item.account);
            temp = item;
            temp.extends = [];
            for (const unReward of unRewards) {
              if (unReward.account === item.account && unReward.era !== item.era) {
                temp.extends.push(unReward);
              }
            }
            const t = JSON.stringify(temp);
            result.push(JSON.parse(t));
            temp = null;
          }
        })
        this.unRewards = result;
        if (this.unRewards.length === 0) {
          this.showNoMoreData = true;
        }
        console.log(result)
      });
  }
  async getAccounts(address?: string) {
    await web3Enable('scan').then(async res => {
      if (res.length === 0) {
        console.log('浏览器没有安装 扩展', res);
        this.showInstallPolkadot = true;
        return;
      }
      if (address) {
        this.showSelectAccount = true;
      }
      // tslint:disable-next-line:no-shadowed-variable
      const accounts = await web3Accounts({ss58Format: 34});
      this.accounts = [];
      accounts.forEach(item => {
        if (address) {
          if (item.address === address) {
            this.accounts.push(item.address);
            this.selectedAccount = item.address;
          }
        } else {
          this.accounts.push(item.address);
          this.selectedAccount = accounts[0].address;
        }
      });
      const injector = await web3FromAddress(this.selectedAccount);
      this.polkaAPI?.setSigner(injector.signer);
    });
  }
  async getStakingInfo() {
    const staking = await this.polkaAPI?.query.staking.bonded.entries();
    const stakingMap = new Map<string, string>();
    staking.forEach(([key, exposure]) => {
      const tmp = key.args.map((k) => k.toHuman());
      stakingMap.set(tmp[0], exposure.toHuman().toString());
    });
    this.stakingMap = stakingMap;
    this.unRewards?.forEach(item => {
      item.controller = this.stakingMap?.get(item.account) || 'unknown';
    });
  }
  async accountChange() {
    console.log('account change', this.selectedAccount);
    const injector = await web3FromAddress(this.selectedAccount);
    this.polkaAPI?.setSigner(injector.signer);
  }
  claim = async () => {
    console.log('claim');
    const v = this;
    v.claimLoading = true;
    v.showSelectAccount = false;
    try {
      const unsub = await v.polkaAPI?.tx.oracleFinance.takeAllPurchaseReward()
        .signAndSend(v.selectedAccount, {}, ({status, events, dispatchError}) => {
          console.log('status', status, 'events', events, 'dispatchError', dispatchError);
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = v.polkaAPI?.registry.findMetaError(dispatchError.asModule);
              // @ts-ignore
              const { docs, name, section } = decoded;
              console.log(`${section}.${name}: ${docs.join(' ')}`);
            }
            unsub();
            v.showError = true;
            v.claimLoading = false;
            console.log(`${dispatchError}`);
          } else if (status.isFinalized) {
            console.log('Successfully claimed rewards');
          }

          if (status.isInBlock) {
            console.log(`claim Transaction included at blockHash ${status.asInBlock}`);
          } else if (status.isFinalized) {
            v.claimLoading = false;
            v.showSuccess = true;
            console.log(`claim Transaction finalized at blockHash ${status.asFinalized}`);
            unsub();
          }
        });
    }
    catch (e) {
      v.claimLoading = false;
    }
  }
  extends = (index, account) => {
    if (!account) {
      return;
    }
    this.unRewards = this.unRewards.filter(item => item.account !== '');
    if (this.extendsAccount === account) {
      this.extendsAccount = '';
      return;
    }
    this.extendsAccount = account;

    const temp = [];
    this.unRewards.forEach(item => {
      temp.push(item);
      if (item.account === account) {
        for (const ex of item.extends) {
          ex.account = '';
          temp.push(ex);
        }
      }
    });
    this.unRewards = temp;
  };
}
