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
 * block.class.ts
 */

import {Resource} from 'ngx-jsonapi';

export class ChainRequest extends Resource {
  public attributes = {
    order_id: 'order_id',
    created_by: 'created_by',
    status: 'status',
    prepayment: 'prepayment',
    payment: 'payment',
    auth: 'auth',
    result: 'result',
    created_at: 'created_at',
    ended_at: 'ended_at',
    symbols: 'symbols'
  };
}
