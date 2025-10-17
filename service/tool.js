import QS from "qs";
import axios from "./http";
import { hex_md5 } from "./md5";
import { baseString } from "./sort";
import Cookies from 'js-cookie';
import { useUserStore } from "@/stores/user";
import Router from 'next/router';

export function get(url) {
    return new Promise((resolve, reject) => {
        axios
            .get(url)
            .then((res) => {
                resolve(res.data);
            })
            .catch((err) => {
                reject(err.data);
            });
    });
}
export function post(url, params) {
    return new Promise((resolve, reject) => {
        axios
            .post(url, QS.stringify(params))
            .then((res) => {
                resolve(res.data);
            })
            .catch((err) => {
                reject(err.data);
            });
    });
}
export async function _post(url, params) {
    const token = Cookies.get('login_token');
    const secret = Cookies.get('login_secret');
    if (!token || !secret) {
        Cookies.remove('login_token');
        Cookies.remove('login_secret');
        useUserStore.getState().logout();
        Router.replace('/');
        return Promise.reject(new Error('Not logged in or login has expired'));
    }
    const data_base = {};
    const data = params;
    const timestamp = Date.parse(new Date()) / 1000;
    const nonce = hex_md5(timestamp);

    const app_secret = process.env.NEXT_PUBLIC_APP_SECRET;
    const name = process.env.NEXT_PUBLIC_API_URL;

    let routeName = url.split(name)[1];
    const access_secret = Cookies.get('login_secret') || "我的天哪噜";
    const access_token = Cookies.get('login_token') || "我的天哪噜";
    data.app_id = process.env.NEXT_PUBLIC_APP_ID;
    data.timestamp = timestamp;
    data.access_token = access_token;
    data.lang = "en-US";
    data.nonce = nonce;

    data_base.timestamp = timestamp;
    data_base.nonce = nonce;

    var baseString1 = baseString(data_base, routeName, "POST", url);
    data.sign = hex_md5(baseString1 + app_secret + access_secret);

    return new Promise((resolve, reject) => {
        axios
            .post(url, QS.stringify(data))
            .then((res) => {
                resolve(res.data);
            })
            .catch((err) => {
                reject(err.data);
            });
    });
}

export function post2(url, params) {
    return new Promise((resolve, reject) => {
        axios
            .post(url, params, {})
            .then((res) => {
                resolve(res.data);
            })
            .catch((err) => {
                reject(err.data);
            });
    });
}
