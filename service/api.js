import { getApiBaseUrl } from "./base";
import { post, _post } from "./tool";

export const getCoinList = (params) => post(getApiBaseUrl() + "/nihao/coin_list", params);
export const getCoinDetails = (params) => post(getApiBaseUrl() + "/nihao/coin_show", params);
export const getCheckData = (params) => post(getApiBaseUrl() + "/nihao/check_data", params);
export const getAddr = (params) => post(getApiBaseUrl() + "/nihao/query_by_user_name", params);
export const getRewardList = (params) => post(getApiBaseUrl() + "/nihao/reward_list", params);
export const getLuckyToken = (params) => post(getApiBaseUrl() + "/nihao/lucky_token", params);
export const getFlywheelData = (params) => post(getApiBaseUrl() + "/nihao/token_buyback", params);
export const getFee = (params) => post(getApiBaseUrl() + "/nihao/query_fee", params);
export const getLotteryRecords = (params) => post(getApiBaseUrl() + "/nihao/lottery_records", params);


