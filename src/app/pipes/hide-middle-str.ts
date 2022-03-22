
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'hideMiddleStr'})
export class HideMiddleStr  implements PipeTransform {
  /**
   * @param value 待处理的数据
   * @param args 附加参数
   * @return 处理完成的数据
   */
  transform(value: string, ...args: any[]): any {
    const frontLen = 20;
    const endLen = 10;
    let newStr = '';
    for (let i = 0; i < 3; i++) {
      newStr += '*';
    }
    return value.substring(0, frontLen) + newStr + value.substring(value.length - endLen);
  }
}
