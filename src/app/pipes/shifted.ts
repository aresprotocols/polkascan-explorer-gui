import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'ShiftedByLeft12'})
export class ShiftedByLeft12  implements PipeTransform {
  /**
   * @param value 待处理的数据
   * @param args 附加参数
   * @return 处理完成的数据
   */
  transform(value: number, ...args: any[]): any {
    return (value / (Math.pow(10, 12))).toFixed(2);
  }
}
