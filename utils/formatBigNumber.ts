import BigNumber from "bignumber.js";

type FormatMode = "default" | "zeroCount" | "subscript";

type FormatBigNumberOptions = {
    /**
     * token 精度（例如 USDC 是 6），默认 0
     */
    decimals?: number;
    /**
     * 保留小数位数，默认 0
     */
    precision?: number;
    /**
     * 是否添加千位分隔符，默认 false
     */
    withComma?: boolean;
    /**
     * 是否缩写（K / M / B / Q），默认 true
     */
    compact?: boolean;
    /**
     * 是否去除尾部无意义的 0，默认 true
     */
    trimTrailingZero?: boolean;
    /**
     * 格式化模式，支持：
     * - "default": 默认格式
     * - "zeroCount": 使用括号表示前导零数量
     * - "subscript": 使用 Unicode 下标数字表示前导零数量
     */
    mode?: FormatMode;
};

/**
 * 格式化大数，支持缩写、千位分隔符和特殊的小数零展示格式。
 *
 * @param value 需要格式化的数字，支持字符串、数字、BigNumber 或 bigint。
 * @param options 配置项，详见 FormatBigNumberOptions 类型。
 * @returns 返回格式化后的字符串。
 *
 * @example
 * ```ts
 * formatBigNumber("1035000000000000000", { decimals: 18, withComma: false })
 * // => "1.035"
 *
 * formatBigNumber("0.00000123", { mode: "subscript" })
 * // => "0.0₅123"
 * ```
 */
export function formatBigNumber(value: string | number | BigNumber | bigint, options?: FormatBigNumberOptions): string {
    // 内部辅助函数：数字转下标字符串
    const toSubscript = (n: number): string => {
        const map = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
        return n
            .toString()
            .split("")
            .map((d) => map[+d])
            .join("");
    };

    const opts = options || {};
    const { decimals = 0, withComma = false, compact = true, trimTrailingZero = true, mode = "subscript" } = opts;

    const inputPrecision = opts.precision;

    let bigValue: BigNumber;
    try {
        bigValue = new BigNumber(value.toString());
    } catch {
        return "0";
    }

    const isNegative = bigValue.isNegative();
    bigValue = bigValue.abs();

    if (decimals > 0) {
        bigValue = bigValue.dividedBy(new BigNumber(10).pow(decimals));
    }

    let precision: number;
    if (typeof inputPrecision === "number") {
        precision = inputPrecision;
    } else {
        if (compact && bigValue.gte(1000)) {
            precision = 2;
        } else if (bigValue.gte(0.0001)) {
            precision = 4;
        } else {
            precision = 18; // 极小数用高精度处理
        }
    }

    if (compact && bigValue.gte(1000)) {
        const trillion = new BigNumber(1e12);
        const quadrillion = new BigNumber(1e15);
        const billion = new BigNumber(1e9);
        const million = new BigNumber(1e6);
        const thousand = new BigNumber(1e3);
        const maxSupported = quadrillion.multipliedBy(999); // 999Q

        if (bigValue.gt(maxSupported)) {
            return (isNegative ? "-" : "") + "> 999Q";
        }

        if (bigValue.gte(quadrillion)) {
            let val = bigValue.dividedBy(quadrillion).decimalPlaces(precision, BigNumber.ROUND_DOWN);
            let formatted = val.toString();
            if (trimTrailingZero) formatted = new BigNumber(formatted).toString();
            return (isNegative ? "-" : "") + formatted + "Q";
        }

        if (bigValue.gte(trillion)) {
            let val = bigValue.dividedBy(trillion).decimalPlaces(precision, BigNumber.ROUND_DOWN);
            let formatted = val.toString();
            if (trimTrailingZero) formatted = new BigNumber(formatted).toString();
            return (isNegative ? "-" : "") + formatted + "T";
        }

        if (bigValue.gte(billion)) {
            let val = bigValue.dividedBy(billion).decimalPlaces(precision, BigNumber.ROUND_DOWN);
            let formatted = val.toString();
            if (trimTrailingZero) formatted = new BigNumber(formatted).toString();
            return (isNegative ? "-" : "") + formatted + "B";
        }
        if (bigValue.gte(million)) {
            let val = bigValue.dividedBy(million).decimalPlaces(precision, BigNumber.ROUND_DOWN);
            let formatted = val.toString();
            if (trimTrailingZero) formatted = new BigNumber(formatted).toString();
            return (isNegative ? "-" : "") + formatted + "M";
        }
        if (bigValue.gte(thousand)) {
            let val = bigValue.dividedBy(thousand).decimalPlaces(precision, BigNumber.ROUND_DOWN);
            let formatted = val.toString();
            if (trimTrailingZero) formatted = new BigNumber(formatted).toString();
            return (isNegative ? "-" : "") + formatted + "K";
        }
    }

    const SUBSCRIPT_THRESHOLD = new BigNumber(0.001);

    if (bigValue.gte(SUBSCRIPT_THRESHOLD)) {
        let fixed = bigValue.toFixed(precision || 4, BigNumber.ROUND_DOWN);
        if (trimTrailingZero) {
            fixed = new BigNumber(fixed).toString();
        }
        if (withComma) {
            const [intPart, decPart] = fixed.split(".");
            const withThousands = decPart ? Number(intPart).toLocaleString() + "." + decPart : Number(intPart).toLocaleString();
            return isNegative ? "-" + withThousands : withThousands;
        }
        return isNegative ? "-" + fixed : fixed;
    } else {
        const fixed = bigValue.toFixed(18, BigNumber.ROUND_DOWN);
        const decimalPart = fixed.slice(2);
        const match = decimalPart.match(/^(0*)(\d+)/);
        if (match) {
            const zeroCount = match[1].length;
            let digits = match[2].slice(0, 4).replace(/0+$/, "");
            if (!digits) return "0";
            const formatted =
                mode === "subscript"
                    ? `0.0${toSubscript(zeroCount)}${digits}`
                    : mode === "zeroCount"
                    ? `0.0{${zeroCount}}${digits}`
                    : `0.${"0".repeat(zeroCount)}${digits}`;
            return isNegative ? "-" + formatted : formatted;
        }
    }

    return isNegative ? "-0" : "0";
}
