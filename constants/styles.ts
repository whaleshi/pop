// 表单组件的样式常量
export const FORM_STYLES = {
    // Input 组件通用样式
    input: {
        inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
        input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
    },

    // Input 组件 Ticker 特殊样式 (大写+字距)
    tickerInput: {
        inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
        input: "f600 text-[15px] text-[#fff] placeholder:text-[#666] uppercase tracking-[-0.07px]",
    },

    // Textarea 组件样式
    textarea: {
        inputWrapper: "border-[#333] bg-[#1A1A1A] border-1",
        input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
        label: "pb-[8px]",
    },

    // 标签样式
    label: {
        primary: "text-[14px] text-[#AAAAAA]",
        optional: "text-[#666]",
    },

    // 按钮样式
    button: {
        base: "w-full h-[44px] text-[14px] mb-[30px] f600 full rounded-[16px]",
        enabled: "bg-[#24232A] text-[#fff]",
        disabled: "bg-[rgba(148,152,159,0.65)] text-[#FFF]",
    },
};

// 头像上传组件样式
export const AVATAR_STYLES = {
    wrapper: "relative w-[84px] h-[84px] shrink-0 rounded-full overflow-hidden border-[2px] border-[#333] bg-[#1A1A1A]",
    avatar: "w-[80px] h-[80px] border-1 border-[#333] bg-[#1A1A1A]",
    loadingOverlay: "absolute inset-0 bg-black/50 flex items-center justify-center rounded-full",
    loadingSpinner: "w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin",
    fileInput: "opacity-0 w-full h-full absolute top-0 left-0 z-10 cursor-pointer",
    hiddenInput: "sr-only absolute h-0 w-0 p-0 m-0",
    labelError: "text-[#f31260]",
    errorBorder: "border-[#f31260]",
};

// 错误提示样式
export const ERROR_STYLES = {
    fieldError: "text-[12px] text-danger mt-1 leading-[1.1]",
};

// 标签组件工具函数
export const createLabel = (text: string, isOptional?: boolean) => {
    return {
        content: text,
        isOptional,
        className: FORM_STYLES.label.primary,
        optionalClassName: FORM_STYLES.label.optional,
    };
};

// 必填标签工具函数
export const createRequiredLabel = (text: string, hasError?: boolean) => {
    return {
        content: text,
        hasError,
        className: `${FORM_STYLES.label.primary} ${hasError ? AVATAR_STYLES.labelError : ""}`,
        requiredMark: "text-[#f31260] ml-[2px]",
    };
};
