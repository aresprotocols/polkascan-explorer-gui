/*
 * Polkascan Explorer GUI
 *
 * Copyright 2018-2020 openAware BV (NL).
 * This file is part of Polkascan.
 *
 * Polkascan is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Polkascan is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Polkascan. If not, see <http://www.gnu.org/licenses/>.
 *
 * app.component.ts
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {NetworkService} from './services/network.service';
import {DocumentCollection} from 'ngx-jsonapi';
import {Network} from './classes/network.class';
import {AppConfigService} from './services/app-config.service';
import {delay} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {Angulartics2GoogleGlobalSiteTag} from 'angulartics2';
import {environment} from '../environments/environment';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Polkascan';

  public currentNetwork;
  public showNavigation = false;
  public showSubmenus = true;
  public langs = ['en', 'zh', 'ko', 'ja', 'es', 'de', 'ru', 'uk', 'hi', 'pt', 'fr', 'tr', 'th'];
  public selectedLanguage = 'en';

  public networks: DocumentCollection<Network>;

  private networkSubscription: Subscription;
  public showLegalMessage: boolean;

  public aresPrice: number;
  public aresPriceChange: number;

  blockSearchText: string;
  public networkURLPrefix: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private networkService: NetworkService,
    private appConfigService: AppConfigService,
    private angulartics: Angulartics2GoogleGlobalSiteTag,
    private http: HttpClient
  ) {
    angulartics.startTracking();
    router.events.subscribe((val) => {
        this.showNavigation = false;
    });
    translate.addLangs(this.langs);
    translate.setDefaultLang('en');

    this.selectedLanguage = translate.getBrowserLang().match(/en|zh|ko|de|ru|uk|hi|pt|fr|ja|tr|th|es/) ? translate.getBrowserLang() : 'en';
    translate.use(this.selectedLanguage);
  }

  ngOnInit() {
    this.blockSearchText = '';
    if (environment.jsonApiDiscoveryRootUrl) {
      this.networkService.all({remotefilter: {visible: true}}).subscribe(networks => {
        this.networks = networks;
      });
    } else {
      const networks: any = {
        data: [
          {
            attributes: {
              name: 'Odyssey',
              network_id: 'odyssey',
              network_type: 'pre',
              chain_type: 'relay',
              token_symbol: 'ARES',
              token_decimals: 12,
              color_code: '1096f1',
              api_url_root: 'https://aresscan.aresprotocol.io/odyssey/api/v1',
            }
          },
          {
            attributes: {
              name: 'Gladios',
              network_id: 'gladios',
              network_type: 'pre',
              chain_type: 'relay',
              token_symbol: 'ARES',
              token_decimals: 12,
              color_code: '1096f1',
              api_url_root: 'https://aresscan.aresprotocol.io/gladios/api/v1'
            }
          }
        ]
      };
      this.networks = networks;
    }

    this.showLegalMessage = !this.appConfigService.getAgreeWithTerms();

    this.networkSubscription = this.appConfigService.getCurrentNetwork().pipe(delay(1000)).subscribe(network => {
        if (network) {
          this.currentNetwork = network;
          this.networkURLPrefix = this.appConfigService.getUrlPrefix();
          console.log('networkURLPrefix', this.networkURLPrefix);
          console.log('network', network);
        }
      });

      this.getAresData();
    }

  agreeTerms() {
    this.appConfigService.agreeWithTerms();
    this.showLegalMessage = !this.appConfigService.getAgreeWithTerms();
  }

  resetNetwork() {
    this.currentNetwork = null;
  }

  switchNetwork(network: Network) {
    this.appConfigService.setNetwork(network);
  }

  toggleNavigation() {
    this.showNavigation = !this.showNavigation;
  }

  toggleSubmenus() {
    this.showSubmenus = false;
    setTimeout(() => { this.showSubmenus = true; }, 300);
  }

  getAresData(): void {
    this.http.get('https://api.aresprotocol.io/api/getAresAll')
      .subscribe(res => {
        const result = res;
        this.aresPrice = result['data'].price;
        this.aresPriceChange = result['data'].percent_change;
      });
  }

  langsTitle(selectedLang: string) {
    switch (selectedLang) {
      case 'de':
        return 'Deutsch';
      case 'fr':
        return 'Français';
      case 'it':
        return 'Italiano';
      case 'es':
        return 'Español';
      case 'zh':
        return '简体中文';
      case 'ja':
        return '日本語';
      case 'ko':
        return '한국어';
      case 'nl':
        return 'Nederlands';
      case 'pt':
        return 'Português';
      case 'ru':
        return 'Русский';
      case 'th':
        return 'ภาษาไทย';
      case 'tr':
        return 'Türkçe';
      case 'uk':
        return 'Українська';
      case 'hi':
        return 'हिन्दी';
      default:
        return 'English';
    }
  }


  search(): void {
    // Strip whitespace from search text
    console.log(this.blockSearchText);
    // console.log(this.networkURLPrefix);
    this.blockSearchText = this.blockSearchText.trim();
    if (this.blockSearchText !== '') {
      this.router.navigate([this.networkURLPrefix, 'analytics', 'search', this.blockSearchText]);
    }
  }

   ngOnDestroy() {
      // unsubscribe to ensure no memory leaks
      this.networkSubscription.unsubscribe();
  }
}
