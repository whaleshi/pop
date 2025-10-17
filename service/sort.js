import QS from "qs";
/**
 * 测试demo ,假设传入的情况
 *  是数组,返回数组按字母顺序升序
 *  @author kzcming
 *
 * var signStr = {
 account:"97987985",
 username:"0004",
 pay_star_type:"pay_star_ggm",
 service_type:"gm_ibc",
 game_code  :"1",
}
 getKeySort(getObjectKey(signStr));*/

/**
 * 传入对象 ,返回对象的属性数组
 */
function getObjectKey(obj) {
    return Object.keys(obj);
}

/**
 * 传入数组
 * 按字母顺序,升序
 * 冒泡排序
 */
function getKeySort(strArr) {
    var count = 0;
    var compareInt = 0;
    for (var i = 0; i < strArr.length; i++) {
        for (var j = 0; j < strArr.length - 1 - i; j++) {
            /*if(strArr [j].substring(0,1) > strArr[j + 1].substring(0,1)){
                var temp = strArr[j + 1];
                strArr[j + 1] = strArr[j];
                strArr[j] = temp;
            }
            if(strArr [j].substring(0,1) == strArr[j + 1].substring(0,1)){
                if(strArr [j].substring(1,2) > strArr[j + 1].substring(1,2)){
                    var temp = strArr[j + 1];
                    strArr[j + 1] = strArr[j];
                    strArr[j] = temp;
                }
            }*/
            compareToIndexValue(strArr, compareInt, j);
            count++;
        }
    }
    return strArr;
}

/**
 *  根据首字母 排序,如果首字母相同则根据第二个字母排序...直到排出大小
 */
function compareToIndexValue(arr, int, arrIndex) {
    if (arr[arrIndex].substring(int, int + 1) == arr[arrIndex + 1].substring(int, int + 1))
        compareToIndexValue(arr, int + 1, arrIndex);
    //如果第一位相等,则继续比较第二个字符
    else if (arr[arrIndex].substring(int, int + 1) > arr[arrIndex + 1].substring(int, int + 1)) {
        var temp = arr[arrIndex + 1];
        arr[arrIndex + 1] = arr[arrIndex];
        arr[arrIndex] = temp;
    }
    /*else if(arr[arrIndex].substring(int,int+1) < arr[arrIndex + 1].substring(int,int+1)) return;*/
    return;
}

/**
 * 输入排序过后的key=value 值数组,用  "&" 字符拼接为字符串
 */
function getKeyValueSortStr(strArr) {
    var longStr = "";
    for (var str in strArr) {
        longStr += strArr[str] + "&";
    }
    return longStr.substring(0, longStr.length - 1); //移除最后一个 & 符号
}

export const baseString = (data_sign, funName, method, url) => {
    let data = QS.stringify(data_sign);
    var paraArr = data.split("&");
    for (var i = 0; i < paraArr.length; i++) {
        if (paraArr[i].indexOf("=") + 2 > paraArr[i].length) {
            //移除value 为空的参数
            paraArr.splice(i, 1);
            i--;
        }
    }
    var sortParaArr = getKeySort(paraArr);
    var paraStr = getKeyValueSortStr(sortParaArr).replace(/\+/g, " ").replace(/%3A/g, ":"); //得到字符串 , + 是特殊字符,需要转义符号 \
    var http = url.split(funName)[0];
    var baseString = method + "&" + http + funName + "&" + paraStr;
    // data_all.sign = md5.hex_md5(unescape(baseString) + app_secret + this.getCookie('secret'));
    return baseString;
};
